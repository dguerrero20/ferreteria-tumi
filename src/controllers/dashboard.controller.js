const pool = require('../db/primary');

const obtenerDashboard = async (req, res) => {
  try {
    const totalProductos = await pool.query(
      `SELECT COUNT(*) AS total FROM public.productos WHERE empresa_id = $1`,
      [1]
    );

    const totalCategorias = await pool.query(
      `SELECT COUNT(*) AS total FROM public.categorias WHERE empresa_id = $1`,
      [1]
    );

    const totalVentas = await pool.query(
      `SELECT COUNT(*) AS total FROM public.ventas WHERE empresa_id = $1`,
      [1]
    );

    const ingresosTotales = await pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total FROM public.ventas WHERE empresa_id = $1`,
      [1]
    );

    const stockBajo = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM public.productos
      WHERE empresa_id = $1
      AND stock <= stock_min
      `,
      [1]
    );

    const ultimasVentas = await pool.query(
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
      LIMIT 5
      `,
      [1]
    );

    res.json({
      resumen: {
        total_productos: Number(totalProductos.rows[0].total),
        total_categorias: Number(totalCategorias.rows[0].total),
        total_ventas: Number(totalVentas.rows[0].total),
        ingresos_totales: Number(ingresosTotales.rows[0].total),
        productos_stock_bajo: Number(stockBajo.rows[0].total),
      },
      ultimas_ventas: ultimasVentas.rows,
    });
  } catch (error) {
    console.error('ERROR DASHBOARD:', error);

    res.status(500).json({
      msg: 'Error al obtener dashboard',
      error: error.message,
    });
  }
};

module.exports = {
  obtenerDashboard,
};