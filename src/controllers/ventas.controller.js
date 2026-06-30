const pool = require('../db/primary');
const puppeteer = require('puppeteer');
const {
  enviarCorreo,
} = require('../utils/email');

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

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  if (!['boleta', 'factura'].includes(tipo_comprobante)) {
    return res.status(400).json({ msg: 'Tipo de comprobante inválido' });
  }

  if (tipo_comprobante === 'boleta' && !cliente_nombre) {
    return res.status(400).json({
      msg: 'El nombre del cliente es obligatorio para boleta',
    });
  }

  if (tipo_comprobante === 'factura') {
    if (!cliente_razon_social || !cliente_ruc || !cliente_email) {
      return res.status(400).json({
        msg: 'Razón social, RUC y correo son obligatorios para factura',
      });
    }

    if (!/^\d{11}$/.test(String(cliente_ruc))) {
      return res.status(400).json({
        msg: 'El RUC debe tener 11 dígitos',
      });
    }
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

    const { subtotalSinIgv, igv } = calcularIgvIncluido(total);

    const { serie, correlativo } = await generarCorrelativo(
      client,
      empresa_id,
      tipo_comprobante
    );

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

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

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
        v.cliente_dni,
        v.cliente_ruc,
        v.cliente_razon_social,
        v.cliente_direccion,
        v.cliente_email,
        v.serie,
        v.correlativo,
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
        v.*,
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
function formatoMoneda(valor) {
  return `S/ ${Number(valor || 0).toFixed(2)}`;
}

function formatoCorrelativo(numero) {
  return String(numero || 0).padStart(8, '0');
}

function textoTipo(tipo) {
  return tipo === 'factura'
    ? 'FACTURA ELECTRÓNICA'
    : 'BOLETA DE VENTA ELECTRÓNICA';
}

async function generarPDFComprobante(venta, detalle) {
  const esFactura = venta.tipo_comprobante === 'factura';

  const numero =
    `${venta.serie || (esFactura ? 'F001' : 'B001')}-${formatoCorrelativo(venta.correlativo)}`;

  const clienteHtml = esFactura
    ? `
      <div><strong>Razón social:</strong> ${venta.cliente_razon_social || '-'}</div>
      <div><strong>RUC:</strong> ${venta.cliente_ruc || '-'}</div>
      <div><strong>Dirección:</strong> ${venta.cliente_direccion || '-'}</div>
      <div><strong>Correo:</strong> ${venta.cliente_email || '-'}</div>
    `
    : `
      <div><strong>Cliente:</strong> ${venta.cliente_nombre || '-'}</div>
      <div><strong>DNI:</strong> ${venta.cliente_dni || '-'}</div>
      <div><strong>Correo:</strong> ${venta.cliente_email || '-'}</div>
    `;

  const productosHtml = detalle.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.producto}</td>
      <td>${Number(item.cantidad).toFixed(2)}</td>
      <td>${item.unidad_medida || '-'}</td>
      <td>${formatoMoneda(item.precio_sin_igv || (Number(item.precio_unitario) / 1.18))}</td>
      <td>${formatoMoneda(item.igv || (Number(item.subtotal) - Number(item.subtotal) / 1.18))}</td>
      <td>${formatoMoneda(item.subtotal)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">

      <style>
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 24px;
          background: #f3f4f6;
          font-family: Arial, sans-serif;
          color: #111827;
        }

        .comprobante-paper {
          width: 100%;
          background: #fff;
          color: #111827;
          padding: 28px;
          border-radius: 18px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, .12);
        }

        .comprobante-top {
          display: grid;
          grid-template-columns: 1.2fr .8fr;
          gap: 20px;
          align-items: stretch;
        }

        .empresa-box {
          border: 1px solid #d1d5db;
          border-radius: 16px;
          padding: 18px;
        }

        .empresa-box h2 {
          font-size: 28px;
          margin: 0 0 8px;
        }

        .empresa-box p {
          margin: 4px 0;
          color: #374151;
          font-size: 13px;
        }

        .documento-box {
          border: 2px solid #111827;
          border-radius: 16px;
          padding: 18px;
          text-align: center;
          display: grid;
          align-content: center;
        }

        .documento-box h2 {
          font-size: 18px;
          margin: 12px 0;
        }

        .documento-ruc {
          font-weight: 700;
          font-size: 14px;
        }

        .documento-numero {
          font-size: 22px;
          font-weight: 800;
        }

        .comprobante-section {
          margin-top: 20px;
        }

        .section-title {
          background: #111827;
          color: #fff;
          padding: 10px 14px;
          border-radius: 10px;
          font-weight: 700;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .cliente-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 20px;
          padding: 16px;
          border: 1px solid #d1d5db;
          border-radius: 14px;
          font-size: 13px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        .comprobante-table th {
          background: #111827;
          color: #fff;
          font-size: 12px;
          text-align: left;
        }

        .comprobante-table td,
        .comprobante-table th {
          border: 1px solid #d1d5db;
          padding: 10px;
          font-size: 12px;
        }

        .comprobante-bottom {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 20px;
          margin-top: 20px;
        }

        .observaciones-box {
          border: 1px solid #d1d5db;
          border-radius: 14px;
          padding: 16px;
          font-size: 13px;
        }

        .observaciones-box p {
          margin: 6px 0;
        }

        .qr-box {
          margin-top: 16px;
          width: 76px;
          height: 76px;
          border: 2px dashed #6b7280;
          display: grid;
          place-items: center;
          font-weight: 800;
          color: #6b7280;
        }

        .comprobante-totales {
          border: 1px solid #d1d5db;
          border-radius: 14px;
          padding: 16px;
          font-size: 13px;
        }

        .comprobante-totales > div {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .comprobante-totales .total-final {
          border-top: 1px solid #d1d5db;
          padding-top: 14px;
          font-size: 18px;
        }

        .comprobante-footer {
          margin-top: 22px;
          text-align: center;
          font-size: 11px;
          color: #6b7280;
        }
      </style>
    </head>

    <body>
      <div class="comprobante-paper">

        <div class="comprobante-top">
          <div class="empresa-box">
            <h2>FERDEV</h2>
            <p>Soluciones para ferretería e inventario</p>
            <p><strong>RUC:</strong> 20600000000</p>
            <p><strong>Dirección:</strong> Lima, Perú</p>
            <p><strong>Email:</strong> ventas@ferdev.com</p>
          </div>

          <div class="documento-box">
            <div class="documento-ruc">RUC 20600000000</div>
            <h2>${textoTipo(venta.tipo_comprobante)}</h2>
            <div class="documento-numero">${numero}</div>
          </div>
        </div>

        <div class="comprobante-section">
          <div class="section-title">Datos del cliente</div>

          <div class="cliente-grid">
            ${clienteHtml}
            <div><strong>Fecha de emisión:</strong> ${new Date(venta.created_at).toLocaleString('es-PE')}</div>
            <div><strong>Vendedor:</strong> ${venta.usuario || '-'}</div>
          </div>
        </div>

        <div class="comprobante-section">
          <div class="section-title">Detalle de productos</div>

          <table class="comprobante-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Unidad</th>
                <th>Valor venta</th>
                <th>IGV</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              ${productosHtml}
            </tbody>
          </table>
        </div>

        <div class="comprobante-bottom">
          <div class="observaciones-box">
            <strong>Observaciones:</strong>
            <p>El precio de los productos incluye IGV. Documento generado desde Ferdev.</p>

            <div class="qr-box">
              QR
            </div>
          </div>

          <div class="comprobante-totales">
            <div>
              <span>Subtotal sin IGV</span>
              <strong>${formatoMoneda(venta.subtotal_sin_igv)}</strong>
            </div>

            <div>
              <span>IGV 18%</span>
              <strong>${formatoMoneda(venta.igv)}</strong>
            </div>

            <div class="total-final">
              <span>Importe total</span>
              <strong>${formatoMoneda(venta.total)}</strong>
            </div>
          </div>
        </div>

        <div class="comprobante-footer">
          Representación impresa de ${textoTipo(venta.tipo_comprobante)}.
        </div>

      </div>
    </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
  waitUntil: 'domcontentloaded',
  timeout: 0,
});
await page.emulateMediaType('screen');

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
const enviarComprobanteEmail = async (req, res) => {
  const { id } = req.params;
  const empresa_id = obtenerEmpresaId(req);

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  try {
    const ventaResult = await pool.query(
      `
      SELECT v.*, u.nombre AS usuario
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

    const venta = ventaResult.rows[0];

    if (!venta.cliente_email) {
      return res.status(400).json({
        msg: 'Esta venta no tiene correo registrado',
      });
    }

    const detalleResult = await pool.query(
      `
      SELECT
        vd.cantidad,
        vd.precio_unitario,
        vd.subtotal,
        vd.precio_sin_igv,
        vd.igv,
        CONCAT(t.nombre, ' ', vp.nombre, ' ', p.marca) AS producto
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

    const tipoTexto =
      venta.tipo_comprobante === 'factura'
        ? 'Factura electrónica'
        : 'Boleta electrónica';

    const numero = `${venta.serie}-${String(venta.correlativo).padStart(8, '0')}`;

    const productosHtml = detalleResult.rows.map((item) => `
      <tr>
        <td>${item.producto}</td>
        <td>${item.cantidad}</td>
        <td>S/ ${Number(item.precio_sin_igv || 0).toFixed(2)}</td>
        <td>S/ ${Number(item.igv || 0).toFixed(2)}</td>
        <td>S/ ${Number(item.subtotal || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    const clienteHtml =
      venta.tipo_comprobante === 'factura'
        ? `
          <p><strong>Razón social:</strong> ${venta.cliente_razon_social}</p>
          <p><strong>RUC:</strong> ${venta.cliente_ruc}</p>
          <p><strong>Dirección:</strong> ${venta.cliente_direccion || '-'}</p>
        `
        : `
          <p><strong>Cliente:</strong> ${venta.cliente_nombre}</p>
          <p><strong>DNI:</strong> ${venta.cliente_dni || '-'}</p>
        `;

    const pdfBuffer = await generarPDFComprobante(
  venta,
  detalleResult.rows
);

const html = `
  <div style="font-family: Arial, sans-serif; color:#111827;">
    <h2>FERDEV</h2>

    <p>Hola,</p>

    <p>
      Adjuntamos tu ${tipoTexto.toLowerCase()}
      <strong>${numero}</strong>.
    </p>

    <p>
      También puedes conservar este correo como respaldo digital
      de tu compra.
    </p>

    <br>

    <p>
      <strong>Total:</strong>
      S/ ${Number(venta.total || 0).toFixed(2)}
    </p>

    <p>Gracias por tu compra.</p>
  </div>
`;

await enviarCorreo({
  to: venta.cliente_email,
  subject: `${tipoTexto} ${numero}`,
  html,
  attachments: [
    {
      name: `${venta.tipo_comprobante}-${numero}.pdf`,
      content: Buffer.from(pdfBuffer).toString('base64'),
    },
  ],
});

    res.json({
      msg: `${tipoTexto} enviada correctamente a ${venta.cliente_email}`,
    });
  } catch (error) {
    console.error('ERROR ENVIANDO COMPROBANTE:', error);

    res.status(500).json({
      msg: 'Error enviando comprobante por correo',
      error: error.message,
    });
  }
};

module.exports = {
  registrarVenta,
  listarVentas,
  detalleVenta,
  enviarComprobanteEmail,
};