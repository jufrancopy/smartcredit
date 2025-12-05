#!/bin/bash

echo "🔍 Verificando estado de la base de datos..."

# Ejecutar verificación de BD
psql -h localhost -U postgres -d ahorraconmigo -f check-db.sql > db-status.txt

echo "📋 Estado de BD guardado en db-status.txt"
echo "📖 Revisa el archivo para ver qué existe actualmente"

# Generar cliente Prisma sin migrar
echo "🔧 Generando cliente Prisma..."
cd backend
npx prisma generate

# Compilar backend
echo "🏗️ Compilando backend..."
npm run build

# Compilar frontend  
echo "🏗️ Compilando frontend..."
cd ../frontend
npm run build

echo "✅ Compilación completada"
echo "⚠️  Revisa db-status.txt antes de aplicar cambios de BD"