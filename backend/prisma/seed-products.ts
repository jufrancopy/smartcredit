import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProducts() {
  console.log('🌱 Seeding products...');

  const products = [
    {
      nombre: 'Leche Entera',
      descripcion: 'Caja de 12 unidades de 1 litro',
      categoria: 'Lácteos',
      precio_compra: 45000,
      precio_venta_sugerido: 55000,
      unidad: 'caja',
      cantidad_por_unidad: 12,
      stock_disponible: 50,
    },
    {
      nombre: 'Huevos',
      descripcion: 'Maple de 30 huevos frescos',
      categoria: 'Proteínas',
      precio_compra: 25000,
      precio_venta_sugerido: 32000,
      unidad: 'maple',
      cantidad_por_unidad: 30,
      stock_disponible: 100,
    },
    {
      nombre: 'Manzanas',
      descripcion: 'Caja de 20kg de manzanas rojas',
      categoria: 'Frutas',
      precio_compra: 80000,
      precio_venta_sugerido: 100000,
      unidad: 'caja',
      cantidad_por_unidad: 20,
      stock_disponible: 25,
    },
    {
      nombre: 'Carne Molida',
      descripcion: 'Paquete de 5kg de carne molida',
      categoria: 'Carnes',
      precio_compra: 120000,
      precio_venta_sugerido: 150000,
      unidad: 'paquete',
      cantidad_por_unidad: 5,
      stock_disponible: 20,
    },
    {
      nombre: 'Arroz',
      descripcion: 'Bolsa de 25kg de arroz blanco',
      categoria: 'Granos',
      precio_compra: 60000,
      precio_venta_sugerido: 75000,
      unidad: 'bolsa',
      cantidad_por_unidad: 25,
      stock_disponible: 40,
    },
    {
      nombre: 'Aceite',
      descripcion: 'Caja de 12 botellas de 900ml',
      categoria: 'Aceites',
      precio_compra: 85000,
      precio_venta_sugerido: 105000,
      unidad: 'caja',
      cantidad_por_unidad: 12,
      stock_disponible: 30,
    }
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
    console.log(`✅ Created product: ${product.nombre}`);
  }

  console.log('🎉 Products seeded successfully!');
}

seedProducts()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });