const API_PRODUCTOS = 'https://ferreteria-tumi.onrender.com/api/productos';
const API_VENTAS = 'https://ferreteria-tumi.onrender.com/api/ventas';
const API_VENDEDORES = 'https://ferreteria-tumi.onrender.com/api/usuarios/vendedores';

let carrito = [];

async function cargarVendedores() {
  try {
    const res = await fetch(API_VENDEDORES);
    const data = await res.json();

    const select = document.getElementById('vendedor');
    select.innerHTML = '<option value="">Seleccionar vendedor</option>';

    data.vendedores.forEach((vendedor) => {
      const option = document.createElement('option');
      option.value = vendedor.id;
      option.textContent = vendedor.nombre;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error cargando vendedores:', error);
  }
}

async function buscarProductos() {
  const texto = document.getElementById('buscar').value.trim();
  const tbody = document.getElementById('resultados');

  if (texto === '') {
    tbody.innerHTML = '<tr><td colspan="5">Escribe algo para buscar</td></tr>';
    return;
  }

  try {
    const res = await fetch(`${API_PRODUCTOS}?buscar=${encodeURIComponent(texto)}`);
    const data = await res.json();

    mostrarResultados(data.productos);
  } catch (error) {
    console.error('Error buscando productos:', error);
  }
}

function mostrarResultados(productos) {
  const tbody = document.getElementById('resultados');
  tbody.innerHTML = '';

  if (!productos || productos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No se encontraron productos</td></tr>';
    return;
  }

  productos.forEach((p) => {
    const fila = document.createElement('tr');

    fila.innerHTML = `
      <td>${p.producto}</td>
      <td>S/ ${Number(p.precio).toFixed(2)}</td>
      <td>${p.stock}</td>
      <td>${p.unidad_medida}</td>
      <td>
        <button onclick='agregarAlCarrito(${JSON.stringify(p)})'>Agregar</button>
      </td>
    `;

    tbody.appendChild(fila);
  });
}

function agregarAlCarrito(producto) {
  const existente = carrito.find((item) => item.id === producto.id);

  if (existente) {
    if (existente.cantidad + 1 > Number(producto.stock)) {
      alert('No hay suficiente stock');
      return;
    }

    existente.cantidad += 1;
  } else {
    if (Number(producto.stock) <= 0) {
      alert('Producto sin stock');
      return;
    }

    carrito.push({
      id: producto.id,
      producto: producto.producto,
      precio: Number(producto.precio),
      stock: Number(producto.stock),
      unidad_medida: producto.unidad_medida,
      cantidad: 1,
    });
  }

  renderCarrito();
}

function cambiarCantidad(id, cantidad) {
  const item = carrito.find((p) => p.id === id);
  const nuevaCantidad = Number(cantidad);

  if (!item) return;

  if (nuevaCantidad <= 0) {
    eliminarDelCarrito(id);
    return;
  }

  if (nuevaCantidad > item.stock) {
    alert('La cantidad supera el stock disponible');
    renderCarrito();
    return;
  }

  item.cantidad = nuevaCantidad;
  renderCarrito();
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter((p) => p.id !== id);
  renderCarrito();
}

function renderCarrito() {
  const tbody = document.getElementById('carrito');
  const totalSpan = document.getElementById('total');

  tbody.innerHTML = '';

  let total = 0;

  if (carrito.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">Carrito vacío</td></tr>';
  }

  carrito.forEach((item) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;

    const fila = document.createElement('tr');

    fila.innerHTML = `
      <td>${item.producto}</td>
      <td>
        <input 
          type="number" 
          min="0" 
          step="0.01"
          value="${item.cantidad}" 
          onchange="cambiarCantidad(${item.id}, this.value)"
          style="width: 70px;"
        >
        ${item.unidad_medida}
      </td>
      <td>S/ ${subtotal.toFixed(2)}</td>
      <td><button class="danger" onclick="eliminarDelCarrito(${item.id})">X</button></td>
    `;

    tbody.appendChild(fila);
  });

  totalSpan.textContent = total.toFixed(2);
}

async function registrarVenta() {
  const mensaje = document.getElementById('mensaje');
  const vendedorId = document.getElementById('vendedor').value;

  if (!vendedorId) {
    mensaje.textContent = 'Selecciona un vendedor';
    mensaje.style.color = 'red';
    return;
  }

  if (carrito.length === 0) {
    mensaje.textContent = 'Agrega productos al carrito';
    mensaje.style.color = 'red';
    return;
  }

  const body = {
    usuario_id: Number(vendedorId),
    productos: carrito.map((item) => ({
      producto_id: item.id,
      cantidad: item.cantidad,
    })),
  };

  try {
    const res = await fetch(API_VENTAS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      mensaje.textContent = data.msg || 'Error registrando venta';
      mensaje.style.color = 'red';
      return;
    }

    mensaje.textContent = `Venta registrada correctamente. Total: S/ ${Number(data.total).toFixed(2)}`;
    mensaje.style.color = 'green';

    carrito = [];
    renderCarrito();

    const texto = document.getElementById('buscar').value.trim();
    if (texto !== '') {
      buscarProductos();
    }
  } catch (error) {
    console.error('Error registrando venta:', error);
    mensaje.textContent = 'Error conectando con el servidor';
    mensaje.style.color = 'red';
  }
}

cargarVendedores();
renderCarrito();