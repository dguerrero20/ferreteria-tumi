function obtenerUsuario() {
  return JSON.parse(
    localStorage.getItem('usuario')
  );
}

function verificarSesion() {

  const usuario = obtenerUsuario();

  if (!usuario) {

    window.location.href =
      '/app/login.html';

  }
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
    '/public/index.html';
}

function esAdmin() {

  const usuario = obtenerUsuario();

  return usuario?.modo_admin === true;
}