const API_ADMIN =
  'https://ferreteria-tumi.onrender.com/api/auth/verificar-admin';

const API_RECUPERAR_ADMIN =
  'https://ferreteria-tumi.onrender.com/api/auth/recuperar-admin-password';

const usuario =
  JSON.parse(localStorage.getItem('usuario'));

document.getElementById('nombre')
  .textContent = usuario.nombre;

document.getElementById('email')
  .textContent = usuario.email;

document.getElementById('rol')
  .textContent = usuario.rol;

actualizarModoAdmin();

function ocultarEmail(email) {
  const partes = email.split('@');
  const nombre = partes[0];
  const dominio = partes[1];

  if (nombre.length <= 4) {
    return email;
  }

  return `${nombre.substring(0, 2)}********${nombre.substring(nombre.length - 2)}@${dominio}`;
}

function actualizarModoAdmin() {
  const usuarioActual =
    JSON.parse(localStorage.getItem('usuario'));

  const modoTexto =
    document.getElementById('modoAdmin');

  const boton =
    document.getElementById('btnAdmin');

  if (usuarioActual.modo_admin) {
    modoTexto.innerHTML = '<span class="badge success">Activo</span>';

    boton.textContent =
      'Salir del modo administrador';

    boton.classList.add('danger');
  } else {
    modoTexto.innerHTML = '<span class="badge warning">Inactivo</span>';

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

async function recuperarAdminPassword() {
  const mensaje =
    document.getElementById('mensajeAdminRecovery');

  const confirmar =
    confirm(
      `¿Enviar correo de recuperación a ${ocultarEmail(usuario.email)} ?`
    );

  if (!confirmar) {
    return;
  }

  try {
    const res = await fetch(
      API_RECUPERAR_ADMIN,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          user_id: usuario.id,
        }),
      }
    );

    const data = await res.json();

    mensaje.textContent =
      data.msg;

    mensaje.style.color =
      res.ok ? 'green' : 'red';

  } catch (error) {
    console.error(error);

    mensaje.textContent =
      'Error enviando correo';

    mensaje.style.color =
      'red';
  }
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    activarModoAdmin();
  }
});