-- Actualizar inversiones existentes para usar precio de venta en lugar de precio de compra
UPDATE Investment 
SET 
  precio_unitario = (
    SELECT precio_venta_sugerido 
    FROM Product 
    WHERE Product.id = Investment.productId
  ),
  monto_total = cantidad_comprada * (
    SELECT precio_venta_sugerido 
    FROM Product 
    WHERE Product.id = Investment.productId
  )
WHERE precio_unitario = (
  SELECT precio_compra 
  FROM Product 
  WHERE Product.id = Investment.productId
);