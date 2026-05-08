const API_RESTABLECER = 'https://ferreteria-tumi.onrender.com/api/auth/restablecer-password';

function togglePassword() {
  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirmPassword');

  const nuevoTipo = password.type === 'password' ? 'text' : 'password';

  password.type = nuevoTipo;
  confirmPassword.type = nuevoTipo;
}

async function restablecerPassword() {
  const password = document.getElementById('password').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();
  const mensaje = document.getElementById('mensaje');

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (!token) {
    mensaje.textContent = 'Token no válido';
    mensaje.style.color = 'red';
    return;
  }

  if (!password || !confirmPassword) {
    mensaje.textContent = 'Completa ambos campos de contraseña';
    mensaje.style.color = 'red';
    return;
  }

  if (password.length < 6) {
    mensaje.textContent = 'La contraseña debe tener al menos 6 caracteres';
    mensaje.style.color = 'red';
    return;
  }

  if (password !== confirmPassword) {
    mensaje.textContent = 'Las contraseñas no coinciden';
    mensaje.style.color = 'red';
    return;
  }

  const res = await fetch(API_RESTABLECER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });

  const data = await res.json();

  mensaje.textContent = data.msg;
  mensaje.style.color = res.ok ? 'green' : 'red';

  if (res.ok) {
    setTimeout(() => {
      window.location.href = '/app/login.html';
    }, 1500);
  }
}