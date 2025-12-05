#!/bin/bash

# Script de despliegue seguro para AhorraConmigo
echo "🚀 Iniciando despliegue seguro..."

# 1. Backup de la base de datos
echo "📦 Creando backup de la base de datos..."
pg_dump -h localhost -U postgres -d smartcredit > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Instalar dependencias del backend
echo "📚 Instalando dependencias del backend..."
cd backend
npm install

# 3. Generar cliente Prisma (sin migrar)
echo "🔧 Generando cliente Prisma..."
npx prisma generate

# 4. Compilar TypeScript
echo "🏗️ Compilando TypeScript..."
npm run build

# 5. Instalar dependencias del frontend
echo "📚 Instalando dependencias del frontend..."
cd ../frontend
npm install

# 6. Compilar frontend
echo "🏗️ Compilando frontend..."
npm run build

echo "✅ Despliegue completado sin migraciones"
echo "⚠️  Para aplicar cambios de BD, ejecuta manualmente: npx prisma db push"