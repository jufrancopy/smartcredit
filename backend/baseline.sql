-- CreateEnum
CREATE TYPE "Role" AS ENUM ('deudor', 'cobrador', 'admin');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('activo', 'finiquitado', 'moroso', 'cancelado');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('pendiente', 'pagado', 'parcial', 'vencido');

-- CreateEnum
CREATE TYPE "InvestmentStatus" AS ENUM ('activo', 'vendido_parcial', 'vendido_completo', 'cancelado');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('inmediato', 'microcredito');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "fecha_nacimiento" TIMESTAMP(3) NOT NULL,
    "tipo_comercio" TEXT NOT NULL,
    "foto_url" TEXT,
    "whatsapp" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'deudor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fondo_acumulado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tienda_activa" BOOLEAN NOT NULL DEFAULT false,
    "tienda_nombre" TEXT,
    "tienda_slug" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "monto_principal" DOUBLE PRECISION NOT NULL,
    "interes_total_percent" DOUBLE PRECISION NOT NULL,
    "total_a_devolver" DOUBLE PRECISION NOT NULL,
    "plazo_dias" INTEGER NOT NULL,
    "fecha_otorgado" TIMESTAMP(3) NOT NULL,
    "fecha_inicio_cobro" TIMESTAMP(3) NOT NULL,
    "estado" "LoanStatus" NOT NULL DEFAULT 'activo',
    "riesgo_score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "monto_diario" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installment" (
    "id" SERIAL NOT NULL,
    "loanId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto_expected" DOUBLE PRECISION NOT NULL,
    "monto_pagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'pendiente',
    "recibo_url" TEXT,
    "cobrador_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "installmentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "comprobante_url" TEXT,
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "confirmado_por" INTEGER,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskEvent" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "evento" TEXT NOT NULL,
    "score_impact" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT NOT NULL,
    "precio_compra" DOUBLE PRECISION NOT NULL,
    "precio_venta_sugerido" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL,
    "cantidad_por_unidad" DOUBLE PRECISION NOT NULL,
    "imagen_url" TEXT,
    "stock_disponible" DOUBLE PRECISION NOT NULL DEFAULT 0,
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
    "cantidad_comprada" DOUBLE PRECISION NOT NULL,
    "precio_unitario" DOUBLE PRECISION NOT NULL,
    "monto_total" DOUBLE PRECISION NOT NULL,
    "fecha_compra" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "InvestmentStatus" NOT NULL DEFAULT 'activo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fecha_limite_pago" TIMESTAMP(3),
    "pagado" BOOLEAN NOT NULL DEFAULT true,
    "tipo_pago" "PaymentType" NOT NULL DEFAULT 'inmediato',
    "precio_reventa_cliente" DOUBLE PRECISION,
    "monto_pagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comprobante_pago" TEXT,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesReport" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "investmentId" INTEGER NOT NULL,
    "cantidad_vendida" DOUBLE PRECISION NOT NULL,
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

-- CreateTable
CREATE TABLE "ClientProduct" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "imagen_url" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cedula_key" ON "User"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "User_whatsapp_key" ON "User"("whatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "User_tienda_slug_key" ON "User"("tienda_slug");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "Installment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskEvent" ADD CONSTRAINT "RiskEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReport" ADD CONSTRAINT "SalesReport_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReport" ADD CONSTRAINT "SalesReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProduct" ADD CONSTRAINT "ClientProduct_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

