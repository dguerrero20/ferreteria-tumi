const API_LOGIN = 'https://ferreteria-tumi.onrender.com/api/auth/login';

async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const mensaje = document.getElementById('mensaje');

  if (!email || !password) {
    mensaje.textContent = 'Completa email y contraseña';
    mensaje.style.color = 'red';
    return;
  }

  try {

    const res = await fetch(API_LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      mensaje.textContent = data.msg || 'Credenciales incorrectas';
      mensaje.style.color = 'red';
      return;
    }

    const usuario = {
      ...data.user,
      modo_admin: false,
    };

    localStorage.setItem(
      'usuario',
      JSON.stringify(usuario)
    );

    window.location.href =
      '/pages/dashboard.html';

  } catch (error) {

    console.error(error);

    mensaje.textContent =
      'Error conectando con el servidor';

    mensaje.style.color = 'red';
  }
}