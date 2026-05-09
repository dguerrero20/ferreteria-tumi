const API_PRODUCTOS = 'https://ferreteria-tumi.onrender.com/api/productos';
const API_CATEGORIAS = 'https://ferreteria-tumi.onrender.com/api/categorias';

let usuario = JSON.parse(localStorage.getItem('usuario'));
let usuarioEsAdmin = usuario?.modo_admin === true;
let empresaId = usuario?.empresa_id;

if (!usuario || !empresaId) {
  window.location.href = '/login.html';
}

async function inicializarProductos() {
  prepararModoAdmin();
  await cargarCategoriasFormulario();
  cargarProductos();
}

function prepararModoAdmin() {
  const formProducto = document.getElementById('formProducto');
  const accionesHeader = document.getElementById('accionesHeader');

  if (usuarioEsAdmin) {
    formProducto.style.display = 'block';

    if (accionesHeader) {
      accionesHeader.style.display = 'table-cell';
    }
  }
}

async function cargarCategoriasFormulario() {
  if (!usuarioEsAdmin) return;

  try {
    const res = await fetch(`${API_CATEGORIAS}?empresa_id=${empresaId}`);
    const data = await res.json();

    const select = document.getElementById('nuevaCategoria');
    select.innerHTML = '<option value="">Seleccionar categoría</option>';

    data.categorias.forEach((cat) => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.nombre;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error cargando categorías:', error);
  }
}

async function cargarTiposFormulario() {
  const categoriaId = document.getElementById('nuevaCategoria').value;
  const tipoSelect = document.getElementById('nuevoTipo');
  const varianteSelect = document.getElementById('nuevaVariante');

  tipoSelect.innerHTML = '<option value="">Seleccionar tipo</option>';
  varianteSelect.innerHTML = '<option value="">Seleccionar variante</option>';

  if (!categoriaId) return;

  try {
    const res = await fetch(`${API_CATEGORIAS}/${categoriaId}/tipos?empresa_id=${empresaId}`);
    const data = await res.json();

    data.tipos.forEach((tipo) => {
      const option = document.createElement('option');
      option.value = tipo.id;
      option.textContent = tipo.nombre;
      tipoSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error cargando tipos:', error);
  }
}

async function cargarVariantesFormulario() {
  const tipoId = document.getElementById('nuevoTipo').value;
  const varianteSelect = document.getElementById('nuevaVariante');

  varianteSelect.innerHTML = '<option value="">Seleccionar variante</option>';

  if (!tipoId) return;

  try {
    const res = await fetch(`${API_CATEGORIAS}/tipos/${tipoId}/variantes?empresa_id=${empresaId}`);
    const data = await res.json();

    data.variantes.forEach((variante) => {
      const option = document.createElement('option');
      option.value = variante.id;
      option.textContent = variante.nombre;
      varianteSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error cargando variantes:', error);
  }
}

async function cargarProductos() {
  try {
    prepararModoAdmin();

    const res = await fetch(`${API_PRODUCTOS}?empresa_id=${empresaId}`);
    const data = await res.json();

    mostrarProductos(data.productos);
  } catch (error) {
    console.error('Error cargando productos:', error);
  }
}

async function buscarProductos() {
  const texto = document.getElementById('buscar').value.trim();

  if (texto === '') {
    cargarProductos();
    return;
  }

  try {
    const res = await fetch(
      `${API_PRODUCTOS}?empresa_id=${empresaId}&buscar=${encodeURIComponent(texto)}`
    );

    const data = await res.json();

    mostrarProductos(data.productos);
  } catch (error) {
    console.error('Error buscando productos:', error);
  }
}

function mostrarProductos(productos) {
  const tbody = document.getElementById('productos');
  tbody.innerHTML = '';

  if (!productos || productos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${usuarioEsAdmin ? 10 : 9}">No se encontraron productos</td>
      </tr>
    `;
    return;
  }

  productos.forEach((p) => {
    const fila = document.createElement('tr');
    const stockClase = Number(p.stock) <= Number(p.stock_min) ? 'stock-bajo' : '';

    fila.innerHTML = `
      <td>${p.id}</td>
      <td>${p.producto}</td>
      <td>${p.categoria}</td>
      <td>${p.tipo}</td>
      <td>${p.variante || '-'}</td>
      <td>${p.marca || '-'}</td>

      <td>
        ${
          usuarioEsAdmin
            ? `
              <input
                type="number"
                step="0.01"
                value="${p.precio}"
                onchange="editarPrecio(${p.id}, this.value)"
                style="width:90px;"
              >
            `
            : `S/ ${Number(p.precio).toFixed(2)}`
        }
      </td>

      <td class="${!usuarioEsAdmin ? stockClase : ''}">
        ${
          usuarioEsAdmin
            ? `
              <input
                type="number"
                step="0.01"
                value="${p.stock}"
                onchange="editarStock(${p.id}, this.value)"
                style="width:80px;"
              >
            `
            : p.stock
        }
      </td>

      <td>${p.unidad_medida}</td>

      ${
        usuarioEsAdmin
          ? `
            <td>
              <button class="danger" onclick="eliminarProducto(${p.id})">
                Eliminar
              </button>
            </td>
          `
          : ''
      }
    `;

    tbody.appendChild(fila);
  });
}

async function crearProducto() {
  const mensaje = document.getElementById('mensajeProducto');

  const body = {
    empresa_id: empresaId,
    categoria_id: document.getElementById('nuevaCategoria').value,
    tipo_id: document.getElementById('nuevoTipo').value,
    variante_id: document.getElementById('nuevaVariante').value,
    marca: document.getElementById('nuevaMarca').value.trim(),
    unidad_medida: document.getElementById('nuevaUnidad').value.trim(),
    precio: document.getElementById('nuevoPrecio').value,
    stock: document.getElementById('nuevoStock').value,
    stock_min: document.getElementById('nuevoStockMin').value,
  };

  if (
    !body.categoria_id ||
    !body.tipo_id ||
    !body.variante_id ||
    !body.marca ||
    !body.unidad_medida ||
    !body.precio ||
    !body.stock ||
    !body.stock_min
  ) {
    mensaje.textContent = 'Completa todos los campos';
    mensaje.style.color = 'red';
    return;
  }

  try {
    const res = await fetch(API_PRODUCTOS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    mensaje.textContent = data.msg;
    mensaje.style.color = res.ok ? 'green' : 'red';

    if (res.ok) {
      document.getElementById('nuevaCategoria').value = '';
      document.getElementById('nuevoTipo').innerHTML = '<option value="">Seleccionar tipo</option>';
      document.getElementById('nuevaVariante').innerHTML = '<option value="">Seleccionar variante</option>';
      document.getElementById('nuevaMarca').value = '';
      document.getElementById('nuevaUnidad').value = '';
      document.getElementById('nuevoPrecio').value = '';
      document.getElementById('nuevoStock').value = '';
      document.getElementById('nuevoStockMin').value = '';

      cargarProductos();
    }
  } catch (error) {
    console.error(error);
    mensaje.textContent = 'Error conectando con el servidor';
    mensaje.style.color = 'red';
  }
}

async function editarPrecio(id, precio) {
  try {
    const res = await fetch(`${API_PRODUCTOS}/${id}/precio`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        precio,
        empresa_id: empresaId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.msg || 'Error actualizando precio');
    }
  } catch (error) {
    console.error(error);
    alert('Error conectando con el servidor');
  }
}

async function editarStock(id, stock) {
  try {
    const res = await fetch(`${API_PRODUCTOS}/${id}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stock,
        empresa_id: empresaId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.msg || 'Error actualizando stock');
    }
  } catch (error) {
    console.error(error);
    alert('Error conectando con el servidor');
  }
}

async function eliminarProducto(id) {
  const confirmar = confirm('¿Eliminar producto?');

  if (!confirmar) return;

  try {
    const res = await fetch(`${API_PRODUCTOS}/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa_id: empresaId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.msg || 'Error eliminando producto');
      return;
    }

    cargarProductos();
  } catch (error) {
    console.error(error);
    alert('Error conectando con el servidor');
  }
}

document.getElementById('nuevaCategoria')?.addEventListener('change', cargarTiposFormulario);
document.getElementById('nuevoTipo')?.addEventListener('change', cargarVariantesFormulario);

inicializarProductos();