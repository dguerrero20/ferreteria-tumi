const pool = require('../db/primary');

const listarProveedores = async (req, res) => {
  const { buscar, categoria_id, tipo_id } = req.query;

  try {
    let query = `
      SELECT DISTINCT
        p.id,
        p.empresa_id,
        p.nombre,
        p.empresa,
        p.telefono,
        p.email,
        p.direccion,
        p.created_at
      FROM public.proveedores p
      LEFT JOIN public.proveedor_categorias pc ON pc.proveedor_id = p.id
      LEFT JOIN public.proveedor_tipos pt ON pt.proveedor_id = p.id
      WHERE p.empresa_id = $1
    `;

    const values = [1];

    if (buscar) {
      values.push(`%${buscar}%`);
      query += `
        AND (
          p.nombre ILIKE $${values.length}
          OR p.empresa ILIKE $${values.length}
          OR p.telefono ILIKE $${values.length}
          OR p.email ILIKE $${values.length}
          OR p.direccion ILIKE $${values.length}
        )
      `;
    }

    if (categoria_id) {
      values.push(categoria_id);
      query += ` AND pc.categoria_id = $${values.length}`;
    }

    if (tipo_id) {
      values.push(tipo_id);
      query += ` AND pt.tipo_id = $${values.length}`;
    }

    query += ` ORDER BY p.empresa ASC`;

    const result = await pool.query(query, values);

    res.json({
      total: result.rows.length,
      proveedores: result.rows,
    });
  } catch (error) {
    console.error('ERROR LISTANDO PROVEEDORES:', error);
    res.status(500).json({
      msg: 'Error al listar proveedores',
      error: error.message,
    });
  }
};

const crearProveedor = async (req, res) => {
  const { nombre, empresa, telefono, email, direccion } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO public.proveedores
      (empresa_id, nombre, empresa, telefono, email, direccion)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [1, nombre, empresa, telefono, email, direccion]
    );

    res.status(201).json({
      msg: 'Proveedor creado correctamente',
      proveedor: result.rows[0],
    });
  } catch (error) {
    console.error('ERROR CREANDO PROVEEDOR:', error);
    res.status(500).json({
      msg: 'Error al crear proveedor',
      error: error.message,
    });
  }
};

const actualizarProveedor = async (req, res) => {
  const { id } = req.params;
  const { nombre, empresa, telefono, email, direccion } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE public.proveedores
      SET nombre = $1,
          empresa = $2,
          telefono = $3,
          email = $4,
          direccion = $5
      WHERE id = $6 AND empresa_id = $7
      RETURNING *
      `,
      [nombre, empresa, telefono, email, direccion, id, 1]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Proveedor no encontrado' });
    }

    res.json({
      msg: 'Proveedor actualizado correctamente',
      proveedor: result.rows[0],
    });
  } catch (error) {
    console.error('ERROR ACTUALIZANDO PROVEEDOR:', error);
    res.status(500).json({
      msg: 'Error al actualizar proveedor',
      error: error.message,
    });
  }
};

const eliminarProveedor = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM public.proveedores
      WHERE id = $1 AND empresa_id = $2
      RETURNING *
      `,
      [id, 1]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Proveedor no encontrado' });
    }

    res.json({
      msg: 'Proveedor eliminado correctamente',
      proveedor: result.rows[0],
    });
  } catch (error) {
    console.error('ERROR ELIMINANDO PROVEEDOR:', error);
    res.status(500).json({
      msg: 'Error al eliminar proveedor',
      error: error.message,
    });
  }
};

module.exports = {
  listarProveedores,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
};