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

/* ========================= */
/* TEMA GLOBAL */
/* ========================= */

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

function toggleTema() {
  document.body.classList.toggle('dark-mode');

  const oscuro = document.body.classList.contains('dark-mode');

  localStorage.setItem(
    'tema',
    oscuro ? 'oscuro' : 'claro'
  );

  actualizarBotonTema();
}

function actualizarBotonTema() {
  const toggle = document.getElementById('themeToggle');

  if (!toggle) return;

  const oscuro = document.body.classList.contains('dark-mode');

  toggle.classList.toggle('active', oscuro);

  toggle.querySelector('.theme-icon').textContent =
    oscuro ? '🌙' : '☀️';

  toggle.querySelector('.theme-text').textContent =
    oscuro ? 'Modo oscuro' : 'Modo claro';
}

document.addEventListener('DOMContentLoaded', () => {
  aplicarTemaGuardado();

  const toggle = document.getElementById('themeToggle');

  if (toggle) {
    actualizarBotonTema();

    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleTema();
    });
  }
});
