const API_RECUPERAR = 'https://ferreteria-tumi.onrender.com/api/auth/recuperar-password';

let contador = 60;
let intervalo = null;

async function recuperarPassword() {
  const email = document.getElementById('email').value.trim();
  const mensaje = document.getElementById('mensaje');

  if (!email) {
    mensaje.textContent = 'Ingresa tu correo';
    mensaje.style.color = 'red';
    return;
  }

  bloquearBoton();

  try {
    const res = await fetch(API_RECUPERAR, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    console.log('RESPUESTA RECUPERAR:', data);

    if (!res.ok) {
      mensaje.textContent = `${data.msg || 'Error'} ${data.code ? '(' + data.code + ')' : ''}`;
      mensaje.style.color = 'red';
      return;
    }

    mensaje.textContent = data.msg;
    mensaje.style.color = 'green';

  } catch (error) {
    console.error('ERROR FRONTEND RECUPERAR:', error);

    mensaje.textContent = 'Error conectando con el servidor';
    mensaje.style.color = 'red';
  }
}

function bloquearBoton() {
  const boton = document.getElementById('btnRecuperar');

  contador = 60;
  boton.disabled = true;
  boton.textContent = `Reenviar en ${contador}s`;

  intervalo = setInterval(() => {
    contador--;

    boton.textContent = `Reenviar en ${contador}s`;

    if (contador <= 0) {
      clearInterval(intervalo);
      boton.disabled = false;
      boton.textContent = 'Enviar correo';
    }
  }, 1000);
}