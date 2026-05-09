const crypto = require('crypto');
const pool = require('../db/primary');

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

    const resetLink = `${process.env.FRONTEND_URL}/restablecer.html?token=${token}`;

    const respuestaCorreo = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ferretería SaaS <onboarding@resend.dev>',
        to: email,
        subject: 'Recuperación de contraseña',
        html: `
          <h2>Recuperar contraseña</h2>
          <p>Haz clic en el siguiente enlace para cambiar tu contraseña:</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>Este enlace vence en 15 minutos.</p>
        `,
      }),
    });

    if (!respuestaCorreo.ok) {
      const errorCorreo = await respuestaCorreo.json();

      console.error('ERROR RESEND:', errorCorreo);

      return res.status(500).json({
        msg: 'Error enviando correo de recuperación',
        error: errorCorreo.message || 'Error con Resend',
      });
    }

    res.json({
      msg: 'Correo de recuperación enviado',
    });
  } catch (error) {
    console.error('ERROR RECUPERAR PASSWORD:', error);

    res.status(500).json({
      msg: 'Error enviando correo de recuperación',
      error: error.message,
    });
  }
};

const restablecerPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
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
    console.error('ERROR RESTABLECER PASSWORD:', error);

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
    if (!empresa || !nombre || !email || !password || !admin_password) {
      return res.status(400).json({
        msg: 'Todos los campos son obligatorios',
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
      (empresa_id, nombre, email, password, rol, admin_password)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nombre, email, rol, empresa_id
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
    console.error('ERROR REGISTRANDO CUENTA:', error);

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

    if (usuario.admin_password !== admin_password) {
      return res.status(401).json({
        msg: 'Contraseña admin incorrecta',
      });
    }

    res.json({
      msg: 'Modo administrador activado',
    });
  } catch (error) {
    console.error('ERROR VERIFICANDO ADMIN:', error);

    res.status(500).json({
      msg: 'Error verificando admin',
    });
  }
};

module.exports = {
  login,
  registrarCuenta,
  recuperarPassword,
  restablecerPassword,
  verificarAdmin,
};