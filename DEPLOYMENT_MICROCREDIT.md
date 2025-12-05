# Despliegue de Funcionalidad de Microcréditos

## Cambios Implementados

### Backend
- **Nuevos campos en Investment**: `tipo_pago`, `fecha_limite_pago`, `pagado`
- **Nuevo enum**: `PaymentType` (inmediato, microcredito)
- **Controlador actualizado**: Manejo de microcréditos con límite de 48 horas
- **Nueva ruta**: `/api/investments/pay-microcredit` para pagar microcréditos

### Frontend
- **ProductManager**: Muestra detalle de inventario por cliente y estado de microcréditos
- **ProductCatalog**: Opción de compra inmediata o microcrédito (48h)
- **Queries actualizadas**: Soporte para tipo de pago y pago de microcréditos

## Instrucciones de Despliegue en Producción

### 1. Migración de Base de Datos
```bash
# Ejecutar el archivo SQL en la base de datos de producción
psql -h [HOST] -U [USER] -d [DATABASE] -f backend/migrations/add_microcredit_fields.sql
```

### 2. Despliegue de Backend
```bash
cd backend
npm install
npm run build
# Reiniciar servidor
```

### 3. Despliegue de Frontend
```bash
cd frontend
npm install
npm run build
# Desplegar archivos build/
```

## Funcionalidades Nuevas

### Para Administradores
- **Detalle de Inventario**: Ver qué cliente tiene cada producto
- **Microcréditos Pendientes**: Identificar pagos vencidos
- **Distribución de Stock**: Stock en bodega vs. stock en clientes

### Para Clientes
- **Compra Inmediata**: Pago con fondos acumulados
- **Microcrédito**: Apartar producto con pago en 48 horas máximo
- **Gestión de Deudas**: Ver y pagar microcréditos pendientes

## Validaciones de Seguridad
- Límite de 48 horas para microcréditos
- Verificación de fondos antes de pago
- Control de stock automático
- Transacciones atómicas para consistencia

## Monitoreo Recomendado
- Revisar microcréditos vencidos diariamente
- Alertas para pagos próximos a vencer
- Seguimiento de rotación de inventario por cliente