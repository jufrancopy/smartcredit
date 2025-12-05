# Comandos para ejecutar en el servidor

## 1. Verificar estado de la base de datos
```bash
chmod +x safe-deploy.sh
./safe-deploy.sh
```

## 2. Revisar qué existe en tu BD
```bash
cat db-status.txt
```

## 3. Una vez verificado, aplicar solo los cambios necesarios
```bash
cd backend
npx prisma db push
```

## 4. Reiniciar servicios
```bash
# Si usas PM2
pm2 restart all

# O si usas systemctl
sudo systemctl restart tu-servicio-backend
sudo systemctl restart tu-servicio-frontend
```