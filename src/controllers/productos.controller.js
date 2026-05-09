const pool = require('../db/primary');

function obtenerEmpresaId(req) {
  return req.query.empresa_id || req.body.empresa_id;
}

const listarProductos = async (req, res) => {
  const { buscar, categoria_id, tipo_id, variante_id, stock_bajo } = req.query;
  const empresa_id = obtenerEmpresaId(req);

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

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
        CASE WHEN p.stock <= p.stock_min THEN true ELSE false END AS alerta_stock
      FROM public.productos p
      JOIN public.categorias c ON c.id = p.categoria_id
      JOIN public.tipos_producto t ON t.id = p.tipo_id
      JOIN public.variantes_producto v ON v.id = p.variante_id
      WHERE p.empresa_id = $1
    `;

    const values = [empresa_id];

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

    query += ` ORDER BY alerta_stock DESC, c.nombre, t.nombre, v.nombre, p.marca`;

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
  const empresa_id = obtenerEmpresaId(req);

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

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
      [empresa_id]
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
    empresa_id,
    categoria_id,
    tipo_id,
    variante_id,
    marca,
    unidad_medida,
    precio,
    stock,
    stock_min,
  } = req.body;

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO public.productos
      (empresa_id, categoria_id, tipo_id, variante_id, marca, unidad_medida, precio, stock, stock_min)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [empresa_id, categoria_id, tipo_id, variante_id, marca, unidad_medida, precio, stock, stock_min]
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

const actualizarPrecio = async (req, res) => {
  const { id } = req.params;
  const { precio, empresa_id } = req.body;

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  try {
    const result = await pool.query(
      `
      UPDATE public.productos
      SET precio = $1
      WHERE id = $2 AND empresa_id = $3
      RETURNING *
      `,
      [precio, id, empresa_id]
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
  const { stock, empresa_id } = req.body;

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  try {
    const result = await pool.query(
      `
      UPDATE public.productos
      SET stock = $1
      WHERE id = $2 AND empresa_id = $3
      RETURNING *
      `,
      [stock, id, empresa_id]
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
  const { empresa_id } = req.body;

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  try {
    const result = await pool.query(
      `
      DELETE FROM public.productos
      WHERE id = $1 AND empresa_id = $2
      RETURNING *
      `,
      [id, empresa_id]
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
  actualizarPrecio,
  actualizarStock,
  eliminarProducto,
};