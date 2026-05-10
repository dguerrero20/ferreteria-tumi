const express = require('express');

const router = express.Router();

const {
  login,
  registrarCuenta,
  recuperarPassword,
  restablecerPassword,
  verificarAdmin,
  recuperarAdminPassword,
  restablecerAdminPassword,
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

router.post(
  '/recuperar-admin-password',
  recuperarAdminPassword
);

router.post(
  '/restablecer-admin-password',
  restablecerAdminPassword
);

module.exports = router;