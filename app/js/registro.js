const API_REGISTRO = 'https://ferreteria-tumi.onrender.com/api/auth/registro';

function togglePassword(id) {
  const input = document.getElementById(id);

  input.type =
    input.type === 'password'
      ? 'text'
      : 'password';
}

async function registrarCuenta() {
  const empresa = document.getElementById('empresa').value.trim();
  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const admin_password = document.getElementById('admin_password').value.trim();

  const mensaje = document.getElementById('mensaje');

  if (
    !empresa ||
    !nombre ||
    !email ||
    !password ||
    !admin_password
  ) {
    mensaje.textContent = 'Completa todos los campos';
    mensaje.style.color = 'red';
    return;
  }

  if (password.length < 6) {
    mensaje.textContent = 'La contraseña debe tener al menos 6 caracteres';
    mensaje.style.color = 'red';
    return;
  }

  if (admin_password.length < 6) {
    mensaje.textContent = 'La contraseña admin debe tener al menos 6 caracteres';
    mensaje.style.color = 'red';
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

    mensaje.textContent = data.msg;
    mensaje.style.color = res.ok ? 'green' : 'red';

    if (res.ok) {

      setTimeout(() => {
        window.location.href = '/index.html';
      }, 1500);

    }

  } catch (error) {

    console.error(error);

    mensaje.textContent = 'Error conectando con el servidor';
    mensaje.style.color = 'red';
  }
}