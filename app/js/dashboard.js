const API_URL = 'http://localhost:3000/api/dashboard';

async function cargarDashboard() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    // CARDS
    document.getElementById('totalVentas').textContent = data.resumen.total_ventas;
    document.getElementById('totalProductos').textContent = data.resumen.total_productos;
    document.getElementById('stockBajo').textContent = data.resumen.productos_stock_bajo;

    // TABLA
    const tbody = document.getElementById('ventas');
    tbody.innerHTML = '';

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

// Ejecutar
cargarDashboard();