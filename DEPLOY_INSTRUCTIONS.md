# INSTRUCCIONES SEGURAS DE DESPLIEGUE

## ⚠️ IMPORTANTE: NO BORRAR BASE DE DATOS EN PRODUCCIÓN

### Para Producción:
1. **Solo ejecutar este SQL** en tu base de datos de producción:
   ```bash
   psql -h [HOST] -U [USER] -d [DATABASE] -f backend/migrations/production_safe_microcredit.sql
   ```

2. **Subir código actualizado** (backend y frontend)

3. **Reiniciar servidor**

### Para Desarrollo Local:
Si necesitas recrear datos locales, usa:
```bash
cd backend && node seed.js
```

## Lo que hace la migración:
- ✅ Agrega campos nuevos solo si no existen
- ✅ Mantiene todos los datos existentes
- ✅ Asigna valores por defecto a registros existentes
- ✅ No borra nada

## Usuarios de prueba local:
- Admin: admin@smartcredit.com / admin123
- Cliente: cliente@test.com / cliente123