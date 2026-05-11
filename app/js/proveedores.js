const API_PROVEEDORES = 'https://ferreteria-tumi.onrender.com/api/proveedores';
const API_CATEGORIAS = 'https://ferreteria-tumi.onrender.com/api/categorias';

const usuario = JSON.parse(localStorage.getItem('usuario'));
const usuarioEsAdmin = usuario?.modo_admin === true;
const empresaId = usuario?.empresa_id;

let proveedorEditando = null;
let proveedoresActuales = [];

if (!usuario || !empresaId) {
  window.location.href = '/login.html';
}

async function cargarCategorias() {
  try {
    const res = await fetch(`${API_CATEGORIAS}?empresa_id=${empresaId}`);
    const data = await res.json();

    const select = document.getElementById('categoria');
    select.innerHTML = '<option value="">Todas las categorías</option>';

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

async function cargarTiposPorCategoria() {
  const categoriaId = document.getElementById('categoria').value;
  const tipoSelect = document.getElementById('tipo');

  tipoSelect.innerHTML = '<option value="">Todos los tipos</option>';

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

async function cargarProveedores(url = `${API_PROVEEDORES}?empresa_id=${empresaId}`) {
  try {
    prepararModoAdmin();

    const res = await fetch(url);
    const data = await res.json();

    proveedoresActuales = data.proveedores || [];
    mostrarProveedores(proveedoresActuales);
  } catch (error) {
    console.error('Error cargando proveedores:', error);
  }
}

function prepararModoAdmin() {
  const formProveedor = document.getElementById('formProveedor');
  const accionesHeader = document.getElementById('accionesHeader');

  if (usuarioEsAdmin) {
    formProveedor.style.display = 'block';
    accionesHeader.style.display = 'table-cell';
  }
}

function mostrarProveedores(proveedores) {
  const tbody = document.getElementById('proveedores');
  tbody.innerHTML = '';

  if (!proveedores || proveedores.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${usuarioEsAdmin ? 6 : 5}">
          No se encontraron proveedores
        </td>
      </tr>
    `;
    return;
  }

  proveedores.forEach((p) => {
    const fila = document.createElement('tr');
    const editando = proveedorEditando === p.id;

    fila.innerHTML = `
      <td>
        ${
          editando
            ? `<input id="empresa-${p.id}" value="${p.empresa || ''}" style="min-width:160px;">`
            : `${p.empresa || '-'}`
        }
      </td>

      <td>
        ${
          editando
            ? `<input id="nombre-${p.id}" value="${p.nombre || ''}" style="min-width:140px;">`
            : `${p.nombre || '-'}`
        }
      </td>

      <td>
        ${
          editando
            ? `<input id="telefono-${p.id}" value="${p.telefono || ''}" style="min-width:120px;">`
            : `${p.telefono || '-'}`
        }
      </td>

      <td>
        ${
          editando
            ? `<input id="email-${p.id}" value="${p.email || ''}" style="min-width:180px;">`
            : `${p.email || '-'}`
        }
      </td>

      <td>
        ${
          editando
            ? `<input id="direccion-${p.id}" value="${p.direccion || ''}" style="min-width:200px;">`
            : `${p.direccion || '-'}`
        }
      </td>

      ${
        usuarioEsAdmin
          ? `
            <td>
              ${
                editando
                  ? `
                    <button class="small" onclick="actualizarProveedor(${p.id})">Guardar</button>
<button class="secondary small" onclick="cancelarEdicion()">Cancelar</button>
                  `
                  : `
                    <button onclick="editarProveedor(${p.id})">Editar</button>
                    <button class="danger" onclick="eliminarProveedor(${p.id})">Eliminar</button>
                  `
              }
            </td>
          `
          : ''
      }
    `;

    tbody.appendChild(fila);
  });
}

function editarProveedor(id) {
  proveedorEditando = id;
  mostrarProveedores(proveedoresActuales);
}

function cancelarEdicion() {
  proveedorEditando = null;
  mostrarProveedores(proveedoresActuales);
}

function filtrarProveedores() {
  const buscar = document.getElementById('buscar').value.trim();
  const categoriaId = document.getElementById('categoria').value;
  const tipoId = document.getElementById('tipo').value;

  const params = new URLSearchParams();

  params.append('empresa_id', empresaId);

  if (buscar) params.append('buscar', buscar);
  if (categoriaId) params.append('categoria_id', categoriaId);
  if (tipoId) params.append('tipo_id', tipoId);

  cargarProveedores(`${API_PROVEEDORES}?${params.toString()}`);
}

function limpiarFiltros() {
  document.getElementById('buscar').value = '';
  document.getElementById('categoria').value = '';
  document.getElementById('tipo').innerHTML = '<option value="">Todos los tipos</option>';

  cargarProveedores();
}

async function crearProveedor() {
  const mensaje = document.getElementById('mensajeProveedor');

  const body = {
    empresa_id: empresaId,
    nombre: document.getElementById('nuevoNombre').value.trim(),
    empresa: document.getElementById('nuevaEmpresa').value.trim(),
    telefono: document.getElementById('nuevoTelefono').value.trim(),
    email: document.getElementById('nuevoEmail').value.trim(),
    direccion: document.getElementById('nuevaDireccion').value.trim(),
  };

  if (!body.nombre || !body.empresa || !body.telefono) {
    mensaje.textContent = 'Completa nombre, empresa y teléfono';
    mensaje.style.color = 'red';
    return;
  }

  try {
    const res = await fetch(API_PROVEEDORES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    mensaje.textContent = data.msg;
    mensaje.style.color = res.ok ? 'green' : 'red';

    if (res.ok) {
      document.getElementById('nuevoNombre').value = '';
      document.getElementById('nuevaEmpresa').value = '';
      document.getElementById('nuevoTelefono').value = '';
      document.getElementById('nuevoEmail').value = '';
      document.getElementById('nuevaDireccion').value = '';

      cargarProveedores();
    }
  } catch (error) {
    console.error(error);
    mensaje.textContent = 'Error conectando con el servidor';
    mensaje.style.color = 'red';
  }
}

async function actualizarProveedor(id) {
  const confirmar = confirm(
    '¿Estás seguro de hacer estos cambios?'
  );

  if (!confirmar) {
    cancelarEdicion();
    return;
  }

  const body = {
    empresa_id: empresaId,
    nombre: document.getElementById(`nombre-${id}`).value.trim(),
    empresa: document.getElementById(`empresa-${id}`).value.trim(),
    telefono: document.getElementById(`telefono-${id}`).value.trim(),
    email: document.getElementById(`email-${id}`).value.trim(),
    direccion: document.getElementById(`direccion-${id}`).value.trim(),
  };

  try {
    const res = await fetch(`${API_PROVEEDORES}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.msg || 'Error actualizando proveedor');
      return;
    }

    alert('Proveedor actualizado correctamente');

    proveedorEditando = null;
    cargarProveedores();
  } catch (error) {
    console.error(error);
    alert('Error conectando con el servidor');
  }
}

async function eliminarProveedor(id) {
  const confirmar = confirm('¿Eliminar proveedor?');

  if (!confirmar) return;

  try {
    const res = await fetch(`${API_PROVEEDORES}/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa_id: empresaId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.msg || 'Error eliminando proveedor');
      return;
    }

    cargarProveedores();
  } catch (error) {
    console.error(error);
    alert('Error conectando con el servidor');
  }
}

document
  .getElementById('categoria')
  .addEventListener('change', cargarTiposPorCategoria);

cargarCategorias();
cargarProveedores();