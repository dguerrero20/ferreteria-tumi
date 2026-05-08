const API_CATEGORIAS = 'http://localhost:3000/api/categorias';

const usuario = JSON.parse(localStorage.getItem('usuario'));
const usuarioEsAdmin = usuario?.modo_admin === true;

if (!usuarioEsAdmin) {
  alert('Solo el administrador puede gestionar categorías');
  window.location.href = '/app/pages/dashboard.html';
}

async function cargarCategorias() {
  try {
    const res = await fetch(API_CATEGORIAS);
    const data = await res.json();

    const selects = [
      document.getElementById('categoriaTipo'),
      document.getElementById('categoriaVariante'),
    ];

    selects.forEach((select) => {
      select.innerHTML = '<option value="">Seleccionar categoría</option>';

      data.categorias.forEach((cat) => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.nombre;
        select.appendChild(option);
      });
    });

    const tbody = document.getElementById('tablaCategorias');
    tbody.innerHTML = '';

    data.categorias.forEach((cat) => {
      const fila = document.createElement('tr');

      fila.innerHTML = `
        <td>${cat.id}</td>
        <td>${cat.nombre}</td>
      `;

      tbody.appendChild(fila);
    });
  } catch (error) {
    console.error('Error cargando categorías:', error);
  }
}

async function cargarTiposParaVariante() {
  const categoriaId = document.getElementById('categoriaVariante').value;
  const tipoSelect = document.getElementById('tipoVariante');

  tipoSelect.innerHTML = '<option value="">Seleccionar tipo</option>';

  if (!categoriaId) return;

  try {
    const res = await fetch(`${API_CATEGORIAS}/${categoriaId}/tipos`);
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

async function crearCategoria() {
  const nombre = document.getElementById('nombreCategoria').value.trim();
  const mensaje = document.getElementById('mensajeCategoria');

  if (!nombre) {
    mensaje.textContent = 'Ingresa el nombre de la categoría';
    mensaje.style.color = 'red';
    return;
  }

  const res = await fetch(API_CATEGORIAS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre }),
  });

  const data = await res.json();

  mensaje.textContent = data.msg;
  mensaje.style.color = res.ok ? 'green' : 'red';

  if (res.ok) {
    document.getElementById('nombreCategoria').value = '';
    cargarCategorias();
  }
}

async function crearTipo() {
  const categoria_id = document.getElementById('categoriaTipo').value;
  const nombre = document.getElementById('nombreTipo').value.trim();
  const mensaje = document.getElementById('mensajeTipo');

  if (!categoria_id || !nombre) {
    mensaje.textContent = 'Selecciona categoría e ingresa tipo';
    mensaje.style.color = 'red';
    return;
  }

  const res = await fetch(`${API_CATEGORIAS}/tipos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoria_id, nombre }),
  });

  const data = await res.json();

  mensaje.textContent = data.msg;
  mensaje.style.color = res.ok ? 'green' : 'red';

  if (res.ok) {
    document.getElementById('nombreTipo').value = '';
  }
}

async function crearVariante() {
  const tipo_id = document.getElementById('tipoVariante').value;
  const nombre = document.getElementById('nombreVariante').value.trim();
  const mensaje = document.getElementById('mensajeVariante');

  if (!tipo_id || !nombre) {
    mensaje.textContent = 'Selecciona tipo e ingresa variante';
    mensaje.style.color = 'red';
    return;
  }

  const res = await fetch(`${API_CATEGORIAS}/variantes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo_id, nombre }),
  });

  const data = await res.json();

  mensaje.textContent = data.msg;
  mensaje.style.color = res.ok ? 'green' : 'red';

  if (res.ok) {
    document.getElementById('nombreVariante').value = '';
  }
}

document
  .getElementById('categoriaVariante')
  .addEventListener('change', cargarTiposParaVariante);

cargarCategorias();