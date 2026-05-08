const express = require('express');
const router = express.Router();

const pool = require('../db/primary');

// OBTENER VENDEDORES
router.get('/vendedores', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        nombre,
        email,
        rol
      FROM usuarios
      WHERE rol = 'vendedor'
      ORDER BY nombre ASC
    `);

    res.json({
      vendedores: result.rows
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      msg: 'Error obteniendo vendedores'
    });
  }
});

module.exports = router;