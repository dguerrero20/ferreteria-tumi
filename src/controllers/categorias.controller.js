const pool = require('../db/primary');

function obtenerEmpresaId(req) {
  return req.query.empresa_id || req.body.empresa_id;
}

const listarCategorias = async (req, res) => {
  const empresa_id = obtenerEmpresaId(req);

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  try {
    const result = await pool.query(
      `
      SELECT id, nombre
      FROM public.categorias
      WHERE empresa_id = $1
      ORDER BY nombre
      `,
      [empresa_id]
    );

    res.json({
      total: result.rows.length,
      categorias: result.rows,
    });
  } catch (error) {
    console.error('ERROR LISTANDO CATEGORÍAS:', error);
    res.status(500).json({
      msg: 'Error al listar categorías',
      error: error.message,
    });
  }
};

const listarTiposPorCategoria = async (req, res) => {
  const { categoria_id } = req.params;
  const empresa_id = obtenerEmpresaId(req);

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  try {
    const result = await pool.query(
      `
      SELECT t.id, t.nombre, t.categoria_id
      FROM public.tipos_producto t
      JOIN public.categorias c ON c.id = t.categoria_id
      WHERE t.categoria_id = $1
      AND c.empresa_id = $2
      ORDER BY t.nombre
      `,
      [categoria_id, empresa_id]
    );

    res.json({
      total: result.rows.length,
      tipos: result.rows,
    });
  } catch (error) {
    console.error('ERROR LISTANDO TIPOS:', error);
    res.status(500).json({
      msg: 'Error al listar tipos',
      error: error.message,
    });
  }
};

const listarVariantesPorTipo = async (req, res) => {
  const { tipo_id } = req.params;
  const empresa_id = obtenerEmpresaId(req);

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  try {
    const result = await pool.query(
      `
      SELECT v.id, v.nombre, v.tipo_id
      FROM public.variantes_producto v
      JOIN public.tipos_producto t ON t.id = v.tipo_id
      JOIN public.categorias c ON c.id = t.categoria_id
      WHERE v.tipo_id = $1
      AND c.empresa_id = $2
      ORDER BY v.nombre
      `,
      [tipo_id, empresa_id]
    );

    res.json({
      total: result.rows.length,
      variantes: result.rows,
    });
  } catch (error) {
    console.error('ERROR LISTANDO VARIANTES:', error);
    res.status(500).json({
      msg: 'Error al listar variantes',
      error: error.message,
    });
  }
};

const crearCategoria = async (req, res) => {
  const { nombre, empresa_id } = req.body;

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  if (!nombre) {
    return res.status(400).json({
      msg: 'El nombre de la categoría es obligatorio',
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO public.categorias (empresa_id, nombre)
      VALUES ($1, $2)
      RETURNING *
      `,
      [empresa_id, nombre]
    );

    res.status(201).json({
      msg: 'Categoría creada correctamente',
      categoria: result.rows[0],
    });
  } catch (error) {
    console.error('ERROR CREANDO CATEGORÍA:', error);
    res.status(500).json({
      msg: 'Error al crear categoría',
      error: error.message,
    });
  }
};

const crearTipo = async (req, res) => {
  const { categoria_id, nombre, empresa_id } = req.body;

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  if (!categoria_id || !nombre) {
    return res.status(400).json({
      msg: 'Categoría y nombre del tipo son obligatorios',
    });
  }

  try {
    const categoria = await pool.query(
      `
      SELECT id
      FROM public.categorias
      WHERE id = $1 AND empresa_id = $2
      `,
      [categoria_id, empresa_id]
    );

    if (categoria.rows.length === 0) {
      return res.status(404).json({
        msg: 'Categoría no encontrada para esta empresa',
      });
    }

    const result = await pool.query(
      `
      INSERT INTO public.tipos_producto (categoria_id, nombre)
      VALUES ($1, $2)
      RETURNING *
      `,
      [categoria_id, nombre]
    );

    res.status(201).json({
      msg: 'Tipo creado correctamente',
      tipo: result.rows[0],
    });
  } catch (error) {
    console.error('ERROR CREANDO TIPO:', error);
    res.status(500).json({
      msg: 'Error al crear tipo',
      error: error.message,
    });
  }
};

const crearVariante = async (req, res) => {
  const { tipo_id, nombre, empresa_id } = req.body;

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  if (!tipo_id || !nombre) {
    return res.status(400).json({
      msg: 'Tipo y nombre de variante son obligatorios',
    });
  }

  try {
    const tipo = await pool.query(
      `
      SELECT t.id
      FROM public.tipos_producto t
      JOIN public.categorias c ON c.id = t.categoria_id
      WHERE t.id = $1 AND c.empresa_id = $2
      `,
      [tipo_id, empresa_id]
    );

    if (tipo.rows.length === 0) {
      return res.status(404).json({
        msg: 'Tipo no encontrado para esta empresa',
      });
    }

    const result = await pool.query(
      `
      INSERT INTO public.variantes_producto (tipo_id, nombre)
      VALUES ($1, $2)
      RETURNING *
      `,
      [tipo_id, nombre]
    );

    res.status(201).json({
      msg: 'Variante creada correctamente',
      variante: result.rows[0],
    });
  } catch (error) {
    console.error('ERROR CREANDO VARIANTE:', error);
    res.status(500).json({
      msg: 'Error al crear variante',
      error: error.message,
    });
  }
};

const eliminarCategoria = async (req, res) => {
  const { id } = req.params;
  const empresa_id = obtenerEmpresaId(req);

  if (!empresa_id) {
    return res.status(400).json({ msg: 'Falta empresa_id' });
  }

  try {
    const productos = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM public.productos
      WHERE categoria_id = $1
      AND empresa_id = $2
      `,
      [id, empresa_id]
    );

    if (Number(productos.rows[0].total) > 0) {
      return res.status(400).json({
        msg: 'No puedes eliminar esta categoría porque tiene productos registrados',
      });
    }

    await pool.query(
      `
      DELETE FROM public.proveedor_categorias
      WHERE categoria_id = $1
      `,
      [id]
    );

    const result = await pool.query(
      `
      DELETE FROM public.categorias
      WHERE id = $1 AND empresa_id = $2
      RETURNING *
      `,
      [id, empresa_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        msg: 'Categoría no encontrada',
      });
    }

    res.json({
      msg: 'Categoría eliminada correctamente',
      categoria: result.rows[0],
    });
  } catch (error) {
    console.error('ERROR ELIMINANDO CATEGORÍA:', error);
    res.status(500).json({
      msg: 'Error al eliminar categoría',
      error: error.message,
    });
  }
};

module.exports = {
  listarCategorias,
  listarTiposPorCategoria,
  listarVariantesPorTipo,
  crearCategoria,
  crearTipo,
  crearVariante,
  eliminarCategoria,
};