-- MIGRACIÓN SEGURA PARA PRODUCCIÓN - NO BORRA DATOS
-- Ejecutar en producción para agregar microcréditos

-- 1. Crear enum si no existe
DO $$ BEGIN
    CREATE TYPE "PaymentType" AS ENUM ('inmediato', 'microcredito');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Agregar columnas nuevas (solo si no existen)
DO $$ 
BEGIN
    -- Agregar tipo_pago
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Investment' AND column_name='tipo_pago') THEN
        ALTER TABLE "Investment" ADD COLUMN "tipo_pago" "PaymentType" DEFAULT 'inmediato';
    END IF;
    
    -- Agregar fecha_limite_pago
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Investment' AND column_name='fecha_limite_pago') THEN
        ALTER TABLE "Investment" ADD COLUMN "fecha_limite_pago" TIMESTAMP(3);
    END IF;
    
    -- Agregar pagado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Investment' AND column_name='pagado') THEN
        ALTER TABLE "Investment" ADD COLUMN "pagado" BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 3. Actualizar registros existentes (solo los que no tienen valor)
UPDATE "Investment" 
SET "tipo_pago" = 'inmediato', "pagado" = true 
WHERE "tipo_pago" IS NULL OR "pagado" IS NULL;

-- 4. Hacer campos NOT NULL después de actualizar
ALTER TABLE "Investment" ALTER COLUMN "tipo_pago" SET NOT NULL;
ALTER TABLE "Investment" ALTER COLUMN "pagado" SET NOT NULL;