const pool = require('../db/primary');

const listarProductos = async (req, res) => {
  const { buscar, categoria_id, tipo_id, variante_id, stock_bajo } = req.query;

  try {
    let query = `
      SELECT 
        p.id,
        c.nombre AS categoria,
        t.nombre AS tipo,
        v.nombre AS variante,
        p.marca,
        p.unidad_medida,
        p.precio,
        p.stock,
        p.stock_min,
        CONCAT(t.nombre, ' ', v.nombre, ' ', p.marca) AS producto,
        CASE 
          WHEN p.stock <= p.stock_min THEN true
          ELSE false
        END AS alerta_stock
      FROM public.productos p
      JOIN public.categorias c ON c.id = p.categoria_id
      JOIN public.tipos_producto t ON t.id = p.tipo_id
      JOIN public.variantes_producto v ON v.id = p.variante_id
      WHERE p.empresa_id = $1
    `;

    const values = [1];

    if (buscar) {
      values.push(`%${buscar}%`);
      query += `
        AND (
          t.nombre ILIKE $${values.length}
          OR v.nombre ILIKE $${values.length}
          OR p.marca ILIKE $${values.length}
          OR c.nombre ILIKE $${values.length}
        )
      `;
    }

    if (categoria_id) {
      values.push(categoria_id);
      query += ` AND p.categoria_id = $${values.length}`;
    }

    if (tipo_id) {
      values.push(tipo_id);
      query += ` AND p.tipo_id = $${values.length}`;
    }

    if (variante_id) {
      values.push(variante_id);
      query += ` AND p.variante_id = $${values.length}`;
    }

    if (stock_bajo === 'true') {
      query += ` AND p.stock <= p.stock_min`;
    }

    query += `
      ORDER BY alerta_stock DESC, c.nombre, t.nombre, v.nombre, p.marca
    `;

    const result = await pool.query(query, values);

    res.json({
      total: result.rows.length,
      productos: result.rows,
    });
  } catch (error) {
    console.error('ERROR LISTANDO PRODUCTOS:', error);
    res.status(500).json({
      msg: 'Error al listar productos',
      error: error.message,
    });
  }
};

const productosStockBajo = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        p.id,
        c.nombre AS categoria,
        t.nombre AS tipo,
        v.nombre AS variante,
        p.marca,
        p.unidad_medida,
        p.precio,
        p.stock,
        p.stock_min,
        CONCAT(t.nombre, ' ', v.nombre, ' ', p.marca) AS producto,
        (p.stock_min - p.stock) AS cantidad_faltante
      FROM public.productos p
      JOIN public.categorias c ON c.id = p.categoria_id
      JOIN public.tipos_producto t ON t.id = p.tipo_id
      JOIN public.variantes_producto v ON v.id = p.variante_id
      WHERE p.empresa_id = $1
      AND p.stock <= p.stock_min
      ORDER BY cantidad_faltante DESC
      `,
      [1]
    );

    res.json({
      total: result.rows.length,
      alerta: result.rows.length > 0,
      productos: result.rows,
    });
  } catch (error) {
    console.error('ERROR STOCK BAJO:', error);
    res.status(500).json({ msg: 'Error al obtener productos con stock bajo' });
  }
};

const crearProducto = async (req, res) => {
  const {
    categoria_id,
    tipo_id,
    variante_id,
    marca,
    unidad_medida,
    precio,
    stock,
    stock_min,
  } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO public.productos
      (empresa_id, categoria_id, tipo_id, variante_id, marca, unidad_medida, precio, stock, stock_min)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [1, categoria_id, tipo_id, variante_id, marca, unidad_medida, precio, stock, stock_min]
    );

    res.status(201).json({
      msg: 'Producto creado correctamente',
      producto: result.rows[0],
    });
  } catch (error) {
    console.error('ERROR CREANDO PRODUCTO:', error);
    res.status(500).json({ msg: 'Error al crear producto' });
  }
};

const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const {
    categoria_id,
    tipo_id,
    variante_id,
    marca,
    unidad_medida,
    precio,
    stock,
    stock_min,
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE public.productos
      SET categoria_id = $1,
          tipo_id = $2,
          variante_id = $3,
          marca = $4,
          unidad_medida = $5,
          precio = $6,
          stock = $7,
          stock_min = $8
      WHERE id = $9 AND empresa_id = $10
      RETURNING *
      `,
      [categoria_id, tipo_id, variante_id, marca, unidad_medida, precio, stock, stock_min, id, 1]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    res.json({
      msg: 'Producto actualizado correctamente',
      producto: result.rows[0],
    });
  } catch (error) {
    console.error('ERROR ACTUALIZANDO PRODUCTO:', error);
    res.status(500).json({ msg: 'Error al actualizar producto' });
  }
};

const actualizarPrecio = async (req, res) => {
  const { id } = req.params;
  const { precio } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE public.productos
      SET precio = $1
      WHERE id = $2 AND empresa_id = $3
      RETURNING *
      `,
      [precio, id, 1]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    res.json({ msg: 'Precio actualizado correctamente' });
  } catch (error) {
    console.error('ERROR ACTUALIZANDO PRECIO:', error);
    res.status(500).json({ msg: 'Error actualizando precio' });
  }
};

const actualizarStock = async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE public.productos
      SET stock = $1
      WHERE id = $2 AND empresa_id = $3
      RETURNING *
      `,
      [stock, id, 1]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    res.json({ msg: 'Stock actualizado correctamente' });
  } catch (error) {
    console.error('ERROR ACTUALIZANDO STOCK:', error);
    res.status(500).json({ msg: 'Error actualizando stock' });
  }
};

const eliminarProducto = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM public.productos
      WHERE id = $1 AND empresa_id = $2
      RETURNING *
      `,
      [id, 1]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    res.json({
      msg: 'Producto eliminado correctamente',
      producto: result.rows[0],
    });
  } catch (error) {
    console.error('ERROR ELIMINANDO PRODUCTO:', error);
    res.status(500).json({ msg: 'Error al eliminar producto' });
  }
};

module.exports = {
  listarProductos,
  productosStockBajo,
  crearProducto,
  actualizarProducto,
  actualizarPrecio,
  actualizarStock,
  eliminarProducto,
};