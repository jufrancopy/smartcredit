-- Agregar campo monto_pagado a tabla Investment
ALTER TABLE "Investment" ADD COLUMN "monto_pagado" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Actualizar registros existentes: si pagado=true, monto_pagado=monto_total
UPDATE "Investment" SET "monto_pagado" = "monto_total" WHERE "pagado" = true;