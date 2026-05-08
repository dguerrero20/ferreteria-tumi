const pool = require('../db/primary');

const reporteVentasPorFechas = async (req, res) => {
  const { desde, hasta } = req.query;

  try {
    let query = `
      SELECT
        v.id,
        v.total,
        v.created_at,
        u.nombre AS vendedor
      FROM public.ventas v
      LEFT JOIN public.usuarios u ON u.id = v.usuario_id
      WHERE v.empresa_id = $1
    `;

    const values = [1];

    if (desde) {
      values.push(desde);
      query += ` AND DATE(v.created_at) >= $${values.length}`;
    }

    if (hasta) {
      values.push(hasta);
      query += ` AND DATE(v.created_at) <= $${values.length}`;
    }

    query += ` ORDER BY v.created_at DESC`;

    const result = await pool.query(query, values);

    const totalIngresos = result.rows.reduce(
      (sum, venta) => sum + Number(venta.total),
      0
    );

    res.json({
      total_ventas: result.rows.length,
      total_ingresos: totalIngresos,
      ventas: result.rows,
    });
  } catch (error) {
    console.error('ERROR REPORTE VENTAS:', error);
    res.status(500).json({
      msg: 'Error generando reporte de ventas',
      error: error.message,
    });
  }
};

const productosMasVendidos = async (req, res) => {
  const { desde, hasta } = req.query;

  try {
    let query = `
      SELECT
        p.id,
        CONCAT(t.nombre, ' ', vp.nombre, ' ', p.marca) AS producto,
        c.nombre AS categoria,
        SUM(vd.cantidad) AS cantidad_vendida,
        SUM(vd.subtotal) AS total_vendido
      FROM public.ventas_detalle vd
      JOIN public.ventas v ON v.id = vd.venta_id
      JOIN public.productos p ON p.id = vd.producto_id
      JOIN public.categorias c ON c.id = p.categoria_id
      JOIN public.tipos_producto t ON t.id = p.tipo_id
      JOIN public.variantes_producto vp ON vp.id = p.variante_id
      WHERE v.empresa_id = $1
    `;

    const values = [1];

    if (desde) {
      values.push(desde);
      query += ` AND DATE(v.created_at) >= $${values.length}`;
    }

    if (hasta) {
      values.push(hasta);
      query += ` AND DATE(v.created_at) <= $${values.length}`;
    }

    query += `
      GROUP BY p.id, producto, c.nombre
      ORDER BY cantidad_vendida DESC
      LIMIT 10
    `;

    const result = await pool.query(query, values);

    res.json({
      total: result.rows.length,
      productos: result.rows,
    });
  } catch (error) {
    console.error('ERROR PRODUCTOS MÁS VENDIDOS:', error);
    res.status(500).json({
      msg: 'Error generando productos más vendidos',
      error: error.message,
    });
  }
};

const productosMenosVendidos = async (req, res) => {
  const { desde, hasta } = req.query;

  try {
    let query = `
      SELECT
        p.id,
        CONCAT(t.nombre, ' ', vp.nombre, ' ', p.marca) AS producto,
        c.nombre AS categoria,
        COALESCE(SUM(vd.cantidad), 0) AS cantidad_vendida,
        COALESCE(SUM(vd.subtotal), 0) AS total_vendido
      FROM public.productos p
      JOIN public.categorias c ON c.id = p.categoria_id
      JOIN public.tipos_producto t ON t.id = p.tipo_id
      JOIN public.variantes_producto vp ON vp.id = p.variante_id
      LEFT JOIN public.ventas_detalle vd ON vd.producto_id = p.id
      LEFT JOIN public.ventas v ON v.id = vd.venta_id
      WHERE p.empresa_id = $1
    `;

    const values = [1];

    if (desde) {
      values.push(desde);
      query += ` AND (v.created_at IS NULL OR DATE(v.created_at) >= $${values.length})`;
    }

    if (hasta) {
      values.push(hasta);
      query += ` AND (v.created_at IS NULL OR DATE(v.created_at) <= $${values.length})`;
    }

    query += `
      GROUP BY p.id, producto, c.nombre
      ORDER BY cantidad_vendida ASC
      LIMIT 10
    `;

    const result = await pool.query(query, values);

    res.json({
      total: result.rows.length,
      productos: result.rows,
    });
  } catch (error) {
    console.error('ERROR PRODUCTOS MENOS VENDIDOS:', error);
    res.status(500).json({
      msg: 'Error generando productos menos vendidos',
      error: error.message,
    });
  }
};

const vendedoresTop = async (req, res) => {
  const { desde, hasta, vendedores } = req.query;

  try {
    let query = `
      SELECT
        u.id,
        u.nombre AS vendedor,
        COUNT(v.id) AS cantidad_ventas,
        COALESCE(SUM(v.total), 0) AS total_vendido
      FROM public.usuarios u
      LEFT JOIN public.ventas v ON v.usuario_id = u.id
      WHERE u.empresa_id = $1
      AND u.rol = 'vendedor'
    `;

    const values = [1];

    if (desde) {
      values.push(desde);
      query += ` AND (v.created_at IS NULL OR DATE(v.created_at) >= $${values.length})`;
    }

    if (hasta) {
      values.push(hasta);
      query += ` AND (v.created_at IS NULL OR DATE(v.created_at) <= $${values.length})`;
    }

    if (vendedores) {
      const ids = vendedores.split(',').map(Number).filter(Boolean);
      if (ids.length > 0) {
        values.push(ids);
        query += ` AND u.id = ANY($${values.length})`;
      }
    }

    query += `
      GROUP BY u.id, u.nombre
      ORDER BY total_vendido DESC
    `;

    const result = await pool.query(query, values);

    res.json({
      total: result.rows.length,
      vendedores: result.rows,
    });
  } catch (error) {
    console.error('ERROR VENDEDORES TOP:', error);
    res.status(500).json({
      msg: 'Error generando vendedores top',
      error: error.message,
    });
  }
};

module.exports = {
  reporteVentasPorFechas,
  productosMasVendidos,
  productosMenosVendidos,
  vendedoresTop,
};