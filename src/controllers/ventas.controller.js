const pool = require('../db/primary');

function obtenerEmpresaId(req) {
  return req.query.empresa_id || req.body.empresa_id;
}

function calcularIgvIncluido(total) {
  const subtotalSinIgv = Number(total) / 1.18;
  const igv = Number(total) - subtotalSinIgv;

  return {
    subtotalSinIgv: Number(subtotalSinIgv.toFixed(2)),
    igv: Number(igv.toFixed(2)),
  };
}

async function generarCorrelativo(client, empresaId, tipoComprobante) {
  const serie = tipoComprobante === 'factura' ? 'F001' : 'B001';

  const result = await client.query(
    `
    SELECT COALESCE(MAX(correlativo), 0) + 1 AS siguiente
    FROM public.ventas
    WHERE empresa_id = $1
    AND tipo_comprobante = $2
    AND serie = $3
    `,
    [empresaId, tipoComprobante, serie]
  );

  return {
    serie,
    correlativo: Number(result.rows[0].siguiente),
  };
}

const registrarVenta = async (req, res) => {
  const {
    empresa_id,
    usuario_id,
    productos,
    tipo_comprobante = 'boleta',
    cliente_nombre,
    cliente_dni,
    cliente_ruc,
    cliente_razon_social,
    cliente_direccion,
    cliente_email,
  } = req.body;

  if (!empresa_id) return res.status(400).json({ msg: 'Falta empresa_id' });

  if (!['boleta', 'factura'].includes(tipo_comprobante)) {
    return res.status(400).json({ msg: 'Tipo de comprobante inválido' });
  }

  if (tipo_comprobante === 'boleta' && !cliente_nombre) {
    return res.status(400).json({ msg: 'El nombre del cliente es obligatorio para boleta' });
  }

  if (tipo_comprobante === 'factura') {
    if (!cliente_razon_social || !cliente_ruc || !cliente_email) {
      return res.status(400).json({ msg: 'Razón social, RUC y correo son obligatorios para factura' });
    }

    if (!/^\d{11}$/.test(String(cliente_ruc))) {
      return res.status(400).json({ msg: 'El RUC debe tener 11 dígitos' });
    }
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (!productos || productos.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ msg: 'Debe agregar productos a la venta' });
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
        return res.status(404).json({ msg: `Producto ${item.producto_id} no encontrado` });
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

    const { subtotalSinIgv, igv } = calcularIgvIncluido(total);
    const { serie, correlativo } = await generarCorrelativo(client, empresa_id, tipo_comprobante);

    const ventaResult = await client.query(
      `
      INSERT INTO public.ventas
      (
        empresa_id,
        usuario_id,
        total,
        tipo_comprobante,
        cliente_nombre,
        cliente_dni,
        cliente_ruc,
        cliente_razon_social,
        cliente_direccion,
        cliente_email,
        serie,
        correlativo,
        subtotal_sin_igv,
        igv
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *
      `,
      [
        empresa_id,
        usuario_id,
        total,
        tipo_comprobante,
        cliente_nombre || null,
        cliente_dni || null,
        cliente_ruc || null,
        cliente_razon_social || null,
        cliente_direccion || null,
        cliente_email || null,
        serie,
        correlativo,
        subtotalSinIgv,
        igv,
      ]
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
      const calcDetalle = calcularIgvIncluido(subtotal);

      await client.query(
        `
        INSERT INTO public.ventas_detalle
        (
          venta_id,
          producto_id,
          cantidad,
          precio_unitario,
          subtotal,
          precio_sin_igv,
          igv
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `,
        [
          venta.id,
          item.producto_id,
          item.cantidad,
          producto.precio,
          subtotal,
          calcDetalle.subtotalSinIgv,
          calcDetalle.igv,
        ]
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
      subtotal_sin_igv: subtotalSinIgv,
      igv,
      tipo_comprobante,
      serie,
      correlativo,
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

  if (!empresa_id) return res.status(400).json({ msg: 'Falta empresa_id' });

  try {
    const result = await pool.query(
      `
      SELECT
        v.id,
        v.total,
        v.subtotal_sin_igv,
        v.igv,
        v.created_at,
        v.tipo_comprobante,
        v.cliente_nombre,
        v.cliente_ruc,
        v.cliente_razon_social,
        v.cliente_email,
        v.serie,
        v.correlativo,
        u.nombre AS usuario
      FROM public.ventas v
      LEFT JOIN public.usuarios u ON u.id = v.usuario_id
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

  if (!empresa_id) return res.status(400).json({ msg: 'Falta empresa_id' });

  try {
    const ventaResult = await pool.query(
      `
      SELECT
        v.*,
        u.nombre AS usuario
      FROM public.ventas v
      LEFT JOIN public.usuarios u ON u.id = v.usuario_id
      WHERE v.id = $1 AND v.empresa_id = $2
      `,
      [id, empresa_id]
    );

    if (ventaResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Venta no encontrada' });
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
        vd.subtotal,
        vd.precio_sin_igv,
        vd.igv
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