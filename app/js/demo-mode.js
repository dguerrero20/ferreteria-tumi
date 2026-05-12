let demoData = obtenerDemoData();
let carrito = [];
let graficoActual = null;
let vistaActual = 'datos';

localStorage.setItem(
  'usuario',
  JSON.stringify(demoData.usuario)
);

/* ========================= */
/* HELPERS */
/* ========================= */

function guardarDemo() {
  guardarDemoData(demoData);
}

function cerrarSesion() {
  window.location.href = '/index.html';
}

function verificarSesion() {
  return true;
}

function obtenerUsuario() {
  return demoData.usuario;
}

function esAdmin() {
  return demoData.usuario.modo_admin === true;
}

function aplicarTemaGuardado() {
  const tema = localStorage.getItem('tema');

  if (tema === 'oscuro') {
    document.body.classList.add('dark-mode');
    document.documentElement.classList.add('dark-mode-preload');
  } else {
    document.body.classList.remove('dark-mode');
    document.documentElement.classList.remove('dark-mode-preload');
  }
}

function reescribirLinksDemo() {
  const links = document.querySelectorAll('.sidebar a');

  links.forEach((link) => {
    const texto = link.textContent.trim().toLowerCase();

    if (texto.includes('dashboard')) link.href = './demo-dashboard.html';
    if (texto.includes('productos')) link.href = './demo-productos.html';
    if (texto.includes('ventas')) link.href = './demo-ventas.html';
    if (texto.includes('proveedores')) link.href = './demo-proveedores.html';
    if (texto.includes('reportes')) link.href = './demo-reportes.html';
    if (texto.includes('perfil')) link.href = './demo-perfil.html';
    if (texto.includes('categorías')) link.href = '#';
  });
}

/* ========================= */
/* PRODUCTOS */
/* ========================= */

function prepararModoAdmin() {
  const formProducto = document.getElementById('formProducto');
  const formProveedor = document.getElementById('formProveedor');
  const accionesHeader = document.getElementById('accionesHeader');

  if (formProducto) formProducto.style.display = 'block';
  if (formProveedor) formProveedor.style.display = 'block';
  if (accionesHeader) accionesHeader.style.display = 'table-cell';
}

function cargarCategoriasFormulario() {
  const select = document.getElementById('nuevaCategoria');
  if (!select) return;

  select.innerHTML = '<option value="">Seleccionar categoría</option>';

  demoData.categorias.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.nombre;
    select.appendChild(option);
  });
}

function cargarTiposFormulario() {
  const categoriaId = Number(document.getElementById('nuevaCategoria')?.value);
  const tipoSelect = document.getElementById('nuevoTipo');
  const varianteSelect = document.getElementById('nuevaVariante');

  if (!tipoSelect || !varianteSelect) return;

  tipoSelect.innerHTML = '<option value="">Seleccionar tipo</option>';
  varianteSelect.innerHTML = '<option value="">Seleccionar variante</option>';

  const categoria = demoData.categorias.find((cat) => cat.id === categoriaId);
  if (!categoria) return;

  categoria.tipos.forEach((tipo) => {
    const option = document.createElement('option');
    option.value = tipo.id;
    option.textContent = tipo.nombre;
    tipoSelect.appendChild(option);
  });
}

function cargarVariantesFormulario() {
  const tipoId = Number(document.getElementById('nuevoTipo')?.value);
  const varianteSelect = document.getElementById('nuevaVariante');

  if (!varianteSelect) return;

  varianteSelect.innerHTML = '<option value="">Seleccionar variante</option>';

  let tipoEncontrado = null;

  demoData.categorias.forEach((cat) => {
    const tipo = cat.tipos.find((t) => t.id === tipoId);
    if (tipo) tipoEncontrado = tipo;
  });

  if (!tipoEncontrado) return;

  tipoEncontrado.variantes.forEach((variante) => {
    const option = document.createElement('option');
    option.value = variante.id;
    option.textContent = variante.nombre;
    varianteSelect.appendChild(option);
  });
}

function cargarProductos() {
  mostrarProductos(demoData.productos);
}

function buscarProductos() {
  const buscar = document.getElementById('buscar');
  const texto = buscar ? buscar.value.trim().toLowerCase() : '';

  if (!texto) {
    cargarProductos();
    return;
  }

  const filtrados = demoData.productos.filter((p) =>
    p.producto.toLowerCase().includes(texto) ||
    p.categoria.toLowerCase().includes(texto) ||
    p.marca.toLowerCase().includes(texto)
  );

  if (document.getElementById('resultados')) {
    mostrarResultados(filtrados);
  } else {
    mostrarProductos(filtrados);
  }
}

function mostrarProductos(productos) {
  const tbody = document.getElementById('productos');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!productos || productos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10">No se encontraron productos</td></tr>';
    return;
  }

  productos.forEach((p) => {
    const fila = document.createElement('tr');

    fila.innerHTML = `
      <td>${p.id}</td>
      <td>${p.producto}</td>
      <td>${p.categoria}</td>
      <td>${p.tipo}</td>
      <td>${p.variante || '-'}</td>
      <td>${p.marca || '-'}</td>
      <td>
        <input type="number" step="0.01" value="${p.precio}" onchange="editarPrecio(${p.id}, this.value)" style="width:90px;">
      </td>
      <td>
        <input type="number" step="0.01" value="${p.stock}" onchange="editarStock(${p.id}, this.value)" style="width:80px;">
      </td>
      <td>${p.unidad_medida}</td>
      <td>
        <button class="danger small" onclick="eliminarProducto(${p.id})">Eliminar</button>
      </td>
    `;

    tbody.appendChild(fila);
  });
}

function crearProducto() {
  const mensaje = document.getElementById('mensajeProducto');

  const categoriaId = Number(document.getElementById('nuevaCategoria')?.value);
  const tipoId = Number(document.getElementById('nuevoTipo')?.value);
  const varianteId = Number(document.getElementById('nuevaVariante')?.value);

  const categoria = demoData.categorias.find((c) => c.id === categoriaId);
  const tipo = categoria?.tipos.find((t) => t.id === tipoId);
  const variante = tipo?.variantes.find((v) => v.id === varianteId);

  const marca = document.getElementById('nuevaMarca')?.value.trim();
  const unidad = document.getElementById('nuevaUnidad')?.value.trim();
  const precio = Number(document.getElementById('nuevoPrecio')?.value);
  const stock = Number(document.getElementById('nuevoStock')?.value);
  const stockMin = Number(document.getElementById('nuevoStockMin')?.value);

  if (!categoria || !tipo || !variante || !marca || !unidad || !precio || !stock || !stockMin) {
    mensaje.textContent = 'Completa todos los campos';
    mensaje.style.color = 'red';
    return;
  }

  demoData.productos.push({
    id: Date.now(),
    producto: `${variante.nombre} ${marca}`,
    categoria: categoria.nombre,
    tipo: tipo.nombre,
    variante: variante.nombre,
    marca,
    precio,
    stock,
    stock_min: stockMin,
    unidad_medida: unidad,
  });

  guardarDemo();

  mensaje.textContent = 'Producto creado en demo';
  mensaje.style.color = 'green';

  cargarProductos();
}

function editarPrecio(id, precio) {
  const producto = demoData.productos.find((p) => p.id === id);
  if (!producto) return;

  producto.precio = Number(precio);
  guardarDemo();
}

function editarStock(id, stock) {
  const producto = demoData.productos.find((p) => p.id === id);
  if (!producto) return;

  producto.stock = Number(stock);
  guardarDemo();
}

function eliminarProducto(id) {
  if (!confirm('¿Eliminar producto de la demo?')) return;

  demoData.productos = demoData.productos.filter((p) => p.id !== id);
  guardarDemo();
  cargarProductos();
}

/* ========================= */
/* VENTAS */
/* ========================= */

function cargarVendedores() {
  const select = document.getElementById('vendedor');
  if (!select) return;

  select.innerHTML = '<option value="">Seleccionar vendedor</option>';

  demoData.vendedores.forEach((v) => {
    const option = document.createElement('option');
    option.value = v.id;
    option.textContent = v.nombre;
    select.appendChild(option);
  });
}

function mostrarResultados(productos) {
  const tbody = document.getElementById('resultados');
  if (!tbody) return;

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
      <td><button onclick='agregarAlCarrito(${JSON.stringify(p)})'>Agregar</button></td>
    `;

    tbody.appendChild(fila);
  });
}

function agregarAlCarrito(producto) {
  const existente = carrito.find((item) => item.id === producto.id);

  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({
      ...producto,
      cantidad: 1,
    });
  }

  renderCarrito();
}

function cambiarCantidad(id, cantidad) {
  const item = carrito.find((p) => p.id === id);
  if (!item) return;

  item.cantidad = Number(cantidad);

  if (item.cantidad <= 0) {
    eliminarDelCarrito(id);
    return;
  }

  renderCarrito();
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter((p) => p.id !== id);
  renderCarrito();
}

function renderCarrito() {
  const tbody = document.getElementById('carrito');
  const totalSpan = document.getElementById('total');

  if (!tbody || !totalSpan) return;

  tbody.innerHTML = '';

  let total = 0;

  if (carrito.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">Carrito vacío</td></tr>';
  }

  carrito.forEach((item) => {
    const subtotal = Number(item.precio) * Number(item.cantidad);
    total += subtotal;

    const fila = document.createElement('tr');

    fila.innerHTML = `
      <td>${item.producto}</td>
      <td>
        <input type="number" min="1" value="${item.cantidad}" onchange="cambiarCantidad(${item.id}, this.value)" style="width:70px;">
        ${item.unidad_medida}
      </td>
      <td>S/ ${subtotal.toFixed(2)}</td>
      <td><button class="danger small" onclick="eliminarDelCarrito(${item.id})">X</button></td>
    `;

    tbody.appendChild(fila);
  });

  totalSpan.textContent = total.toFixed(2);
}

function registrarVenta() {
  const mensaje = document.getElementById('mensaje');
  const vendedorId = Number(document.getElementById('vendedor')?.value);

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

  const vendedor = demoData.vendedores.find((v) => v.id === vendedorId);
  const total = carrito.reduce((sum, item) => sum + Number(item.precio) * Number(item.cantidad), 0);

  carrito.forEach((item) => {
    const producto = demoData.productos.find((p) => p.id === item.id);
    if (producto) producto.stock -= Number(item.cantidad);
  });

  demoData.ventas.push({
    id: Date.now(),
    usuario_id: vendedorId,
    usuario: vendedor?.nombre || 'Demo',
    total,
    created_at: new Date().toISOString(),
    productos: carrito.map((item) => ({
      producto_id: item.id,
      cantidad: item.cantidad,
    })),
  });

  guardarDemo();

  mensaje.textContent = `Venta demo registrada. Total: S/ ${total.toFixed(2)}`;
  mensaje.style.color = 'green';

  carrito = [];
  renderCarrito();
}

/* ========================= */
/* PROVEEDORES */
/* ========================= */

function cargarCategorias() {
  const select = document.getElementById('categoria');
  if (!select) return;

  select.innerHTML = '<option value="">Todas las categorías</option>';

  demoData.categorias.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.nombre;
    select.appendChild(option);
  });
}

function cargarTiposPorCategoria() {
  const categoriaId = Number(document.getElementById('categoria')?.value);
  const tipoSelect = document.getElementById('tipo');

  if (!tipoSelect) return;

  tipoSelect.innerHTML = '<option value="">Todos los tipos</option>';

  const categoria = demoData.categorias.find((c) => c.id === categoriaId);
  if (!categoria) return;

  categoria.tipos.forEach((tipo) => {
    const option = document.createElement('option');
    option.value = tipo.id;
    option.textContent = tipo.nombre;
    tipoSelect.appendChild(option);
  });
}

function cargarProveedores(lista = demoData.proveedores) {
  mostrarProveedores(lista);
}

function mostrarProveedores(proveedores) {
  const tbody = document.getElementById('proveedores');
  if (!tbody) return;

  tbody.innerHTML = '';

  proveedores.forEach((p) => {
    const fila = document.createElement('tr');

    fila.innerHTML = `
      <td>${p.empresa}</td>
      <td>${p.nombre}</td>
      <td>${p.telefono}</td>
      <td>${p.email}</td>
      <td>${p.direccion}</td>
      <td>
        <button class="danger small" onclick="eliminarProveedor(${p.id})">Eliminar</button>
      </td>
    `;

    tbody.appendChild(fila);
  });
}

function filtrarProveedores() {
  const texto = document.getElementById('buscar')?.value.trim().toLowerCase() || '';

  const filtrados = demoData.proveedores.filter((p) =>
    p.empresa.toLowerCase().includes(texto) ||
    p.nombre.toLowerCase().includes(texto) ||
    p.telefono.includes(texto)
  );

  cargarProveedores(filtrados);
}

function limpiarFiltros() {
  document.getElementById('buscar').value = '';
  cargarProveedores();
}

function crearProveedor() {
  const mensaje = document.getElementById('mensajeProveedor');

  const nombre = document.getElementById('nuevoNombre')?.value.trim();
  const empresa = document.getElementById('nuevaEmpresa')?.value.trim();
  const telefono = document.getElementById('nuevoTelefono')?.value.trim();
  const email = document.getElementById('nuevoEmail')?.value.trim();
  const direccion = document.getElementById('nuevaDireccion')?.value.trim();

  if (!nombre || !empresa || !telefono) {
    mensaje.textContent = 'Completa nombre, empresa y teléfono';
    mensaje.style.color = 'red';
    return;
  }

  demoData.proveedores.push({
    id: Date.now(),
    nombre,
    empresa,
    telefono,
    email,
    direccion,
  });

  guardarDemo();

  mensaje.textContent = 'Proveedor creado en demo';
  mensaje.style.color = 'green';

  cargarProveedores();
}

function eliminarProveedor(id) {
  if (!confirm('¿Eliminar proveedor de la demo?')) return;

  demoData.proveedores = demoData.proveedores.filter((p) => p.id !== id);
  guardarDemo();
  cargarProveedores();
}

/* ========================= */
/* PERFIL */
/* ========================= */

function actualizarModoAdmin() {
  const modoTexto = document.getElementById('modoAdmin');
  const boton = document.getElementById('btnAdmin');

  if (!modoTexto || !boton) return;

  modoTexto.classList.remove('success', 'warning');

  if (demoData.usuario.modo_admin) {
    modoTexto.textContent = 'Activo';
    modoTexto.classList.add('success');
    boton.textContent = 'Salir del modo administrador';
    boton.classList.add('danger');
  } else {
    modoTexto.textContent = 'Inactivo';
    modoTexto.classList.add('warning');
    boton.textContent = 'Activar modo administrador';
    boton.classList.remove('danger');
  }
}

function activarModoAdmin() {
  demoData.usuario.modo_admin = !demoData.usuario.modo_admin;
  guardarDemo();
  actualizarModoAdmin();
}

function recuperarAdminPassword() {
  alert('Demo: esta función enviaría un correo de recuperación.');
}

/* ========================= */
/* REPORTES */
/* ========================= */

function cambiarVista(vista) {
  vistaActual = vista;

  const graficoBox = document.getElementById('graficoBox');
  const contenido = document.getElementById('contenidoReporte');

  if (!graficoBox || !contenido) return;

  graficoBox.style.display = vista === 'graficos' ? 'block' : 'none';
  contenido.style.display = vista === 'datos' ? 'block' : 'none';
}

function limpiarVista(titulo) {
  document.getElementById('tituloReporte').textContent = titulo;
  document.getElementById('resumenReporte').innerHTML = '';
  document.getElementById('contenidoReporte').innerHTML = '';

  if (graficoActual) {
    graficoActual.destroy();
    graficoActual = null;
  }
}

function crearGrafico(tipo, labels, datos, titulo) {
  const canvas = document.getElementById('graficoReporte');
  if (!canvas || typeof Chart === 'undefined') return;

  if (graficoActual) graficoActual.destroy();

  graficoActual = new Chart(canvas, {
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
  });

  cambiarVista(vistaActual);
}

function reporteInventario() {
  limpiarVista('Reporte de Inventario');

  document.getElementById('resumenReporte').innerHTML = `
    <div class="resumen">
      <strong>Total productos:</strong> ${demoData.productos.length}
    </div>
  `;

  let html = `
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th>Stock</th>
        </tr>
      </thead>
      <tbody>
  `;

  demoData.productos.forEach((p) => {
    html += `
      <tr>
        <td>${p.producto}</td>
        <td>${p.categoria}</td>
        <td>S/ ${Number(p.precio).toFixed(2)}</td>
        <td>${p.stock}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';

  document.getElementById('contenidoReporte').innerHTML = html;

  crearGrafico(
    'bar',
    demoData.productos.map((p) => p.producto),
    demoData.productos.map((p) => p.stock),
    'Stock'
  );
}

function reporteStockBajo() {
  limpiarVista('Reporte de Stock Bajo');

  const bajos = demoData.productos.filter((p) => Number(p.stock) <= Number(p.stock_min));

  document.getElementById('resumenReporte').innerHTML = `
    <div class="resumen">
      <strong>Productos con stock bajo:</strong> ${bajos.length}
    </div>
  `;

  document.getElementById('contenidoReporte').innerHTML =
    bajos.map((p) => `<p>${p.producto} - Stock: ${p.stock}</p>`).join('');

  crearGrafico(
    'bar',
    bajos.map((p) => p.producto),
    bajos.map((p) => p.stock),
    'Stock bajo'
  );
}

function reporteVentasSimple() {
  limpiarVista('Reporte General de Ventas');

  const total = demoData.ventas.reduce((sum, v) => sum + Number(v.total), 0);

  document.getElementById('resumenReporte').innerHTML = `
    <div class="resumen">
      <p><strong>Total ventas:</strong> ${demoData.ventas.length}</p>
      <p><strong>Ingresos totales:</strong> S/ ${total.toFixed(2)}</p>
    </div>
  `;

  document.getElementById('contenidoReporte').innerHTML =
    demoData.ventas.map((v) => `<p>Venta #${v.id} - S/ ${Number(v.total).toFixed(2)}</p>`).join('');

  crearGrafico(
    'bar',
    demoData.ventas.map((v) => `Venta ${v.id}`),
    demoData.ventas.map((v) => v.total),
    'Ventas'
  );
}

const reporteVentasPorFecha = reporteVentasSimple;
const productosMasVendidos = reporteInventario;
const productosMenosVendidos = reporteInventario;
const vendedoresTop = reporteVentasSimple;
function toggleTodosVendedores() {}

/* ========================= */
/* DASHBOARD DEMO */
/* ========================= */

function cargarDashboardDemo() {
  const totalVentas = document.getElementById('totalVentas');
  const totalProductos = document.getElementById('totalProductos');
  const stockBajo = document.getElementById('stockBajo');
  const ventasHoy = document.getElementById('ventasHoy');
  const tbody = document.getElementById('ventas');

  if (!totalVentas || !totalProductos || !stockBajo) return;

  totalVentas.textContent = demoData.ventas.length;
  totalProductos.textContent = demoData.productos.length;
  stockBajo.textContent = demoData.productos.filter((p) => p.stock <= p.stock_min).length;

  if (ventasHoy) {
    const total = demoData.ventas.reduce((sum, v) => sum + Number(v.total), 0);
    ventasHoy.textContent = total.toFixed(2);
  }

  if (tbody) {
    tbody.innerHTML = '';

    demoData.ventas.slice(0, 4).forEach((venta) => {
      const fila = document.createElement('tr');

      fila.innerHTML = `
        <td>#${String(venta.id).padStart(3, '0')}</td>
        <td>S/ ${Number(venta.total).toFixed(2)}</td>
        <td>${new Date(venta.created_at).toLocaleString('es-PE')}</td>
      `;

      tbody.appendChild(fila);
    });
  }
}

/* ========================= */
/* INIT */
/* ========================= */

document.addEventListener('DOMContentLoaded', () => {
  aplicarTemaGuardado();
  reescribirLinksDemo();
  prepararModoAdmin();

  document.getElementById('nuevaCategoria')?.addEventListener('change', cargarTiposFormulario);
  document.getElementById('nuevoTipo')?.addEventListener('change', cargarVariantesFormulario);
  document.getElementById('categoria')?.addEventListener('change', cargarTiposPorCategoria);

  if (document.getElementById('productos')) {
    cargarCategoriasFormulario();
    cargarProductos();
  }

  if (document.getElementById('vendedor')) {
    cargarVendedores();
    renderCarrito();
  }

  if (document.getElementById('proveedores')) {
    cargarCategorias();
    cargarProveedores();
  }

  if (document.getElementById('nombre')) {
    document.getElementById('nombre').textContent = demoData.usuario.nombre;
    document.getElementById('email').textContent = demoData.usuario.email;
    document.getElementById('rol').textContent = demoData.usuario.rol;
    actualizarModoAdmin();
  }

  if (document.getElementById('totalVentas')) {
    cargarDashboardDemo();
  }

  if (document.getElementById('tituloReporte')) {
    cambiarVista('datos');
  }
});