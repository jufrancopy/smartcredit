-- Agregar campo precio_reventa_cliente a la tabla Investment
ALTER TABLE "Investment" 
ADD COLUMN "precio_reventa_cliente" DECIMAL(10,2);

-- Actualizar registros existentes con el precio sugerido del producto
UPDATE "Investment" 
SET "precio_reventa_cliente" = (
  SELECT "precio_venta_sugerido" 
  FROM "Product" 
  WHERE "Product"."id" = "Investment"."productId"
)
WHERE "precio_reventa_cliente" IS NULL;