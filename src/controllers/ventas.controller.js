const pool = require('../db/primary');

function obtenerEmpresaId(req) {
  return req.query.empresa_id || req.body.empresa_id;
}

const registrarVenta = async (req, res) => {
  const { empresa_id, usuario_id, productos } = req.body;

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (!productos || productos.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        msg: 'Debe agregar productos a la venta',
      });
    }

    let total = 0;

    for (const item of productos) {
      const productoResult = await client.query(
        `
        SELECT id, stock, precio
        FROM public.productos
        WHERE id = $1 AND empresa_id = $2
        `,
        [item.producto_id, empresa_id]
      );

      if (productoResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          msg: `Producto ${item.producto_id} no encontrado`,
        });
      }

      const producto = productoResult.rows[0];

      if (Number(producto.stock) < Number(item.cantidad)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          msg: `Stock insuficiente para producto ID ${item.producto_id}`,
          stock_disponible: producto.stock,
        });
      }

      total += Number(producto.precio) * Number(item.cantidad);
    }

    const ventaResult = await client.query(
      `
      INSERT INTO public.ventas
      (empresa_id, usuario_id, total)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [empresa_id, usuario_id, total]
    );

    const venta = ventaResult.rows[0];

    for (const item of productos) {
      const productoResult = await client.query(
        `
        SELECT id, stock, precio
        FROM public.productos
        WHERE id = $1 AND empresa_id = $2
        `,
        [item.producto_id, empresa_id]
      );

      const producto = productoResult.rows[0];
      const subtotal = Number(producto.precio) * Number(item.cantidad);

      await client.query(
        `
        INSERT INTO public.ventas_detalle
        (venta_id, producto_id, cantidad, precio_unitario, subtotal)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [venta.id, item.producto_id, item.cantidad, producto.precio, subtotal]
      );

      await client.query(
        `
        UPDATE public.productos
        SET stock = stock - $1
        WHERE id = $2 AND empresa_id = $3
        `,
        [item.cantidad, item.producto_id, empresa_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      msg: 'Venta registrada correctamente',
      venta_id: venta.id,
      total,
    });
  } catch (error) {
    await client.query('ROLLBACK');

    console.error('ERROR REGISTRANDO VENTA:', error);

    res.status(500).json({
      msg: 'Error al registrar venta',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

const listarVentas = async (req, res) => {
  const empresa_id = obtenerEmpresaId(req);

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        v.id,
        v.total,
        v.created_at,
        u.nombre AS usuario
      FROM public.ventas v
      LEFT JOIN public.usuarios u
      ON u.id = v.usuario_id
      WHERE v.empresa_id = $1
      ORDER BY v.id DESC
      `,
      [empresa_id]
    );

    res.json({
      total: result.rows.length,
      ventas: result.rows,
    });
  } catch (error) {
    console.error('ERROR LISTANDO VENTAS:', error);

    res.status(500).json({
      msg: 'Error al listar ventas',
      error: error.message,
    });
  }
};

const detalleVenta = async (req, res) => {
  const { id } = req.params;
  const empresa_id = obtenerEmpresaId(req);

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  try {
    const ventaResult = await pool.query(
      `
      SELECT
        v.id,
        v.total,
        v.created_at,
        u.nombre AS usuario
      FROM public.ventas v
      LEFT JOIN public.usuarios u
      ON u.id = v.usuario_id
      WHERE v.id = $1 AND v.empresa_id = $2
      `,
      [id, empresa_id]
    );

    if (ventaResult.rows.length === 0) {
      return res.status(404).json({
        msg: 'Venta no encontrada',
      });
    }

    const detalleResult = await pool.query(
      `
      SELECT
        vd.id,
        vd.producto_id,
        CONCAT(t.nombre, ' ', vp.nombre, ' ', p.marca) AS producto,
        p.unidad_medida,
        vd.cantidad,
        vd.precio_unitario,
        vd.subtotal
      FROM public.ventas_detalle vd
      JOIN public.productos p ON p.id = vd.producto_id
      JOIN public.tipos_producto t ON t.id = p.tipo_id
      JOIN public.variantes_producto vp ON vp.id = p.variante_id
      WHERE vd.venta_id = $1
      AND p.empresa_id = $2
      ORDER BY vd.id
      `,
      [id, empresa_id]
    );

    res.json({
      venta: ventaResult.rows[0],
      detalle: detalleResult.rows,
    });
  } catch (error) {
    console.error('ERROR DETALLE VENTA:', error);

    res.status(500).json({
      msg: 'Error al obtener detalle de venta',
      error: error.message,
    });
  }
};

module.exports = {
  registrarVenta,
  listarVentas,
  detalleVenta,
};