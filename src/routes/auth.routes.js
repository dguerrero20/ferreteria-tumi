const express = require('express');

const router = express.Router();

const {
  login,
  registrarCuenta,
  recuperarPassword,
  restablecerPassword,
  verificarAdmin,
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

module.exports = router;