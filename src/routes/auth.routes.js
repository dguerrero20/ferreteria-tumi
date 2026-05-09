const express = require('express');

const router = express.Router();

const {
  login,
  registrarCuenta,
  recuperarPassword,
  restablecerPassword,
  verificarAdmin,
  cambiarAdminPassword,
} = require('../controllers/auth.controller');

router.post('/login', login);

router.post('/registro', registrarCuenta);

router.post(
  '/recuperar-password',
  recuperarPassword
);

router.post(
  '/restablecer-password',
  restablecerPassword
);

router.post(
  '/verificar-admin',
  verificarAdmin
);

router.put(
  '/cambiar-admin-password',
  cambiarAdminPassword
);

module.exports = router;