const API = 'http://localhost:3000/api';
const API_REPORTES = `${API}/reportes`;
const API_VENDEDORES = `${API}/usuarios/vendedores`;

let graficoActual = null;
let vistaActual = 'datos';

function cambiarVista(vista) {
  vistaActual = vista;

  document.getElementById('btnDatos').style.background =
    vista === 'datos' ? '#1d4ed8' : '#2563eb';

  document.getElementById('btnGraficos').style.background =
    vista === 'graficos' ? '#1d4ed8' : '#2563eb';

  aplicarVista();
}

function aplicarVista() {
  const graficoBox = document.getElementById('graficoBox');
  const contenido = document.getElementById('contenidoReporte');

  if (vistaActual === 'datos') {
    graficoBox.style.display = 'none';
    contenido.style.display = 'block';
  } else {
    graficoBox.style.display = 'block';
    contenido.style.display = 'none';
  }
}

function obtenerFechas() {
  const desde = document.getElementById('desde').value;
  const hasta = document.getElementById('hasta').value;

  if (desde && hasta) {
    return `desde=${desde}&hasta=${hasta}`;
  }

  return '';
}

function obtenerVendedoresSeleccionados() {
  const todos = document.getElementById('todosVendedores');

  if (!todos || todos.checked) {
    return '';
  }

  const checks = document.querySelectorAll('.check-vendedor:checked');
  const ids = Array.from(checks).map((c) => c.value);

  if (ids.length === 0) {
    return '';
  }

  return `vendedores=${ids.join(',')}`;
}

function construirQueryReportes() {
  const params = [];

  const fechas = obtenerFechas();
  const vendedores = obtenerVendedoresSeleccionados();

  if (fechas) params.push(fechas);
  if (vendedores) params.push(vendedores);

  return params.length > 0 ? `?${params.join('&')}` : '';
}

async function cargarVendedoresFiltro() {
  try {
    const res = await fetch(API_VENDEDORES);
    const data = await res.json();

    const contenedor = document.getElementById('listaVendedores');
    contenedor.innerHTML = '';

    data.vendedores.forEach((v) => {
      const label = document.createElement('label');

      label.style.marginRight = '15px';

      label.innerHTML = `
        <input type="checkbox" class="check-vendedor" value="${v.id}" disabled>
        ${v.nombre}
      `;

      contenedor.appendChild(label);
    });
  } catch (error) {
    console.error('Error cargando vendedores:', error);
  }
}

function toggleTodosVendedores() {
  const todos = document.getElementById('todosVendedores').checked;
  const checks = document.querySelectorAll('.check-vendedor');

  checks.forEach((check) => {
    check.disabled = todos;
    if (todos) check.checked = false;
  });
}

function limpiarVista(titulo) {
  document.getElementById('tituloReporte').textContent = titulo;
  document.getElementById('resumenReporte').innerHTML = '';
  document.getElementById('contenidoReporte').innerHTML = '';
  document.getElementById('boxVendedores').style.display = 'none';

  if (graficoActual) {
    graficoActual.destroy();
    graficoActual = null;
  }
}

function mostrarMensaje(mensaje) {
  document.getElementById('graficoBox').style.display = 'none';
  document.getElementById('contenidoReporte').style.display = 'block';
  document.getElementById('contenidoReporte').innerHTML = `<p>${mensaje}</p>`;
}

function crearGrafico(tipo, labels, datos, titulo) {
  const ctx = document.getElementById('graficoReporte');

  if (graficoActual) {
    graficoActual.destroy();
  }

  graficoActual = new Chart(ctx, {
    type: tipo,
    data: {
      labels,
      datasets: [
        {
          label: titulo,
          data: datos,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
        },
      },
    },
  });

  aplicarVista();
}

async function reporteInventario() {
  try {
    limpiarVista('Reporte de Inventario');

    const res = await fetch(`${API}/productos`);
    const data = await res.json();

    if (!data.productos || data.productos.length === 0) {
      mostrarMensaje('No hay productos registrados.');
      return;
    }

    crearGrafico(
      'bar',
      data.productos.slice(0, 10).map((p) => p.producto),
      data.productos.slice(0, 10).map((p) => Number(p.stock)),
      'Stock disponible'
    );

    let html = `
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Unidad</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.productos.forEach((p) => {
      html += `
        <tr>
          <td>${p.producto}</td>
          <td>${p.categoria}</td>
          <td>S/ ${Number(p.precio).toFixed(2)}</td>
          <td>${p.stock}</td>
          <td>${p.unidad_medida}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';

    document.getElementById('resumenReporte').innerHTML = `
      <div class="resumen">
        <strong>Total productos:</strong> ${data.productos.length}
      </div>
    `;

    document.getElementById('contenidoReporte').innerHTML = html;
    aplicarVista();
  } catch (error) {
    console.error(error);
    mostrarMensaje('Error cargando reporte de inventario.');
  }
}

async function reporteStockBajo() {
  try {
    limpiarVista('Reporte de Stock Bajo');

    const res = await fetch(`${API}/productos/stock-bajo`);
    const data = await res.json();

    if (!data.productos || data.productos.length === 0) {
      mostrarMensaje('No hay productos con stock bajo.');
      return;
    }

    crearGrafico(
      'bar',
      data.productos.map((p) => p.producto),
      data.productos.map((p) => Number(p.cantidad_faltante)),
      'Cantidad faltante'
    );

    let html = `
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Stock</th>
            <th>Mínimo</th>
            <th>Faltante</th>
            <th>Unidad</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.productos.forEach((p) => {
      html += `
        <tr>
          <td>${p.producto}</td>
          <td>${p.stock}</td>
          <td>${p.stock_min}</td>
          <td>${p.cantidad_faltante}</td>
          <td>${p.unidad_medida}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';

    document.getElementById('resumenReporte').innerHTML = `
      <div class="resumen">
        <strong>Productos con stock bajo:</strong> ${data.productos.length}
      </div>
    `;

    document.getElementById('contenidoReporte').innerHTML = html;
    aplicarVista();
  } catch (error) {
    console.error(error);
    mostrarMensaje('Error cargando reporte de stock bajo.');
  }
}

async function reporteVentasSimple() {
  try {
    limpiarVista('Reporte General de Ventas');

    const res = await fetch(`${API}/ventas`);
    const data = await res.json();

    if (!data.ventas || data.ventas.length === 0) {
      mostrarMensaje('No hay ventas registradas.');
      return;
    }

    let totalGeneral = 0;

    data.ventas.forEach((v) => {
      totalGeneral += Number(v.total);
    });

    crearGrafico(
      'bar',
      data.ventas.map((v) => `Venta ${v.id}`),
      data.ventas.map((v) => Number(v.total)),
      'Total por venta'
    );

    let html = `
      <table>
        <thead>
          <tr>
            <th>ID Venta</th>
            <th>Total</th>
            <th>Usuario</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.ventas.forEach((v) => {
      html += `
        <tr>
          <td>${v.id}</td>
          <td>S/ ${Number(v.total).toFixed(2)}</td>
          <td>${v.usuario || '-'}</td>
          <td>${new Date(v.created_at).toLocaleString()}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';

    document.getElementById('resumenReporte').innerHTML = `
      <div class="resumen">
        <p><strong>Total ventas:</strong> ${data.ventas.length}</p>
        <p><strong>Ingresos totales:</strong> S/ ${totalGeneral.toFixed(2)}</p>
      </div>
    `;

    document.getElementById('contenidoReporte').innerHTML = html;
    aplicarVista();
  } catch (error) {
    console.error(error);
    mostrarMensaje('Error cargando reporte general de ventas.');
  }
}

async function reporteVentasPorFecha() {
  try {
    limpiarVista('Reporte de Ventas por Fecha');

    const query = obtenerFechas();
    const url = query ? `${API_REPORTES}/ventas?${query}` : `${API_REPORTES}/ventas`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.ventas || data.ventas.length === 0) {
      mostrarMensaje('No hay ventas en el rango seleccionado.');
      return;
    }

    crearGrafico(
      'line',
      data.ventas.map((v) => new Date(v.created_at).toLocaleDateString()),
      data.ventas.map((v) => Number(v.total)),
      'Ingresos por venta'
    );

    document.getElementById('resumenReporte').innerHTML = `
      <div class="resumen">
        <p><strong>Total ventas:</strong> ${data.resumen.total_ventas}</p>
        <p><strong>Ingresos totales:</strong> S/ ${Number(data.resumen.ingresos_totales).toFixed(2)}</p>
      </div>
    `;

    let html = `
      <table>
        <thead>
          <tr>
            <th>ID Venta</th>
            <th>Total</th>
            <th>Usuario</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.ventas.forEach((v) => {
      html += `
        <tr>
          <td>${v.id}</td>
          <td>S/ ${Number(v.total).toFixed(2)}</td>
          <td>${v.usuario || '-'}</td>
          <td>${new Date(v.created_at).toLocaleString()}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    document.getElementById('contenidoReporte').innerHTML = html;
    aplicarVista();
  } catch (error) {
    console.error(error);
    mostrarMensaje('Error cargando ventas por fecha.');
  }
}

async function productosMasVendidos() {
  try {
    limpiarVista('Productos Más Vendidos');

    const params = obtenerFechas();
    const url = params ? `${API_REPORTES}/productos-mas-vendidos?${params}` : `${API_REPORTES}/productos-mas-vendidos`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.productos || data.productos.length === 0) {
      mostrarMensaje('No hay productos vendidos en el rango seleccionado.');
      return;
    }

    crearGrafico(
      'bar',
      data.productos.map((p) => p.producto),
      data.productos.map((p) => Number(p.cantidad_vendida)),
      'Cantidad vendida'
    );

    let html = `
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad vendida</th>
            <th>Unidad</th>
            <th>Total vendido</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.productos.forEach((p) => {
      html += `
        <tr>
          <td>${p.producto}</td>
          <td>${p.cantidad_vendida}</td>
          <td>${p.unidad_medida}</td>
          <td>S/ ${Number(p.total_vendido).toFixed(2)}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';

    document.getElementById('resumenReporte').innerHTML = `
      <div class="resumen">
        <strong>Top productos vendidos:</strong> ${data.productos.length}
      </div>
    `;

    document.getElementById('contenidoReporte').innerHTML = html;
    aplicarVista();
  } catch (error) {
    console.error(error);
    mostrarMensaje('Error cargando productos más vendidos.');
  }
}

async function productosMenosVendidos() {
  try {
    limpiarVista('Productos Menos Vendidos');

    const params = obtenerFechas();
    const url = params ? `${API_REPORTES}/productos-menos-vendidos?${params}` : `${API_REPORTES}/productos-menos-vendidos`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.productos || data.productos.length === 0) {
      mostrarMensaje('No hay datos de productos.');
      return;
    }

    crearGrafico(
      'bar',
      data.productos.map((p) => p.producto),
      data.productos.map((p) => Number(p.cantidad_vendida)),
      'Cantidad vendida'
    );

    let html = `
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad vendida</th>
            <th>Unidad</th>
            <th>Total vendido</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.productos.forEach((p) => {
      html += `
        <tr>
          <td>${p.producto}</td>
          <td>${p.cantidad_vendida}</td>
          <td>${p.unidad_medida}</td>
          <td>S/ ${Number(p.total_vendido).toFixed(2)}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';

    document.getElementById('resumenReporte').innerHTML = `
      <div class="resumen">
        <strong>Productos analizados:</strong> ${data.productos.length}
      </div>
    `;

    document.getElementById('contenidoReporte').innerHTML = html;
    aplicarVista();
  } catch (error) {
    console.error(error);
    mostrarMensaje('Error cargando productos menos vendidos.');
  }
}

async function vendedoresTop() {
  try {
    limpiarVista('Vendedores Top');
    document.getElementById('boxVendedores').style.display = 'block';

    const query = construirQueryReportes();
    const res = await fetch(`${API_REPORTES}/vendedores-top${query}`);
    const data = await res.json();

    if (!data.vendedores || data.vendedores.length === 0) {
      mostrarMensaje('No hay vendedores para mostrar.');
      return;
    }

    crearGrafico(
      'bar',
      data.vendedores.map((v) => v.vendedor),
      data.vendedores.map((v) => Number(v.total_vendido)),
      'Total vendido por vendedor'
    );

    let html = `
      <table>
        <thead>
          <tr>
            <th>Vendedor</th>
            <th>Email</th>
            <th>Ventas realizadas</th>
            <th>Total vendido</th>
            <th>Promedio por venta</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.vendedores.forEach((v) => {
      html += `
        <tr>
          <td>${v.vendedor}</td>
          <td>${v.email}</td>
          <td>${v.ventas_realizadas}</td>
          <td>S/ ${Number(v.total_vendido).toFixed(2)}</td>
          <td>S/ ${Number(v.promedio_venta).toFixed(2)}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';

    document.getElementById('resumenReporte').innerHTML = `
      <div class="resumen">
        <strong>Vendedores mostrados:</strong> ${data.vendedores.length}
      </div>
    `;

    document.getElementById('contenidoReporte').innerHTML = html;
    aplicarVista();
  } catch (error) {
    console.error(error);
    mostrarMensaje('Error cargando vendedores top.');
  }
}

cargarVendedoresFiltro();
cambiarVista('datos');