-- Migración para soportar decimales en productos y stock
-- Ejecutar en producción con cuidado

-- Cambiar campos de productos para soportar decimales
ALTER TABLE "Product" 
ALTER COLUMN "cantidad_por_unidad" TYPE DECIMAL(10,3),
ALTER COLUMN "stock_disponible" TYPE DECIMAL(10,3);

-- Cambiar campos de inversiones para soportar decimales  
ALTER TABLE "Investment"
ALTER COLUMN "cantidad_comprada" TYPE DECIMAL(10,3);

-- Cambiar campos de reportes de ventas para soportar decimales
ALTER TABLE "SalesReport" 
ALTER COLUMN "cantidad_vendida" TYPE DECIMAL(10,3);

-- Cambiar campo de stock en productos de clientes
ALTER TABLE "ClientProduct"
ALTER COLUMN "stock" TYPE DECIMAL(10,3);