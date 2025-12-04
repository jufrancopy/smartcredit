-- CreateEnum
CREATE TYPE "InvestmentStatus" AS ENUM ('activo', 'vendido_parcial', 'vendido_completo', 'cancelado');

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT NOT NULL,
    "precio_compra" DOUBLE PRECISION NOT NULL,
    "precio_venta_sugerido" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL,
    "cantidad_por_unidad" INTEGER NOT NULL,
    "imagen_url" TEXT,
    "stock_disponible" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "cantidad_comprada" INTEGER NOT NULL,
    "precio_unitario" DOUBLE PRECISION NOT NULL,
    "monto_total" DOUBLE PRECISION NOT NULL,
    "fecha_compra" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "InvestmentStatus" NOT NULL DEFAULT 'activo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesReport" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "investmentId" INTEGER NOT NULL,
    "cantidad_vendida" INTEGER NOT NULL,
    "precio_venta" DOUBLE PRECISION NOT NULL,
    "monto_total_venta" DOUBLE PRECISION NOT NULL,
    "ganancia_generada" DOUBLE PRECISION NOT NULL,
    "fecha_venta" TIMESTAMP(3) NOT NULL,
    "comprobante_url" TEXT,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "verificado_por" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReport" ADD CONSTRAINT "SalesReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReport" ADD CONSTRAINT "SalesReport_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
