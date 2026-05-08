const express = require('express');
const router = express.Router();

const {
  reporteVentasPorFechas,
  productosMasVendidos,
  productosMenosVendidos,
  vendedoresTop,
} = require('../controllers/reportes.controller');

router.get('/ventas', reporteVentasPorFechas);
router.get('/productos-mas-vendidos', productosMasVendidos);
router.get('/productos-menos-vendidos', productosMenosVendidos);
router.get('/vendedores-top', vendedoresTop);

module.exports = router;