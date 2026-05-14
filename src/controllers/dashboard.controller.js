const pool = require('../db/primary');

const obtenerDashboard = async (req, res) => {
  const { empresa_id } = req.query;

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  try {
    const totalProductos = await pool.query(
      `SELECT COUNT(*) AS total FROM public.productos WHERE empresa_id = $1`,
      [empresa_id]
    );

    const totalCategorias = await pool.query(
      `SELECT COUNT(*) AS total FROM public.categorias WHERE empresa_id = $1`,
      [empresa_id]
    );

    const totalVentas = await pool.query(
      `SELECT COUNT(*) AS total FROM public.ventas WHERE empresa_id = $1`,
      [empresa_id]
    );

    const ingresosTotales = await pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total FROM public.ventas WHERE empresa_id = $1`,
      [empresa_id]
    );

    const stockBajo = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM public.productos
      WHERE empresa_id = $1
      AND stock <= stock_min
      `,
      [empresa_id]
    );

    const ventasHoy = await pool.query(
  `
  SELECT COALESCE(SUM(total), 0) AS total
  FROM public.ventas
  WHERE empresa_id = $1
  AND (created_at AT TIME ZONE 'America/Lima')::date =
      (NOW() AT TIME ZONE 'America/Lima')::date
  `,
  [empresa_id]
);

const ventasAyer = await pool.query(
  `
  SELECT COALESCE(SUM(total), 0) AS total
  FROM public.ventas
  WHERE empresa_id = $1
  AND (created_at AT TIME ZONE 'America/Lima')::date =
      ((NOW() AT TIME ZONE 'America/Lima')::date - INTERVAL '1 day')::date
  `,
  [empresa_id]
);

const ventasSemana = await pool.query(
  `
  WITH dias AS (
    SELECT generate_series(
      date_trunc('week', (NOW() AT TIME ZONE 'America/Lima')::date)::date,
      (date_trunc('week', (NOW() AT TIME ZONE 'America/Lima')::date)::date + INTERVAL '6 days')::date,
      INTERVAL '1 day'
    )::date AS fecha
  )
  SELECT
    dias.fecha,
    COALESCE(SUM(v.total), 0) AS total
  FROM dias
  LEFT JOIN public.ventas v
    ON (v.created_at AT TIME ZONE 'America/Lima')::date = dias.fecha
    AND v.empresa_id = $1
  GROUP BY dias.fecha
  ORDER BY dias.fecha
  `,
  [empresa_id]
);

    const ultimasVentas = await pool.query(
      `
      SELECT
        v.id,
        v.total,
        v.created_at,
        u.nombre AS usuario
      FROM public.ventas v
      LEFT JOIN public.usuarios u ON u.id = v.usuario_id
      WHERE v.empresa_id = $1
      ORDER BY v.id DESC
      LIMIT 5
      `,
      [empresa_id]
    );

    const hoy = Number(ventasHoy.rows[0].total || 0);
    const ayer = Number(ventasAyer.rows[0].total || 0);

    let porcentajeVsAyer = 0;

    if (ayer > 0) {
      porcentajeVsAyer = ((hoy - ayer) / ayer) * 100;
    } else if (hoy > 0) {
      porcentajeVsAyer = 100;
    }

    res.json({
      resumen: {
        total_productos: Number(totalProductos.rows[0].total),
        total_categorias: Number(totalCategorias.rows[0].total),
        total_ventas: Number(totalVentas.rows[0].total),
        ingresos_totales: Number(ingresosTotales.rows[0].total),
        productos_stock_bajo: Number(stockBajo.rows[0].total),
        ventas_hoy: hoy,
        ventas_ayer: ayer,
        porcentaje_vs_ayer: Number(porcentajeVsAyer.toFixed(2)),
      },
      ventas_semana: ventasSemana.rows.map((d) => ({
        fecha: d.fecha,
        total: Number(d.total),
      })),
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