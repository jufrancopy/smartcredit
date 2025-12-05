-- Script para verificar el estado actual de la base de datos
-- Ejecutar en PostgreSQL para ver qué tablas y columnas existen

-- Verificar tablas existentes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar columnas de User
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'User' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar columnas de Investment
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'Investment' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar si existe tabla ClientProduct
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'ClientProduct'
);