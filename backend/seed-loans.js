const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Buscar cliente existente
  const cliente = await prisma.user.findUnique({
    where: { email: 'cliente@test.com' }
  });

  if (!cliente) {
    console.log('Cliente no encontrado');
    return;
  }

  // Crear préstamo para el cliente
  const loan = await prisma.loan.create({
    data: {
      userId: cliente.id,
      monto_principal: 100000,
      interes_total_percent: 20,
      total_a_devolver: 120000,
      plazo_dias: 30,
      monto_diario: 4000,
      fecha_otorgado: new Date(),
      fecha_inicio_cobro: new Date(Date.now() + 24 * 60 * 60 * 1000),
      estado: 'activo'
    }
  });

  // Crear cuotas
  const installments = [];
  for (let i = 0; i < 30; i++) {
    const fechaCuota = new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000);
    installments.push({
      loanId: loan.id,
      fecha: fechaCuota,
      monto_expected: 4000,
      status: 'pendiente'
    });
  }
  
  await prisma.installment.createMany({ data: installments });

  // Crear productos
  await prisma.product.createMany({
    data: [
      {
        nombre: 'Leche Entera',
        descripcion: 'Caja de 12 unidades de 1L',
        categoria: 'Lácteos',
        precio_compra: 45000,
        precio_venta_sugerido: 55000,
        unidad: 'caja',
        cantidad_por_unidad: 12,
        stock_disponible: 20
      },
      {
        nombre: 'Arroz Blanco',
        descripcion: 'Bolsa de 5kg',
        categoria: 'Granos',
        precio_compra: 15000,
        precio_venta_sugerido: 18000,
        unidad: 'bolsa',
        cantidad_por_unidad: 1,
        stock_disponible: 50
      }
    ]
  });

  console.log('Préstamo y productos creados exitosamente');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });