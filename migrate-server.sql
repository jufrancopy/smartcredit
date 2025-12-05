-- Migración segura para servidor - Solo agregar lo que falta
BEGIN;

-- 1. Agregar columnas faltantes a User (tienda)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tienda_slug" TEXT UNIQUE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tienda_nombre" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tienda_activa" BOOLEAN DEFAULT false;

-- 2. Crear enums necesarios
DO $$ BEGIN
    CREATE TYPE "InvestmentStatus" AS ENUM ('activo', 'vendido_parcial', 'vendido_completo', 'cancelado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentType" AS ENUM ('inmediato', 'microcredito');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Crear tabla Product
CREATE TABLE IF NOT EXISTS "Product" (
    "id" SERIAL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT NOT NULL,
    "precio_compra" DOUBLE PRECISION NOT NULL,
    "precio_venta_sugerido" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL,
    "cantidad_por_unidad" INTEGER NOT NULL,
    "imagen_url" TEXT,
    "stock_disponible" INTEGER DEFAULT 0,
    "activo" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Crear tabla Investment
CREATE TABLE IF NOT EXISTS "Investment" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "User"("id"),
    "productId" INTEGER NOT NULL REFERENCES "Product"("id"),
    "cantidad_comprada" INTEGER NOT NULL,
    "precio_unitario" DOUBLE PRECISION NOT NULL,
    "monto_total" DOUBLE PRECISION NOT NULL,
    "fecha_compra" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "estado" "InvestmentStatus" DEFAULT 'activo',
    "tipo_pago" "PaymentType" DEFAULT 'inmediato',
    "fecha_limite_pago" TIMESTAMP,
    "pagado" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Crear tabla SalesReport
CREATE TABLE IF NOT EXISTS "SalesReport" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "User"("id"),
    "investmentId" INTEGER NOT NULL REFERENCES "Investment"("id"),
    "cantidad_vendida" INTEGER NOT NULL,
    "precio_venta" DOUBLE PRECISION NOT NULL,
    "monto_total_venta" DOUBLE PRECISION NOT NULL,
    "ganancia_generada" DOUBLE PRECISION NOT NULL,
    "fecha_venta" TIMESTAMP NOT NULL,
    "comprobante_url" TEXT,
    "verificado" BOOLEAN DEFAULT false,
    "verificado_por" INTEGER,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Crear tabla ClientProduct
CREATE TABLE IF NOT EXISTS "ClientProduct" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "User"("id"),
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER DEFAULT 0,
    "imagen_url" TEXT,
    "activo" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;