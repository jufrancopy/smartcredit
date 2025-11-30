# Proyecto: Sistema de Préstamos - AhorraConmigo

## Resumen del Proyecto

El objetivo es desarrollar un sistema de microcréditos diarios con un backend en Node.js (Express) y Prisma, una base de datos PostgreSQL, y un frontend en React.

## Estructura de Carpetas

El proyecto está organizado en dos carpetas principales:

- `backend/`: Contiene el servidor, la lógica de negocio, y la configuración de la base de datos.
- `frontend/`: Contiene la aplicación de React para la interfaz de usuario.

---

## Backend

### Estado Actual

El servidor del backend está completo y en funcionamiento.

- **Configuración de la Base de Datos**: Se ha creado el esquema de Prisma en `backend/prisma/schema.prisma`, definiendo los modelos para `User`, `Loan`, `Installment`, `Payment`, y `RiskEvent`.
- **Seed de Datos**: Se ha creado un script en `backend/prisma/seed.ts` para poblar la base de datos con datos de ejemplo (1 cobrador, 2 deudores, 2 préstamos).
- **API Endpoints**: Se ha configurado un servidor de Express en `backend/src/index.ts` con las siguientes rutas:
    - `POST /api/users`: Crear un nuevo usuario.
    - `GET /api/users/:id/scoring`: Consultar el scoring de un usuario.
    - `POST /api/loans`: Crear un nuevo préstamo (y generar sus cuotas).
    - `GET /api/loans`: Consultar todos los préstamos.
    - `POST /api/payments/upload`: Subir un comprobante de pago.
    - `POST /api/payments/confirm`: Confirmar un pago.
- **Configuración de TypeScript**: Se ha añadido un archivo `backend/tsconfig.json` para la compilación.

### Cómo ejecutar el Backend

1.  Navega a la carpeta `backend`.
2.  Crea un archivo `.env` y configura tu `DATABASE_URL`.
3.  Ejecuta `npm install` para instalar las dependencias.
4.  Ejecuta `npx prisma migrate dev` para aplicar las migraciones a la base de datos.
5.  Ejecuta `npm run seed` para poblar la base de datos.
6.  Ejecuta `npm run dev` para iniciar el servidor en `http://localhost:3000`.

---

## Frontend

### Estado Actual

El proyecto de frontend ha sido configurado con Vite y está listo para empezar el desarrollo de la interfaz.

- **Herramienta de Desarrollo**: Se ha configurado Vite como la herramienta de construcción y servidor de desarrollo, reemplazando a `react-scripts` para mayor velocidad y compatibilidad.
- **Componentes Creados**: Se han generado los siguientes componentes base en `frontend/src/components`:
    - `PaymentCalendar.tsx`: Para visualizar los pagos.
    - `UploadReceipt.tsx`: Formulario para subir comprobantes.
    - `CollectorDashboard.tsx`: Panel para el cobrador.
- **Consultas a la API**: Se han creado los hooks de React Query en `frontend/src/queries.ts` para interactuar con todos los endpoints del backend. La librería ha sido actualizada a `@tanstack/react-query`.
- **Archivos de Entrada**: Se ha creado el `index.html` y `frontend/src/main.tsx` como punto de entrada de la aplicación.

### Cómo ejecutar el Frontend

1.  Navega a la carpeta `frontend`.
2.  Ejecuta `npm install` para instalar las dependencias (`react`, `react-dom`, `@tanstack/react-query`, `vite`, etc.).
3.  Ejecuta `npm run dev` para iniciar el servidor de desarrollo. Debería abrirse en `http://localhost:5173`.

---

## ✅ Dónde Nos Quedamos

1.  **Backend**: El servidor está **corriendo exitosamente** en `http://localhost:3000`.
2.  **Frontend**: Se solucionaron todos los problemas de dependencias y configuración. El proyecto de frontend está listo para ser iniciado con `npm run dev`.

## 🚀 Próximos Pasos

El siguiente paso es **integrar los componentes de React que ya creamos** en la aplicación principal (`frontend/src/main.tsx`) para construir la interfaz de usuario y conectarla con los datos del backend usando los hooks de React Query.
