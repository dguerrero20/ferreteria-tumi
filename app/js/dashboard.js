const API_URL = 'https://ferreteria-tumi.onrender.com/api/dashboard';

const usuario = JSON.parse(localStorage.getItem('usuario'));
const empresaId = usuario?.empresa_id;

let ventasChart = null;
let notificaciones = [];
let paginaNotificaciones = 0;
const NOTIS_POR_PAGINA = 10;

if (!usuario || !empresaId) {
  window.location.href = '/login.html';
}

function inicializarUsuarioDashboard() {
  const nombre = usuario?.nombre || 'Administrador';
  const rol = usuario?.rol || 'Administrador';

  const iniciales = nombre
    .split(' ')
    .map((parte) => parte[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  document.getElementById('dashboardUserName').textContent = nombre;
  document.getElementById('dashboardUserRole').textContent = rol;
  document.getElementById('dashboardAvatar').textContent = iniciales || 'AD';
}

function pintarGraficoVentas(ventasSemana = []) {
  const canvas = document.getElementById('ventasChart');
  if (!canvas) return;

  const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const datos = dias.map((_, index) => {
    const item = ventasSemana[index];
    return item ? Number(item.total) : 0;
  });

  if (ventasChart) {
    ventasChart.destroy();
  }

  ventasChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: dias,
      datasets: [
        {
          label: 'Ventas por día',
          data: datos,
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `S/ ${Number(context.raw).toFixed(2)}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return `S/ ${value}`;
            },
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.22)',
          },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  });
}

function calcularVentasHoy(ventas = []) {
  const hoy = new Date().toDateString();

  return ventas.reduce((total, venta) => {
    const fechaVenta = new Date(venta.created_at).toDateString();
    return fechaVenta === hoy ? total + Number(venta.total) : total;
  }, 0);
}

function generarNotificaciones(resumen = {}) {
  const totalStockBajo = Number(resumen.productos_stock_bajo || 0);
  const lista = [];

  for (let i = 1; i <= totalStockBajo; i++) {
    lista.push({
      tipo: 'stock',
      titulo: 'Stock bajo detectado',
      mensaje: `Hay un producto con stock bajo pendiente de revisión.`,
      fecha: new Date().toLocaleString('es-PE'),
    });
  }

  return lista;
}

function actualizarBadgeNotificaciones() {
  const badge = document.getElementById('notificationBadge');
  if (!badge) return;

  const key = `notificaciones_vistas_${empresaId}`;
  const vistas = localStorage.getItem(key);
  const firmaActual = String(notificaciones.length);

  if (notificaciones.length === 0 || vistas === firmaActual) {
    badge.style.display = 'none';
    badge.textContent = '0';
    return;
  }

  badge.style.display = 'grid';
  badge.textContent = notificaciones.length > 99 ? '99+' : notificaciones.length;
}

function renderNotificaciones() {
  const lista = document.getElementById('notificationList');
  const botonMas = document.getElementById('notificationMore');

  if (!lista || !botonMas) return;

  lista.innerHTML = '';

  if (notificaciones.length === 0) {
    lista.innerHTML = `
      <div class="notification-empty">
        No hay notificaciones
      </div>
    `;
    botonMas.style.display = 'none';
    return;
  }

  const inicio = paginaNotificaciones * NOTIS_POR_PAGINA;
  const fin = inicio + NOTIS_POR_PAGINA;
  const pagina = notificaciones.slice(inicio, fin);

  pagina.forEach((noti) => {
    const item = document.createElement('div');
    item.className = 'notification-item';

    item.innerHTML = `
      <div class="notification-icon">⚠</div>
      <div>
        <strong>${noti.titulo}</strong>
        <p>${noti.mensaje}</p>
        <span>${noti.fecha}</span>
      </div>
    `;

    lista.appendChild(item);
  });

  botonMas.style.display = fin < notificaciones.length ? 'block' : 'none';
}

function inicializarNotificaciones() {
  const bell = document.getElementById('notificationBell');
  const dropdown = document.getElementById('notificationDropdown');
  const botonMas = document.getElementById('notificationMore');

  if (!bell || !dropdown || !botonMas) return;

  bell.addEventListener('click', (event) => {
    event.stopPropagation();

    dropdown.classList.toggle('show');

    if (dropdown.classList.contains('show')) {
      paginaNotificaciones = 0;
      renderNotificaciones();

      localStorage.setItem(
        `notificaciones_vistas_${empresaId}`,
        String(notificaciones.length)
      );

      actualizarBadgeNotificaciones();
    }
  });

  botonMas.addEventListener('click', (event) => {
    event.stopPropagation();
    paginaNotificaciones += 1;
    renderNotificaciones();
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('show');
  });

  dropdown.addEventListener('click', (event) => {
    event.stopPropagation();
  });
}

async function cargarDashboard() {
  try {
    const res = await fetch(`${API_URL}?empresa_id=${empresaId}`);
    const data = await res.json();

    const resumen = data.resumen || {};
    const ultimasVentas = data.ultimas_ventas || [];

    document.getElementById('totalVentas').textContent =
      resumen.total_ventas || 0;

    document.getElementById('totalProductos').textContent =
      resumen.total_productos || 0;

    document.getElementById('stockBajo').textContent =
      resumen.productos_stock_bajo || 0;

    document.getElementById('ventasHoy').textContent =
  Number(resumen.ventas_hoy || 0).toFixed(2);

const trend = document.getElementById('ventasTrend');
const porcentaje = resumen.porcentaje_vs_ayer;

if (trend) {
  trend.classList.remove('positive', 'negative', 'neutral');

  if (porcentaje === null || porcentaje === undefined) {
    trend.textContent = 'Sin comparación';
    trend.classList.add('neutral');
  } else {
    const valor = Number(porcentaje);
    const signo = valor > 0 ? '↑' : valor < 0 ? '↓' : '→';

    trend.textContent = `${signo} ${Math.abs(valor).toFixed(2)}%`;

    if (valor > 0) trend.classList.add('positive');
    else if (valor < 0) trend.classList.add('negative');
    else trend.classList.add('neutral');
  }
}

    notificaciones = generarNotificaciones(resumen);
    actualizarBadgeNotificaciones();

    pintarGraficoVentas(data.ventas_semana || []);

    const tbody = document.getElementById('ventas');
    tbody.innerHTML = '';

    if (!ultimasVentas || ultimasVentas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3">
            <div class="empty-state">
              <div class="empty-state-icon">🧾</div>
              No hay ventas registradas
            </div>
          </td>
        </tr>
      `;
      return;
    }

    ultimasVentas.slice(0, 4).forEach((venta) => {
      const fila = document.createElement('tr');

      fila.innerHTML = `
        <td>#${String(venta.id).padStart(3, '0')}</td>
        <td>S/ ${Number(venta.total).toFixed(2)}</td>
        <td>${new Date(venta.created_at).toLocaleString('es-PE', {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}</td>
      `;

      tbody.appendChild(fila);
    });

  } catch (error) {
    console.error('Error cargando dashboard:', error);
  }
}
function inicializarMenuUsuario() {
  const userMenu = document.getElementById('dashboardUserMenu');
  const dropdown = document.getElementById('userDropdown');

  if (!userMenu || !dropdown) return;

  userMenu.addEventListener('click', (event) => {
    event.stopPropagation();
    dropdown.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('show');
  });
}


inicializarUsuarioDashboard();
inicializarMenuUsuario();
inicializarNotificaciones();
cargarDashboard();