const API_CATEGORIAS = 'https://ferreteria-tumi.onrender.com/api/categorias';

const usuario = JSON.parse(localStorage.getItem('usuario'));
const usuarioEsAdmin = usuario?.modo_admin === true;
const empresaId = usuario?.empresa_id;

if (!usuario || !empresaId) {
  window.location.href = '/login.html';
}

if (!usuarioEsAdmin) {
  alert('Solo el administrador puede gestionar categorías');
  window.location.href = '/pages/dashboard.html';
}

async function cargarCategorias() {
  try {
    const res = await fetch(`${API_CATEGORIAS}?empresa_id=${empresaId}`);
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
        <td>
          <button class="danger" onclick="eliminarCategoria(${cat.id})">
            Eliminar
          </button>
        </td>
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
    const res = await fetch(
      `${API_CATEGORIAS}/${categoriaId}/tipos?empresa_id=${empresaId}`
    );

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

  try {
    const res = await fetch(API_CATEGORIAS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        empresa_id: empresaId,
      }),
    });

    const data = await res.json();

    mensaje.textContent = data.msg;
    mensaje.style.color = res.ok ? 'green' : 'red';

    if (res.ok) {
      document.getElementById('nombreCategoria').value = '';
      cargarCategorias();
    }
  } catch (error) {
    console.error('Error creando categoría:', error);
    mensaje.textContent = 'Error conectando con el servidor';
    mensaje.style.color = 'red';
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

  try {
    const res = await fetch(`${API_CATEGORIAS}/tipos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoria_id,
        nombre,
        empresa_id: empresaId,
      }),
    });

    const data = await res.json();

    mensaje.textContent = data.msg;
    mensaje.style.color = res.ok ? 'green' : 'red';

    if (res.ok) {
      document.getElementById('nombreTipo').value = '';
    }
  } catch (error) {
    console.error('Error creando tipo:', error);
    mensaje.textContent = 'Error conectando con el servidor';
    mensaje.style.color = 'red';
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

  try {
    const res = await fetch(`${API_CATEGORIAS}/variantes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo_id,
        nombre,
        empresa_id: empresaId,
      }),
    });

    const data = await res.json();

    mensaje.textContent = data.msg;
    mensaje.style.color = res.ok ? 'green' : 'red';

    if (res.ok) {
      document.getElementById('nombreVariante').value = '';
    }
  } catch (error) {
    console.error('Error creando variante:', error);
    mensaje.textContent = 'Error conectando con el servidor';
    mensaje.style.color = 'red';
  }
}

async function eliminarCategoria(id) {
  const confirmar = confirm(
    '¿Estás seguro de eliminar esta categoría?'
  );

  if (!confirmar) {
    return;
  }

  try {
    const resValidacion = await fetch(
      `${API_CATEGORIAS}/${id}/tipos?empresa_id=${empresaId}`
    );

    const dataValidacion = await resValidacion.json();

    if (
      dataValidacion.tipos &&
      dataValidacion.tipos.length > 0
    ) {
      const segundaConfirmacion = confirm(
        'Esta categoría contiene datos relacionados.\n\n' +
        'Si continúas, se perderán permanentemente.\n\n' +
        '¿Deseas continuar?'
      );

      if (!segundaConfirmacion) {
        return;
      }
    }

    const res = await fetch(
      `${API_CATEGORIAS}/${id}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id: empresaId,
        }),
      }
    );

    const data = await res.json();

    alert(data.msg);

    if (res.ok) {
      cargarCategorias();
    }
  } catch (error) {
    console.error(error);
    alert('Error eliminando categoría');
  }
}

document
  .getElementById('categoriaVariante')
  .addEventListener('change', cargarTiposParaVariante);

cargarCategorias();