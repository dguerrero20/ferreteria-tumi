const express = require('express');
const router = express.Router();

const {
  listarProveedores,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
} = require('../controllers/proveedores.controller');

router.get('/', listarProveedores);

router.post('/', crearProveedor);

router.put('/:id', actualizarProveedor);

router.delete('/:id', eliminarProveedor);

module.exports = router;