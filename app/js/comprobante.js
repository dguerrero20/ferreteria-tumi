const API = 'https://ferreteria-tumi.onrender.com/api';

const usuario = JSON.parse(localStorage.getItem('usuario'));
const empresaId = usuario?.empresa_id;

const params = new URLSearchParams(window.location.search);
const ventaId = params.get('id');

if (!usuario || !empresaId) {
  window.location.href = '/login.html';
}

if (!ventaId) {
  document.getElementById('comprobanteContainer').innerHTML = `
    <div class="box">
      <p>No se encontró el ID de la venta.</p>
    </div>
  `;
}

function formatoMoneda(valor) {
  return `S/ ${Number(valor || 0).toFixed(2)}`;
}

function formatoCorrelativo(numero) {
  return String(numero || 0).padStart(8, '0');
}

function textoTipo(tipo) {
  return tipo === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';
}

function volverReportes() {
  window.location.href = '/pages/reportes.html';
}

function descargarComprobante() {
  window.print();
}

function enviarCorreo() {
  const mensaje = document.getElementById('mensajeComprobante');
  mensaje.textContent = 'La función de envío por correo quedará conectada al backend en el siguiente paso.';
  mensaje.style.color = 'green';
}

async function cargarComprobante() {
  try {
    const res = await fetch(`${API}/ventas/${ventaId}?empresa_id=${empresaId}`);
    const data = await res.json();

    if (!res.ok) {
      document.getElementById('comprobanteContainer').innerHTML = `
        <div class="box">
          <p>${data.msg || 'No se pudo cargar el comprobante.'}</p>
        </div>
      `;
      return;
    }

    renderComprobante(data.venta, data.detalle || []);
  } catch (error) {
    console.error(error);

    document.getElementById('comprobanteContainer').innerHTML = `
      <div class="box">
        <p>Error conectando con el servidor.</p>
      </div>
    `;
  }
}

function renderComprobante(venta, detalle) {
  const esFactura = venta.tipo_comprobante === 'factura';
  const numero = `${venta.serie || (esFactura ? 'F001' : 'B001')}-${formatoCorrelativo(venta.correlativo)}`;

  let clienteHtml = '';

  if (esFactura) {
    clienteHtml = `
      <div><strong>Razón social:</strong> ${venta.cliente_razon_social || '-'}</div>
      <div><strong>RUC:</strong> ${venta.cliente_ruc || '-'}</div>
      <div><strong>Dirección:</strong> ${venta.cliente_direccion || '-'}</div>
      <div><strong>Correo:</strong> ${venta.cliente_email || '-'}</div>
    `;
  } else {
    clienteHtml = `
      <div><strong>Cliente:</strong> ${venta.cliente_nombre || '-'}</div>
      <div><strong>DNI:</strong> ${venta.cliente_dni || '-'}</div>
      <div><strong>Correo:</strong> ${venta.cliente_email || '-'}</div>
    `;
  }

  let productosHtml = '';

  detalle.forEach((item, index) => {
    productosHtml += `
      <tr>
        <td>${index + 1}</td>
        <td>${item.producto}</td>
        <td>${Number(item.cantidad).toFixed(2)}</td>
        <td>${item.unidad_medida || '-'}</td>
        <td>${formatoMoneda(item.precio_sin_igv || (Number(item.precio_unitario) / 1.18))}</td>
        <td>${formatoMoneda(item.igv || (Number(item.subtotal) - Number(item.subtotal) / 1.18))}</td>
        <td>${formatoMoneda(item.subtotal)}</td>
      </tr>
    `;
  });

  document.getElementById('comprobanteContainer').innerHTML = `
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

        <div class="table-responsive">
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
  `;
}

cargarComprobante();