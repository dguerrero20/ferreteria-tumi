const express = require('express');
const router = express.Router();

const pool = require('../db/primary');

router.get('/vendedores', async (req, res) => {
  const { empresa_id } = req.query;

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  try {
    const result = await pool.query(
      `
      SELECT id, nombre, email, rol
      FROM usuarios
      WHERE rol = 'vendedor'
      AND empresa_id = $1
      ORDER BY nombre ASC
      `,
      [empresa_id]
    );

    res.json({ vendedores: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error obteniendo vendedores' });
  }
});

router.post('/vendedores', async (req, res) => {
  const { empresa_id, nombre, email, password } = req.body;

  if (!empresa_id || !nombre || !email || !password) {
    return res.status(400).json({ msg: 'Todos los campos son obligatorios' });
  }

  try {
    const existe = await pool.query(
      `SELECT id FROM usuarios WHERE email = $1`,
      [email]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({ msg: 'Ese correo ya está registrado' });
    }

    const result = await pool.query(
      `
      INSERT INTO usuarios
      (empresa_id, nombre, email, password, rol, admin_password)
      VALUES ($1, $2, $3, $4, 'vendedor', $5)
      RETURNING id, nombre, email, rol
      `,
      [empresa_id, nombre, email, password, password]
    );

    res.status(201).json({
      msg: 'Vendedor creado correctamente',
      vendedor: result.rows[0],
    });
  } catch (error) {
    console.error('ERROR CREANDO VENDEDOR:', error);
    res.status(500).json({ msg: 'Error creando vendedor' });
  }
});

router.delete('/vendedores/:id', async (req, res) => {
  const { id } = req.params;
  const { empresa_id } = req.query;

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  try {
    const ventas = await pool.query(
      `
      SELECT id
      FROM ventas
      WHERE usuario_id = $1
      AND empresa_id = $2
      LIMIT 1
      `,
      [id, empresa_id]
    );

    if (ventas.rows.length > 0) {
      return res.status(400).json({
        msg: 'No puedes eliminar un vendedor con ventas registradas',
      });
    }

    await pool.query(
      `
      DELETE FROM usuarios
      WHERE id = $1
      AND empresa_id = $2
      AND rol = 'vendedor'
      `,
      [id, empresa_id]
    );

    res.json({ msg: 'Vendedor eliminado correctamente' });
  } catch (error) {
    console.error('ERROR ELIMINANDO VENDEDOR:', error);
    res.status(500).json({ msg: 'Error eliminando vendedor' });
  }
});

module.exports = router;