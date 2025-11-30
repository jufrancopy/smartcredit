import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Hash a default password for regular users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Hash the admin password from .env or a default
  const adminPassword = process.env.ADMIN_PASSWORD || 'Jcf3458435'; // Using the password you provided
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  // Delete all data
  await prisma.payment.deleteMany({});
  await prisma.installment.deleteMany({});
  await prisma.loan.deleteMany({});
  await prisma.riskEvent.deleteMany({});
  await prisma.user.deleteMany({});

  // Create an admin user
  const adminUser = await prisma.user.create({
    data: {
      email: process.env.ADMIN_USER || 'admin',
      password: hashedAdminPassword,
      nombre: 'Super',
      apellido: 'Admin',
      cedula: '0000000',
      fecha_nacimiento: new Date('1980-01-01'),
      tipo_comercio: 'Administracion',
      whatsapp: '595981000000',
      role: 'admin',
    },
  });

  // Create a collector
  const collector = await prisma.user.create({
    data: {
      email: 'collector@example.com',
      password: hashedPassword,
      nombre: 'Juan',
      apellido: 'Perez',
      cedula: '1234567',
      fecha_nacimiento: new Date('1990-01-01'),
      tipo_comercio: 'Cobrador',
      whatsapp: '595981123456',
      role: 'cobrador',
    },
  })

  // Create two debtors
  const debtor1 = await prisma.user.create({
    data: {
      email: 'jucfra23@gmail.com',
      password: hashedPassword,
      nombre: 'Maria Graciela',
      apellido: 'Baez',
      cedula: '7654321',
      fecha_nacimiento: new Date('1995-05-10'),
      tipo_comercio: 'Luque - Isla Bogado',
      whatsapp: '595981654321',
      role: 'deudor',
    },
  })

  const debtor2 = await prisma.user.create({
    data: {
      email: 'filoartepy@gmail.com',
      password: hashedPassword,
      nombre: 'Rocio Liliana',
      apellido: 'Paniagua Báez',
      cedula: '9876543',
      fecha_nacimiento: new Date('1988-11-20'),
      tipo_comercio: 'Luque - Isla Bogado',
      whatsapp: '595981987654',
      role: 'deudor',
    },
  })

  // Create a loan for debtor1
  const loan1 = await prisma.loan.create({
    data: {
      userId: debtor1.id,
      monto_principal: 1000000,
      interes_total_percent: 32,
      total_a_devolver: 1320000,
      plazo_dias: 30,
      fecha_otorgado: new Date(),
      fecha_inicio_cobro: new Date(),
      riesgo_score: 75,
    },
  })

  // Create installments for loan1
  const dailyAmount = 1320000 / 30
  for (let i = 0; i < 30; i++) {
    const installmentDate = new Date()
    installmentDate.setDate(installmentDate.getDate() + i)
    await prisma.installment.create({
      data: {
        loanId: loan1.id,
        fecha: installmentDate,
        monto_expected: dailyAmount,
      },
    })
  }

  // Create a loan for debtor2
  const loan2 = await prisma.loan.create({
    data: {
      userId: debtor2.id,
      monto_principal: 500000,
      interes_total_percent: 32,
      total_a_devolver: 660000,
      plazo_dias: 30,
      fecha_otorgado: new Date(),
      fecha_inicio_cobro: new Date(),
      riesgo_score: 85,
    },
  })

  // Create installments for loan2
  const dailyAmount2 = 660000 / 30
  for (let i = 0; i < 30; i++) {
    const installmentDate = new Date()
    installmentDate.setDate(installmentDate.getDate() + i)
    await prisma.installment.create({
      data: {
        loanId: loan2.id,
        fecha: installmentDate,
        monto_expected: dailyAmount2,
      },
    })
  }

  console.log({ collector, debtor1, debtor2, loan1, loan2 })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
