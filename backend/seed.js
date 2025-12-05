const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Usuarios
  const adminPassword = await bcrypt.hash('admin123', 10);
  const cobradorPassword = await bcrypt.hash('cobrador123', 10);
  const clientePassword = await bcrypt.hash('cliente123', 10);
  const cliente2Password = await bcrypt.hash('cliente2123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@smartcredit.com',
      password: adminPassword,
      nombre: 'Admin', apellido: 'Sistema', cedula: '12345678',
      fecha_nacimiento: new Date('1990-01-01'), tipo_comercio: 'Administración',
      whatsapp: '+595981000000', role: 'admin', fondo_acumulado: 0
    }
  });

  const cobrador = await prisma.user.create({
    data: {
      email: 'cobrador@smartcredit.com',
      password: cobradorPassword,
      nombre: 'Juan', apellido: 'Cobrador', cedula: '87654321',
      fecha_nacimiento: new Date('1985-05-15'), tipo_comercio: 'Cobranzas',
      whatsapp: '+595981111111', role: 'cobrador', fondo_acumulado: 0
    }
  });

  const cliente1 = await prisma.user.create({
    data: {
      email: 'cliente@test.com',
      password: clientePassword,
      nombre: 'María', apellido: 'González', cedula: '11223344',
      fecha_nacimiento: new Date('1992-03-20'), tipo_comercio: 'Almacén',
      whatsapp: '+595981222222', role: 'deudor', fondo_acumulado: 75000
    }
  });

  const cliente2 = await prisma.user.create({
    data: {
      email: 'cliente2@test.com',
      password: cliente2Password,
      nombre: 'Carlos', apellido: 'Pérez', cedula: '55667788',
      fecha_nacimiento: new Date('1988-07-10'), tipo_comercio: 'Kiosco',
      whatsapp: '+595981333333', role: 'deudor', fondo_acumulado: 25000
    }
  });

  // Productos
  const productos = await prisma.product.createMany({
    data: [
      { nombre: 'Leche Entera', descripcion: 'Caja de 12 unidades de 1L', categoria: 'Lácteos',
        precio_compra: 45000, precio_venta_sugerido: 55000, unidad: 'caja', cantidad_por_unidad: 12, stock_disponible: 25 },
      { nombre: 'Arroz Blanco', descripcion: 'Bolsa de 5kg', categoria: 'Granos',
        precio_compra: 15000, precio_venta_sugerido: 18000, unidad: 'bolsa', cantidad_por_unidad: 1, stock_disponible: 40 },
      { nombre: 'Aceite Girasol', descripcion: 'Botella de 900ml', categoria: 'Aceites',
        precio_compra: 12000, precio_venta_sugerido: 15000, unidad: 'botella', cantidad_por_unidad: 1, stock_disponible: 30 },
      { nombre: 'Azúcar Blanca', descripcion: 'Paquete de 1kg', categoria: 'Endulzantes',
        precio_compra: 8000, precio_venta_sugerido: 10000, unidad: 'paquete', cantidad_por_unidad: 1, stock_disponible: 50 }
    ]
  });

  // Préstamos
  const loan1 = await prisma.loan.create({
    data: {
      userId: cliente1.id, monto_principal: 150000, interes_total_percent: 20,
      total_a_devolver: 180000, plazo_dias: 30, monto_diario: 6000,
      fecha_otorgado: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      fecha_inicio_cobro: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), estado: 'activo'
    }
  });

  const loan2 = await prisma.loan.create({
    data: {
      userId: cliente2.id, monto_principal: 80000, interes_total_percent: 20,
      total_a_devolver: 96000, plazo_dias: 20, monto_diario: 4800,
      fecha_otorgado: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      fecha_inicio_cobro: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), estado: 'activo'
    }
  });

  // Cuotas para préstamo 1
  const installments1 = [];
  for (let i = 0; i < 30; i++) {
    const fechaCuota = new Date(Date.now() + (i - 4) * 24 * 60 * 60 * 1000);
    installments1.push({
      loanId: loan1.id, fecha: fechaCuota, monto_expected: 6000,
      status: i < 5 ? 'pagado' : 'pendiente', monto_pagado: i < 5 ? 6000 : 0
    });
  }
  await prisma.installment.createMany({ data: installments1 });

  // Cuotas para préstamo 2
  const installments2 = [];
  for (let i = 0; i < 20; i++) {
    const fechaCuota = new Date(Date.now() + (i - 2) * 24 * 60 * 60 * 1000);
    installments2.push({
      loanId: loan2.id, fecha: fechaCuota, monto_expected: 4800,
      status: i < 2 ? 'pagado' : 'pendiente', monto_pagado: i < 2 ? 4800 : 0
    });
  }
  await prisma.installment.createMany({ data: installments2 });

  console.log('🎉 Base de datos completa creada:');
  console.log('👤 Admin: admin@smartcredit.com / admin123');
  console.log('👮 Cobrador: cobrador@smartcredit.com / cobrador123');
  console.log('🛒 Cliente 1: cliente@test.com / cliente123 (75,000 Gs)');
  console.log('🛒 Cliente 2: cliente2@test.com / cliente2123 (25,000 Gs)');
  console.log('💰 2 préstamos activos con cuotas');
  console.log('📦 4 productos disponibles');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });