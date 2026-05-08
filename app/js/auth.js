function obtenerUsuario() {
  return JSON.parse(
    localStorage.getItem('usuario')
  );
}

function verificarSesion() {

  const usuario = obtenerUsuario();

  if (!usuario) {

    window.location.href =
      '/login.html';

    return;
  }

  // OCULTAR OPCIONES SOLO ADMIN
  document
    .querySelectorAll('.solo-admin')
    .forEach((elemento) => {

      if (usuario.modo_admin !== true) {
        elemento.remove();
      }

    });
}

function cerrarSesion() {

  const confirmar = confirm(
    '¿Estás seguro de cerrar sesión?'
  );

  if (!confirmar) {
    return;
  }

  localStorage.removeItem('usuario');

  window.location.href =
    '/index.html';
}

function esAdmin() {

  const usuario = obtenerUsuario();

  return usuario?.modo_admin === true;
}