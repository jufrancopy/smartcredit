#!/bin/bash

echo "🔄 Aplicando migración segura..."

# Backup antes de migrar
echo "📦 Creando backup..."
pg_dump -h localhost -U postgres -d smartcredit > backup_before_migration_$(date +%Y%m%d_%H%M%S).sql

# Aplicar migración
echo "🚀 Aplicando cambios a la BD..."
psql -h localhost -U postgres -d smartcredit -f migrate-server.sql

# Generar cliente Prisma actualizado
echo "🔧 Actualizando cliente Prisma..."
cd backend
npx prisma generate

echo "✅ Migración completada"
echo "🔄 Reinicia tus servicios ahora"