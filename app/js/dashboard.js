const API_URL = 'https://ferreteria-tumi.onrender.com/api/dashboard';

const usuario = JSON.parse(localStorage.getItem('usuario'));
const empresaId = usuario?.empresa_id;

let ventasChart = null;

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

function pintarGraficoVentas(ventas = []) {
  const canvas = document.getElementById('ventasChart');
  if (!canvas) return;

  const ventasOrdenadas = [...ventas]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(-7);

  const labels = ventasOrdenadas.map((venta) =>
    new Date(venta.created_at).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
    })
  );

  const datos = ventasOrdenadas.map((venta) => Number(venta.total));

  if (ventasChart) {
    ventasChart.destroy();
  }

  ventasChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels.length ? labels : ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5', 'Día 6', 'Día 7'],
      datasets: [
        {
          label: 'Ventas',
          data: datos.length ? datos : [0, 0, 0, 0, 0, 0, 0],
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
        legend: {
          display: false,
        },
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
          grid: {
            display: false,
          },
        },
      },
    },
  });
}

function calcularVentasHoy(ventas = []) {
  const hoy = new Date().toDateString();

  return ventas.reduce((total, venta) => {
    const fechaVenta = new Date(venta.created_at).toDateString();

    if (fechaVenta === hoy) {
      return total + Number(venta.total);
    }

    return total;
  }, 0);
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
      calcularVentasHoy(ultimasVentas).toFixed(2);

    pintarGraficoVentas(ultimasVentas);

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

inicializarUsuarioDashboard();
cargarDashboard();