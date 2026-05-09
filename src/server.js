require('dotenv').config();

const express = require('express');
const cors = require('cors');

const pool = require('./db/primary');

// RUTAS
const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const ventasRoutes = require('./routes/ventas.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const proveedoresRoutes = require('./routes/proveedores.routes');
const reportesRoutes = require('./routes/reportes.routes');
const usuariosRoutes = require('./routes/usuarios.routes'); // 🔥 NUEVO

const app = express();

// MIDDLEWARE
app.use(cors({
  origin: [
    'https://ferreteria-tumi.vercel.app',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ENDPOINTS
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/usuarios', usuariosRoutes); // 🔥 NUEVO

// TEST DB
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');

    res.send(`DB conectada 🚀 ${result.rows[0].now}`);

  } catch (error) {

    res.status(500).send('Error de conexión a DB');
  }
});

// SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});