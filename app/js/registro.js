const API_REGISTRO =
  'https://ferreteria-tumi.onrender.com/api/auth/registro';

function togglePassword(id) {
  const input = document.getElementById(id);

  input.type =
    input.type === 'password'
      ? 'text'
      : 'password';
}

function validarPasswordSegura(password) {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[*#&%]).{8,}$/;

  return regex.test(password);
}

function validarEmail(email) {
  const regex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return regex.test(email);
}

async function registrarCuenta() {

  const empresa =
    document.getElementById('empresa').value.trim();

  const nombre =
    document.getElementById('nombre').value.trim();

  const email =
    document.getElementById('email').value.trim();

  const password =
    document.getElementById('password').value.trim();

  const admin_password =
    document.getElementById('admin_password').value.trim();

  const mensaje =
    document.getElementById('mensaje');

  if (
    !empresa ||
    !nombre ||
    !email ||
    !password ||
    !admin_password
  ) {

    mensaje.textContent =
      'Completa todos los campos';

    mensaje.style.color =
      'red';

    return;
  }

  if (!validarEmail(email)) {

    mensaje.textContent =
      'Ingresa un correo válido';

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

  if (!validarPasswordSegura(admin_password)) {

    mensaje.textContent =
      'La contraseña admin debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (*#&%).';

    mensaje.style.color =
      'red';

    return;
  }

  try {

    const res = await fetch(API_REGISTRO, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        empresa,
        nombre,
        email,
        password,
        admin_password,
      }),
    });

    const data = await res.json();

    mensaje.textContent =
      data.msg;

    mensaje.style.color =
      res.ok ? 'green' : 'red';

    if (res.ok) {

      setTimeout(() => {
        window.location.href = '/index.html';
      }, 1200);
    }

  } catch (error) {

    console.error(error);

    mensaje.textContent =
      'Error conectando con el servidor';

    mensaje.style.color =
      'red';
  }
}