const express = require('express');
const router = express.Router();

const {
  registrarVenta,
  listarVentas,
  detalleVenta,
  enviarComprobanteEmail,
} = require('../controllers/ventas.controller');

router.get('/', listarVentas);
router.get('/:id', detalleVenta);
router.post('/', registrarVenta);
router.post('/:id/email', enviarComprobanteEmail);

module.exports = router;