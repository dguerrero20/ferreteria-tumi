const API_PRODUCTOS = 'https://ferreteria-tumi.onrender.com/api/productos';
const API_VENTAS = 'https://ferreteria-tumi.onrender.com/api/ventas';
const API_VENDEDORES = 'https://ferreteria-tumi.onrender.com/api/usuarios/vendedores';
const API = 'https://ferreteria-tumi.onrender.com/api';

const usuario = JSON.parse(localStorage.getItem('usuario'));
const empresaId = usuario?.empresa_id;

let carrito = [];
let tipoComprobante = 'boleta';

if (!usuario || !empresaId) {
  window.location.href = '/login.html';
}

function calcularIgvIncluido(total) {
  const subtotalSinIgv = total / 1.18;
  const igv = total - subtotalSinIgv;

  return {
    subtotalSinIgv,
    igv,
    total,
  };
}

function seleccionarComprobante(tipo) {
  tipoComprobante = tipo;

  document.getElementById('btnBoleta').classList.toggle('active', tipo === 'boleta');
  document.getElementById('btnFactura').classList.toggle('active', tipo === 'factura');

  document.getElementById('formBoleta').style.display = tipo === 'boleta' ? 'block' : 'none';
  document.getElementById('formFactura').style.display = tipo === 'factura' ? 'block' : 'none';

  renderResumenComprobante();
}

async function cargarVendedores() {
  try {
    const res = await fetch(`${API_VENDEDORES}?empresa_id=${empresaId}`);
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
    const res = await fetch(
      `${API_PRODUCTOS}?empresa_id=${empresaId}&buscar=${encodeURIComponent(texto)}`
    );

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
        <button class="small" onclick='agregarAlCarrito(${JSON.stringify(p)})'>Agregar</button>
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

function obtenerDatosComprobante() {
  if (tipoComprobante === 'boleta') {
    return {
      tipo_comprobante: 'boleta',
      cliente_nombre: document.getElementById('clienteNombre').value.trim(),
      cliente_dni: document.getElementById('clienteDni').value.trim(),
      cliente_email: document.getElementById('clienteEmailBoleta').value.trim(),
      cliente_ruc: '',
      cliente_razon_social: '',
      cliente_direccion: '',
    };
  }

  return {
    tipo_comprobante: 'factura',
    cliente_nombre: '',
    cliente_dni: '',
    cliente_email: document.getElementById('clienteEmailFactura').value.trim(),
    cliente_ruc: document.getElementById('clienteRuc').value.trim(),
    cliente_razon_social: document.getElementById('clienteRazonSocial').value.trim(),
    cliente_direccion: document.getElementById('clienteDireccion').value.trim(),
  };
}

function validarEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarComprobante() {
  const datos = obtenerDatosComprobante();

  if (datos.tipo_comprobante === 'boleta') {
    if (!datos.cliente_nombre) {
      return 'Ingresa el nombre completo del cliente para la boleta';
    }

    if (datos.cliente_dni && !/^\d{8}$/.test(datos.cliente_dni)) {
      return 'El DNI debe tener 8 dígitos';
    }

    if (datos.cliente_email && !validarEmail(datos.cliente_email)) {
      return 'Ingresa un correo válido para enviar la boleta';
    }
  }

  if (datos.tipo_comprobante === 'factura') {
    if (!datos.cliente_razon_social) {
      return 'Ingresa la razón social para la factura';
    }

    if (!/^\d{11}$/.test(datos.cliente_ruc)) {
      return 'El RUC debe tener 11 dígitos';
    }

    if (!datos.cliente_email) {
      return 'Ingresa un correo electrónico para la factura';
    }

    if (!validarEmail(datos.cliente_email)) {
      return 'Ingresa un correo válido para enviar la factura';
    }
  }

  return null;
}

function renderResumenComprobante() {
  const contenedor = document.getElementById('resumenComprobante');
  if (!contenedor) return;

  const datos = obtenerDatosComprobante();

  if (tipoComprobante === 'boleta') {
    contenedor.innerHTML = `
      <h4>Datos del comprobante <span class="badge primary">Boleta</span></h4>
      <p><strong>Cliente:</strong> ${datos.cliente_nombre || 'Pendiente'}</p>
      <p><strong>DNI:</strong> ${datos.cliente_dni || '-'}</p>
      <p><strong>Correo:</strong> ${datos.cliente_email || '-'}</p>
    `;
  } else {
    contenedor.innerHTML = `
      <h4>Datos del comprobante <span class="badge primary">Factura</span></h4>
      <p><strong>Razón social:</strong> ${datos.cliente_razon_social || 'Pendiente'}</p>
      <p><strong>RUC:</strong> ${datos.cliente_ruc || '-'}</p>
      <p><strong>Correo:</strong> ${datos.cliente_email || '-'}</p>
    `;
  }
}

function renderCarrito() {
  const tbody = document.getElementById('carrito');
  const totalSpan = document.getElementById('total');
  const subtotalSpan = document.getElementById('subtotalSinIgv');
  const igvSpan = document.getElementById('igvTotal');

  tbody.innerHTML = '';

  let total = 0;

  if (carrito.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">Carrito vacío</td></tr>';
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
      <td>S/ ${item.precio.toFixed(2)}</td>
      <td>S/ ${subtotal.toFixed(2)}</td>
      <td><button class="danger small" onclick="eliminarDelCarrito(${item.id})">X</button></td>
    `;

    tbody.appendChild(fila);
  });

  const calculo = calcularIgvIncluido(total);

  subtotalSpan.textContent = calculo.subtotalSinIgv.toFixed(2);
  igvSpan.textContent = calculo.igv.toFixed(2);
  totalSpan.textContent = calculo.total.toFixed(2);

  renderResumenComprobante();
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

  const errorComprobante = validarComprobante();

  if (errorComprobante) {
    mensaje.textContent = errorComprobante;
    mensaje.style.color = 'red';
    return;
  }

  const body = {
    empresa_id: empresaId,
    usuario_id: Number(vendedorId),
    ...obtenerDatosComprobante(),
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

    mensaje.textContent = `Venta registrada correctamente. ${data.serie}-${String(data.correlativo).padStart(8, '0')}`;
    mensaje.style.color = 'green';

    setTimeout(() => {
      window.location.href = `/pages/comprobante.html?id=${data.venta_id}`;
    }, 900);
  } catch (error) {
    console.error('Error registrando venta:', error);
    mensaje.textContent = 'Error conectando con el servidor';
    mensaje.style.color = 'red';
  }
}

['clienteNombre', 'clienteDni', 'clienteEmailBoleta', 'clienteRazonSocial', 'clienteRuc', 'clienteDireccion', 'clienteEmailFactura']
  .forEach((id) => {
    document.addEventListener('input', (e) => {
      if (e.target && e.target.id === id) renderResumenComprobante();
    });
  });

cargarVendedores();
seleccionarComprobante('boleta');
renderCarrito();
function modoAdminActivo() {
  const usuarioActual = JSON.parse(localStorage.getItem('usuario'));

  return usuarioActual?.modo_admin === true;
}

function inicializarPanelAdminVendedores() {
  const box = document.getElementById('adminVendedoresBox');

  if (!box) return;

  box.style.display = modoAdminActivo() ? 'block' : 'none';

  if (modoAdminActivo()) {
    cargarGestionVendedores();
  }
}

async function cargarGestionVendedores() {
  const contenedor = document.getElementById('listaGestionVendedores');

  if (!contenedor) return;

  try {
    const res = await fetch(`${API_VENDEDORES}?empresa_id=${empresaId}`);
    const data = await res.json();

    if (!data.vendedores || data.vendedores.length === 0) {
      contenedor.innerHTML = '<p>No hay vendedores registrados.</p>';
      return;
    }

    contenedor.innerHTML = data.vendedores.map((v) => `
      <div class="seller-admin-row">
        <div>
          <strong>${v.nombre}</strong>
          <p>${v.email}</p>
        </div>

        <button class="danger small" onclick="eliminarVendedor(${v.id})">
          Eliminar
        </button>
      </div>
    `).join('');
  } catch (error) {
    console.error(error);
    contenedor.innerHTML = '<p>Error cargando vendedores.</p>';
  }
}

async function crearVendedor() {
  const mensaje = document.getElementById('mensajeVendedor');

  const nombre = document.getElementById('nuevoVendedorNombre').value.trim();
  const email = document.getElementById('nuevoVendedorEmail').value.trim();
  const password = document.getElementById('nuevoVendedorPassword').value.trim();

  if (!nombre || !email || !password) {
    mensaje.textContent = 'Completa nombre, correo y contraseña';
    mensaje.style.color = 'red';
    return;
  }

  if (!validarEmail(email)) {
    mensaje.textContent = 'Ingresa un correo válido';
    mensaje.style.color = 'red';
    return;
  }

  try {
    const res = await fetch(`${API}/usuarios/vendedores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa_id: empresaId,
        nombre,
        email,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      mensaje.textContent = data.msg || 'Error creando vendedor';
      mensaje.style.color = 'red';
      return;
    }

    mensaje.textContent = data.msg;
    mensaje.style.color = 'green';

    document.getElementById('nuevoVendedorNombre').value = '';
    document.getElementById('nuevoVendedorEmail').value = '';
    document.getElementById('nuevoVendedorPassword').value = '';

    await cargarVendedores();
    await cargarGestionVendedores();
  } catch (error) {
    console.error(error);
    mensaje.textContent = 'Error conectando con el servidor';
    mensaje.style.color = 'red';
  }
}

async function eliminarVendedor(id) {
  if (!confirm('¿Eliminar este vendedor?')) return;

  const mensaje = document.getElementById('mensajeVendedor');

  try {
    const res = await fetch(`${API}/usuarios/vendedores/${id}?empresa_id=${empresaId}`, {
      method: 'DELETE',
    });

    const data = await res.json();

    if (!res.ok) {
      mensaje.textContent = data.msg || 'Error eliminando vendedor';
      mensaje.style.color = 'red';
      return;
    }

    mensaje.textContent = data.msg;
    mensaje.style.color = 'green';

    await cargarVendedores();
    await cargarGestionVendedores();
  } catch (error) {
    console.error(error);
    mensaje.textContent = 'Error conectando con el servidor';
    mensaje.style.color = 'red';
  }
}

inicializarPanelAdminVendedores();