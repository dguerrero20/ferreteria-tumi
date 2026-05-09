const express = require('express');
const router = express.Router();

const {
  listarProductos,
  productosStockBajo,
  crearProducto,
  actualizarPrecio,
  actualizarStock,
  eliminarProducto,
} = require('../controllers/productos.controller');

router.get('/', listarProductos);
router.get('/stock-bajo', productosStockBajo);

router.post('/', crearProducto);

router.put('/:id/precio', actualizarPrecio);
router.put('/:id/stock', actualizarStock);

router.delete('/:id', eliminarProducto);

module.exports = router;