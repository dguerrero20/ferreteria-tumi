const express = require('express');
const router = express.Router();

const {
  registrarVenta,
  listarVentas,
  detalleVenta,
} = require('../controllers/ventas.controller');

router.get('/', listarVentas);
router.get('/:id', detalleVenta);
router.post('/', registrarVenta);

module.exports = router;