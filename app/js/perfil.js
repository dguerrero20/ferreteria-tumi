const API_ADMIN =
  'https://ferreteria-tumi.onrender.com/api/auth/verificar-admin';

const API_CAMBIAR_ADMIN_PASSWORD =
  'https://ferreteria-tumi.onrender.com/api/auth/cambiar-admin-password';

const usuario =
  JSON.parse(localStorage.getItem('usuario'));

document.getElementById('nombre')
  .textContent = usuario.nombre;

document.getElementById('email')
  .textContent = usuario.email;

document.getElementById('rol')
  .textContent = usuario.rol;

actualizarModoAdmin();

function actualizarModoAdmin() {

  const usuarioActual =
    JSON.parse(localStorage.getItem('usuario'));

  const modoTexto =
    document.getElementById('modoAdmin');

  const boton =
    document.getElementById('btnAdmin');

  if (usuarioActual.modo_admin) {

    modoTexto.textContent = 'Sí';

    boton.textContent =
      'Salir del modo administrador';

    boton.classList.add('danger');

  } else {

    modoTexto.textContent = 'No';

    boton.textContent =
      'Activar modo administrador';

    boton.classList.remove('danger');
  }
}

async function activarModoAdmin() {

  const usuarioActual =
    JSON.parse(localStorage.getItem('usuario'));

  const mensaje =
    document.getElementById('mensaje');

  // SI YA ES ADMIN → SALIR
  if (usuarioActual.modo_admin) {

    usuarioActual.modo_admin = false;

    localStorage.setItem(
      'usuario',
      JSON.stringify(usuarioActual)
    );

    actualizarModoAdmin();

    mensaje.textContent =
      'Modo administrador desactivado';

    mensaje.style.color =
      '#dc2626';

    return;
  }

  // SI NO ES ADMIN → PEDIR PASSWORD
  const adminPassword =
    document.getElementById('adminPassword').value;

  if (!adminPassword) {

    mensaje.textContent =
      'Ingresa contraseña admin';

    mensaje.style.color =
      'red';

    return;
  }

  try {

    const res = await fetch(API_ADMIN, {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify({
        user_id: usuario.id,
        admin_password: adminPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok) {

      mensaje.textContent =
        data.msg;

      mensaje.style.color =
        'red';

      return;
    }

    usuarioActual.modo_admin = true;

    localStorage.setItem(
      'usuario',
      JSON.stringify(usuarioActual)
    );

    actualizarModoAdmin();

    mensaje.textContent =
      'Modo administrador activado';

    mensaje.style.color =
      'green';

  } catch (error) {

    console.error(error);

    mensaje.textContent =
      'Error activando admin';

    mensaje.style.color =
      'red';
  }
}

async function cambiarAdminPassword() {

  const nuevaPassword =
    document.getElementById('nuevaAdminPassword').value.trim();

  const confirmarPassword =
    document.getElementById('confirmarAdminPassword').value.trim();

  const mensaje =
    document.getElementById('mensajeAdminPassword');

  if (!nuevaPassword || !confirmarPassword) {

    mensaje.textContent =
      'Completa ambos campos';

    mensaje.style.color =
      'red';

    return;
  }

  if (nuevaPassword !== confirmarPassword) {

    mensaje.textContent =
      'Las contraseñas no coinciden';

    mensaje.style.color =
      'red';

    return;
  }

  const confirmar = confirm(
    '¿Estás seguro de cambiar la contraseña de administrador?'
  );

  if (!confirmar) {
    return;
  }

  try {

    const res = await fetch(
      API_CAMBIAR_ADMIN_PASSWORD,
      {
        method: 'PUT',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          user_id: usuario.id,
          nueva_admin_password: nuevaPassword,
        }),
      }
    );

    const data = await res.json();

    mensaje.textContent =
      data.msg;

    mensaje.style.color =
      res.ok ? 'green' : 'red';

    if (res.ok) {

      document.getElementById(
        'nuevaAdminPassword'
      ).value = '';

      document.getElementById(
        'confirmarAdminPassword'
      ).value = '';
    }

  } catch (error) {

    console.error(error);

    mensaje.textContent =
      'Error conectando con el servidor';

    mensaje.style.color =
      'red';
  }
}