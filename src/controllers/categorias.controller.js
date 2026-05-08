const pool = require('../db/primary');

const listarCategorias = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre
       FROM categorias
       WHERE empresa_id = $1
       ORDER BY nombre`,
      [1]
    );

    res.json({
      total: result.rows.length,
      categorias: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al listar categorías' });
  }
};

const listarTiposPorCategoria = async (req, res) => {
  const { categoria_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, nombre, categoria_id
       FROM tipos_producto
       WHERE categoria_id = $1
       ORDER BY nombre`,
      [categoria_id]
    );

    res.json({
      total: result.rows.length,
      tipos: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al listar tipos' });
  }
};

const listarVariantesPorTipo = async (req, res) => {
  const { tipo_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, nombre, tipo_id
       FROM variantes_producto
       WHERE tipo_id = $1
       ORDER BY nombre`,
      [tipo_id]
    );

    res.json({
      total: result.rows.length,
      variantes: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al listar variantes' });
  }
};

const crearCategoria = async (req, res) => {
  const { nombre } = req.body;

  try {
    if (!nombre) {
      return res.status(400).json({ msg: 'El nombre de la categoría es obligatorio' });
    }

    const result = await pool.query(
      `INSERT INTO categorias (empresa_id, nombre)
       VALUES ($1, $2)
       RETURNING *`,
      [1, nombre]
    );

    res.status(201).json({
      msg: 'Categoría creada correctamente',
      categoria: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al crear categoría' });
  }
};

const crearTipo = async (req, res) => {
  const { categoria_id, nombre } = req.body;

  try {
    if (!categoria_id || !nombre) {
      return res.status(400).json({ msg: 'Categoría y nombre son obligatorios' });
    }

    const result = await pool.query(
      `INSERT INTO tipos_producto (categoria_id, nombre)
       VALUES ($1, $2)
       RETURNING *`,
      [categoria_id, nombre]
    );

    res.status(201).json({
      msg: 'Tipo creado correctamente',
      tipo: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al crear tipo' });
  }
};

const crearVariante = async (req, res) => {
  const { tipo_id, nombre } = req.body;

  try {
    if (!tipo_id || !nombre) {
      return res.status(400).json({ msg: 'Tipo y nombre son obligatorios' });
    }

    const result = await pool.query(
      `INSERT INTO variantes_producto (tipo_id, nombre)
       VALUES ($1, $2)
       RETURNING *`,
      [tipo_id, nombre]
    );

    res.status(201).json({
      msg: 'Variante creada correctamente',
      variante: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al crear variante' });
  }
};

module.exports = {
  listarCategorias,
  listarTiposPorCategoria,
  listarVariantesPorTipo,
  crearCategoria,
  crearTipo,
  crearVariante,
};