-- Agregar campos para comprobantes de pago en Investment
ALTER TABLE "Investment" ADD COLUMN IF NOT EXISTS "comprobante_pago" TEXT;

-- El campo monto_pagado ya existe, pero por si acaso:
ALTER TABLE "Investment" ADD COLUMN IF NOT EXISTS "monto_pagado" DOUBLE PRECISION DEFAULT 0;