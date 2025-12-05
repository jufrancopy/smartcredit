-- Migración para agregar campos de microcrédito
-- Ejecutar en producción para agregar funcionalidad de microcréditos

-- Crear enum para tipo de pago si no existe
DO $$ BEGIN
    CREATE TYPE "PaymentType" AS ENUM ('inmediato', 'microcredito');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Agregar nuevos campos a la tabla Investment
ALTER TABLE "Investment" 
ADD COLUMN IF NOT EXISTS "tipo_pago" "PaymentType" DEFAULT 'inmediato',
ADD COLUMN IF NOT EXISTS "fecha_limite_pago" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "pagado" BOOLEAN DEFAULT true;

-- Actualizar registros existentes para que sean consistentes
UPDATE "Investment" 
SET "tipo_pago" = 'inmediato', "pagado" = true 
WHERE "tipo_pago" IS NULL;

-- Hacer que tipo_pago sea NOT NULL después de actualizar
ALTER TABLE "Investment" 
ALTER COLUMN "tipo_pago" SET NOT NULL;