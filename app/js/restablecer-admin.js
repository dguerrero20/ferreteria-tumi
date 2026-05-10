const API_RESTABLECER_ADMIN =
  'https://ferreteria-tumi.onrender.com/api/auth/restablecer-admin-password';

function validarPasswordSegura(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[*#&%]).{8,}$/;
  return regex.test(password);
}

function toggleAdminPassword() {
  const password = document.getElementById('adminPassword');
  const confirmPassword = document.getElementById('confirmAdminPassword');

  const nuevoTipo = password.type === 'password' ? 'text' : 'password';

  password.type = nuevoTipo;
  confirmPassword.type = nuevoTipo;
}

async function restablecerAdminPassword() {
  const adminPassword = document.getElementById('adminPassword').value.trim();
  const confirmAdminPassword = document.getElementById('confirmAdminPassword').value.trim();
  const mensaje = document.getElementById('mensaje');

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (!token) {
    mensaje.textContent = 'Token no válido';
    mensaje.style.color = 'red';
    return;
  }

  if (!adminPassword || !confirmAdminPassword) {
    mensaje.textContent = 'Completa ambos campos';
    mensaje.style.color = 'red';
    return;
  }

  if (!validarPasswordSegura(adminPassword)) {
    mensaje.textContent =
      'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (*#&%).';
    mensaje.style.color = 'red';
    return;
  }

  if (adminPassword !== confirmAdminPassword) {
    mensaje.textContent = 'Las contraseñas no coinciden';
    mensaje.style.color = 'red';
    return;
  }

  try {
    const res = await fetch(API_RESTABLECER_ADMIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        admin_password: adminPassword,
      }),
    });

    const data = await res.json();

    mensaje.textContent = data.msg;
    mensaje.style.color = res.ok ? 'green' : 'red';

    if (res.ok) {
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1500);
    }
  } catch (error) {
    console.error(error);
    mensaje.textContent = 'Error conectando con el servidor';
    mensaje.style.color = 'red';
  }
}