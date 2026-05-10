const crypto = require('crypto');

const pool = require('../db/primary');

function validarPassword(password) {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[*#&%@$!])[A-Za-z\d*#&%@$!]{8,}$/;

  return regex.test(password);
}

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

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        msg: 'Usuario no encontrado',
      });
    }

    const user = result.rows[0];

    if (user.password !== password) {
      return res.status(400).json({
        msg: 'Contraseña incorrecta',
      });
    }

    res.json({
      msg: 'Login exitoso',
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        empresa_id: user.empresa_id,
      },
    });
  } catch (error) {
    console.error('ERROR LOGIN:', error);

    res.status(500).json({
      msg: 'Error en el servidor',
    });
  }
};

const recuperarPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        msg: 'No existe una cuenta con ese correo',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');

    await pool.query(
      `
      UPDATE usuarios
      SET reset_token = $1,
          reset_token_expires = NOW() + INTERVAL '15 minutes'
      WHERE email = $2
      `,
      [token, email]
    );

    const resetLink =
      `${process.env.FRONTEND_URL}/restablecer.html?token=${token}`;

    await enviarCorreo({
      to: email,
      subject: 'Recuperación de contraseña',
      html: `
        <h2>Recuperar contraseña</h2>
        <p>Haz clic en el siguiente enlace para cambiar tu contraseña:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Este enlace vence en 15 minutos.</p>
      `,
    });

    res.json({
      msg: 'Correo de recuperación enviado',
    });

  } catch (error) {

    console.error(
      'ERROR RECUPERAR PASSWORD:',
      error
    );

    res.status(500).json({
      msg: 'Error enviando correo',
      error: error.message,
    });
  }
};

const restablecerPassword = async (req, res) => {
  const { token, password } = req.body;

  try {

    if (!validarPassword(password)) {
      return res.status(400).json({
        msg:
          'La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial',
      });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM usuarios
      WHERE reset_token = $1
      AND reset_token_expires > NOW()
      `,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        msg: 'Token inválido o vencido',
      });
    }

    await pool.query(
      `
      UPDATE usuarios
      SET password = $1,
          reset_token = NULL,
          reset_token_expires = NULL
      WHERE reset_token = $2
      `,
      [password, token]
    );

    res.json({
      msg: 'Contraseña actualizada correctamente',
    });

  } catch (error) {

    console.error(
      'ERROR RESTABLECER PASSWORD:',
      error
    );

    res.status(500).json({
      msg: 'Error restableciendo contraseña',
    });
  }
};

const registrarCuenta = async (req, res) => {

  const {
    empresa,
    nombre,
    email,
    password,
    admin_password,
  } = req.body;

  try {

    if (
      !empresa ||
      !nombre ||
      !email ||
      !password ||
      !admin_password
    ) {
      return res.status(400).json({
        msg: 'Todos los campos son obligatorios',
      });
    }

    if (!validarPassword(password)) {
      return res.status(400).json({
        msg:
          'La contraseña de acceso debe tener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial',
      });
    }

    if (!validarPassword(admin_password)) {
      return res.status(400).json({
        msg:
          'La contraseña admin debe tener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial',
      });
    }

    const existeUsuario = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existeUsuario.rows.length > 0) {
      return res.status(400).json({
        msg: 'Ese correo ya está registrado',
      });
    }

    const empresaResult = await pool.query(
      `
      INSERT INTO empresas (nombre)
      VALUES ($1)
      RETURNING *
      `,
      [empresa]
    );

    const nuevaEmpresa = empresaResult.rows[0];

    const usuarioResult = await pool.query(
      `
      INSERT INTO usuarios
      (
        empresa_id,
        nombre,
        email,
        password,
        rol,
        admin_password
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        nombre,
        email,
        rol,
        empresa_id
      `,
      [
        nuevaEmpresa.id,
        nombre,
        email,
        password,
        'vendedor',
        admin_password,
      ]
    );

    res.status(201).json({
      msg: 'Cuenta creada correctamente',
      usuario: usuarioResult.rows[0],
      empresa: nuevaEmpresa,
    });

  } catch (error) {

    console.error(
      'ERROR REGISTRANDO CUENTA:',
      error
    );

    res.status(500).json({
      msg: 'Error creando cuenta',
    });
  }
};

const verificarAdmin = async (req, res) => {

  const { user_id, admin_password } = req.body;

  try {

    const result = await pool.query(
      `
      SELECT *
      FROM usuarios
      WHERE id = $1
      `,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        msg: 'Usuario no encontrado',
      });
    }

    const usuario = result.rows[0];

    if (
      usuario.admin_password !== admin_password
    ) {
      return res.status(401).json({
        msg: 'Contraseña admin incorrecta',
      });
    }

    res.json({
      msg: 'Modo administrador activado',
    });

  } catch (error) {

    console.error(
      'ERROR VERIFICANDO ADMIN:',
      error
    );

    res.status(500).json({
      msg: 'Error verificando admin',
    });
  }
};

const recuperarAdminPassword = async (req, res) => {
  const { user_id } = req.body;

  try {
    const result = await pool.query(
      `
      SELECT id, email
      FROM usuarios
      WHERE id = $1
      `,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        msg: 'Usuario no encontrado',
      });
    }

    const usuario = result.rows[0];

    const token =
      crypto.randomBytes(32).toString('hex');

    await pool.query(
      `
      UPDATE usuarios
      SET admin_reset_token = $1,
          admin_reset_token_expires = NOW() + INTERVAL '15 minutes'
      WHERE id = $2
      `,
      [token, user_id]
    );

    const resetLink =
      `${process.env.FRONTEND_URL}/restablecer-admin.html?token=${token}`;

    await enviarCorreo({
      to: usuario.email,
      subject: 'Recuperación de contraseña administrador',
      html: `
        <h2>Recuperar contraseña de administrador</h2>
        <p>Haz clic en el siguiente enlace para cambiar tu contraseña de administrador:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Este enlace vence en 15 minutos.</p>
      `,
    });

    res.json({
      msg: 'Correo de recuperación admin enviado',
    });

  } catch (error) {

    console.error(
      'ERROR RECUPERAR ADMIN PASSWORD:',
      error
    );

    res.status(500).json({
      msg: 'Error enviando correo',
      error: error.message,
    });
  }
};

const restablecerAdminPassword = async (req, res) => {
  const { token, admin_password } = req.body;

  try {

    if (!validarPassword(admin_password)) {
      return res.status(400).json({
        msg:
          'La contraseña admin debe tener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial',
      });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM usuarios
      WHERE admin_reset_token = $1
      AND admin_reset_token_expires > NOW()
      `,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        msg: 'Token inválido o vencido',
      });
    }

    await pool.query(
      `
      UPDATE usuarios
      SET admin_password = $1,
          admin_reset_token = NULL,
          admin_reset_token_expires = NULL
      WHERE admin_reset_token = $2
      `,
      [admin_password, token]
    );

    res.json({
      msg: 'Contraseña administrador actualizada correctamente',
    });

  } catch (error) {

    console.error(
      'ERROR RESTABLECER ADMIN PASSWORD:',
      error
    );

    res.status(500).json({
      msg: 'Error restableciendo contraseña admin',
    });
  }
};

module.exports = {
  login,
  registrarCuenta,
  recuperarPassword,
  restablecerPassword,
  verificarAdmin,
  recuperarAdminPassword,
  restablecerAdminPassword,
};