const API_RESTABLECER =
  'https://ferreteria-tumi.onrender.com/api/auth/restablecer-password';

function validarPasswordSegura(password) {

  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[*#&%]).{8,}$/;

  return regex.test(password);
}

function togglePassword() {

  const password =
    document.getElementById('password');

  const confirmPassword =
    document.getElementById('confirmPassword');

  const nuevoTipo =
    password.type === 'password'
      ? 'text'
      : 'password';

  password.type = nuevoTipo;
  confirmPassword.type = nuevoTipo;
}

async function restablecerPassword() {

  const password =
    document.getElementById('password').value.trim();

  const confirmPassword =
    document.getElementById('confirmPassword').value.trim();

  const mensaje =
    document.getElementById('mensaje');

  const params =
    new URLSearchParams(window.location.search);

  const token =
    params.get('token');

  if (!token) {

    mensaje.textContent =
      'Token no válido';

    mensaje.style.color =
      'red';

    return;
  }

  if (!password || !confirmPassword) {

    mensaje.textContent =
      'Completa ambos campos';

    mensaje.style.color =
      'red';

    return;
  }

  if (!validarPasswordSegura(password)) {

    mensaje.textContent =
      'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (*#&%).';

    mensaje.style.color =
      'red';

    return;
  }

  if (password !== confirmPassword) {

    mensaje.textContent =
      'Las contraseñas no coinciden';

    mensaje.style.color =
      'red';

    return;
  }

  try {

    const res = await fetch(API_RESTABLECER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        password,
      }),
    });

    const data = await res.json();

    mensaje.textContent =
      data.msg;

    mensaje.style.color =
      res.ok ? 'green' : 'red';

    if (res.ok) {

      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1500);
    }

  } catch (error) {

    console.error(error);

    mensaje.textContent =
      'Error conectando con el servidor';

    mensaje.style.color =
      'red';
  }
}