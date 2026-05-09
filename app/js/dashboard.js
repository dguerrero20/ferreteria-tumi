const API_URL = 'https://ferreteria-tumi.onrender.com/api/dashboard';

const usuario = JSON.parse(localStorage.getItem('usuario'));
const empresaId = usuario?.empresa_id;

if (!usuario || !empresaId) {
  window.location.href = '/login.html';
}

async function cargarDashboard() {
  try {
    const res = await fetch(`${API_URL}?empresa_id=${empresaId}`);
    const data = await res.json();

    document.getElementById('totalVentas').textContent = data.resumen.total_ventas;
    document.getElementById('totalProductos').textContent = data.resumen.total_productos;
    document.getElementById('stockBajo').textContent = data.resumen.productos_stock_bajo;

    const tbody = document.getElementById('ventas');
    tbody.innerHTML = '';

    if (!data.ultimas_ventas || data.ultimas_ventas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3">No hay ventas registradas</td>
        </tr>
      `;
      return;
    }

    data.ultimas_ventas.forEach((venta) => {
      const fila = document.createElement('tr');

      fila.innerHTML = `
        <td>${venta.id}</td>
        <td>S/ ${Number(venta.total).toFixed(2)}</td>
        <td>${new Date(venta.created_at).toLocaleString()}</td>
      `;

      tbody.appendChild(fila);
    });

  } catch (error) {
    console.error('Error cargando dashboard:', error);
  }
}

cargarDashboard();