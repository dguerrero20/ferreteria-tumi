async function enviarCorreo({ to, subject, html }) {
  const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: 'Ferreteria',
        email: 'deividguerreropedraza08@gmail.com',
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      htmlContent: html,
    }),
  });

  if (!respuesta.ok) {
    const error = await respuesta.json();
    console.error('ERROR BREVO:', error);
    throw new Error(error.message || 'Error enviando correo');
  }
}

module.exports = {
  enviarCorreo,
};