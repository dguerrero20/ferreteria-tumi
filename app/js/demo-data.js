const DEMO_ORIGINAL = {
  usuario: {
    id: 999,
    nombre: 'Usuario Demo',
    email: 'demo@ferdev.com',
    rol: 'Administrador demo',
    modo_admin: true,
    empresa_id: 999,
  },

  categorias: [
    {
      id: 1,
      nombre: 'Herramientas',
      tipos: [
        {
          id: 1,
          nombre: 'Eléctricas',
          variantes: [
            { id: 1, nombre: 'Taladro' },
            { id: 2, nombre: 'Amoladora' },
          ],
        },
        {
          id: 2,
          nombre: 'Manuales',
          variantes: [
            { id: 3, nombre: 'Martillo' },
            { id: 4, nombre: 'Alicate' },
          ],
        },
      ],
    },
    {
      id: 2,
      nombre: 'Pinturas',
      tipos: [
        {
          id: 3,
          nombre: 'Látex',
          variantes: [
            { id: 5, nombre: 'Interior' },
            { id: 6, nombre: 'Exterior' },
          ],
        },
      ],
    },
    {
      id: 3,
      nombre: 'Ferretería General',
      tipos: [
        {
          id: 4,
          nombre: 'Tornillería',
          variantes: [
            { id: 7, nombre: 'Tornillo' },
            { id: 8, nombre: 'Clavo' },
          ],
        },
      ],
    },
  ],

  productos: [
    {
      id: 1,
      producto: 'Taladro inalámbrico Bosch',
      categoria: 'Herramientas',
      tipo: 'Eléctricas',
      variante: 'Taladro',
      marca: 'Bosch',
      precio: 280,
      stock: 12,
      stock_min: 5,
      unidad_medida: 'unidad',
    },
    {
      id: 2,
      producto: 'Disco de corte 4 1/2"',
      categoria: 'Herramientas',
      tipo: 'Eléctricas',
      variante: 'Amoladora',
      marca: 'Truper',
      precio: 8.5,
      stock: 4,
      stock_min: 10,
      unidad_medida: 'unidad',
    },
    {
      id: 3,
      producto: 'Pintura látex blanca 1L',
      categoria: 'Pinturas',
      tipo: 'Látex',
      variante: 'Interior',
      marca: 'CPP',
      precio: 42,
      stock: 18,
      stock_min: 6,
      unidad_medida: 'litro',
    },
    {
      id: 4,
      producto: 'Martillo profesional',
      categoria: 'Herramientas',
      tipo: 'Manuales',
      variante: 'Martillo',
      marca: 'Stanley',
      precio: 55,
      stock: 9,
      stock_min: 4,
      unidad_medida: 'unidad',
    },
    {
      id: 5,
      producto: 'Tornillo 2 pulgadas',
      categoria: 'Ferretería General',
      tipo: 'Tornillería',
      variante: 'Tornillo',
      marca: 'Genérico',
      precio: 0.25,
      stock: 150,
      stock_min: 50,
      unidad_medida: 'unidad',
    },
  ],

  proveedores: [
    {
      id: 1,
      empresa: 'Distribuidora El Constructor',
      nombre: 'Carlos Ramírez',
      telefono: '999888777',
      email: 'ventas@constructor-demo.com',
      direccion: 'Av. Industrial 120, Lima',
    },
    {
      id: 2,
      empresa: 'Pinturas del Sur',
      nombre: 'María Torres',
      telefono: '988776655',
      email: 'contacto@pinturasdemo.com',
      direccion: 'Jr. Comercio 450, Lima',
    },
  ],

  vendedores: [
    {
      id: 1,
      nombre: 'Vendedor Demo',
      email: 'vendedor@demo.com',
    },
    {
      id: 2,
      nombre: 'Administrador Demo',
      email: 'admin@demo.com',
    },
  ],

  ventas: [
    {
      id: 1,
      usuario_id: 1,
      usuario: 'Vendedor Demo',
      total: 288.5,
      created_at: new Date().toISOString(),
      productos: [
        { producto_id: 1, cantidad: 1 },
        { producto_id: 2, cantidad: 1 },
      ],
    },
    {
      id: 2,
      usuario_id: 2,
      usuario: 'Administrador Demo',
      total: 97,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      productos: [
        { producto_id: 3, cantidad: 1 },
        { producto_id: 4, cantidad: 1 },
      ],
    },
  ],
};

function obtenerDemoData() {
  const data = sessionStorage.getItem('ferdev_demo_data');

  if (data) {
    return JSON.parse(data);
  }

  const copia = structuredClone(DEMO_ORIGINAL);

  sessionStorage.setItem(
    'ferdev_demo_data',
    JSON.stringify(copia)
  );

  return copia;
}

function guardarDemoData(data) {
  sessionStorage.setItem(
    'ferdev_demo_data',
    JSON.stringify(data)
  );
}

function resetDemoData() {
  sessionStorage.removeItem('ferdev_demo_data');
}