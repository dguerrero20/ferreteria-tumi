const express = require('express');
const router = express.Router();

const pool = require('../db/primary');

// OBTENER VENDEDORES
router.get('/vendedores', async (req, res) => {

  const { empresa_id } = req.query;

  if (!empresa_id) {
    return res.status(400).json({
      msg: 'Falta empresa_id'
    });
  }

  try {

    const result = await pool.query(
      `
      SELECT
        id,
        nombre,
        email,
        rol
      FROM usuarios
      WHERE rol = 'vendedor'
      AND empresa_id = $1
      ORDER BY nombre ASC
      `,
      [empresa_id]
    );

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