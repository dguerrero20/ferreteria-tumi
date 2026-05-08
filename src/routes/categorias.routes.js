const express = require('express');
const router = express.Router();

const {
  listarCategorias,
  listarTiposPorCategoria,
  listarVariantesPorTipo,
  crearCategoria,
  crearTipo,
  crearVariante,
  eliminarCategoria,
} = require('../controllers/categorias.controller');

router.get('/', listarCategorias);
router.get('/:categoria_id/tipos', listarTiposPorCategoria);
router.get('/tipos/:tipo_id/variantes', listarVariantesPorTipo);

router.post('/', crearCategoria);
router.post('/tipos', crearTipo);
router.post('/variantes', crearVariante);

router.delete('/:id', eliminarCategoria);

module.exports = router;