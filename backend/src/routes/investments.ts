import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth';

// Crear directorio si no existe
const uploadsDir = 'uploads/receipts/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de multer para comprobantes
const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadReceipt = multer({ 
  storage: receiptStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
import {
  getProducts,
  buyProduct,
  getUserInvestments,
  reportSale,
  getInvestmentDashboard,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
  getClientProducts,
  getCollectorStores,
  configureStore,
  payMicrocredit,
  getPendingConsignments,
  getApprovedConsignments,
  getPaidPurchases,
  approveConsignment,
  rejectConsignment,
  updateInvestmentPrice,
  cancelInvestment,
  fixInvestmentPrices
} from '../controllers/investments';

const router = express.Router();

// Rutas públicas
router.get('/tienda/:clienteSlug', getClientProducts);

// Rutas para productos (MiniTienda)
router.get('/products', authenticateToken, getProducts);
router.post('/products', authenticateToken, createProduct);
router.put('/products/:id', authenticateToken, updateProduct);
router.patch('/products/:id/stock', authenticateToken, updateStock);
router.delete('/products/:id', authenticateToken, deleteProduct);

// Rutas para cobradores
router.get('/collector-stores', authenticateToken, getCollectorStores);

// Rutas para clientes
router.post('/configure-store', authenticateToken, configureStore);

// Rutas para inversiones
router.post('/buy', authenticateToken, buyProduct);
router.get('/my-investments', authenticateToken, getUserInvestments);
router.post('/report-sale', authenticateToken, reportSale);
router.get('/dashboard', authenticateToken, getInvestmentDashboard);
router.post('/pay-microcredit', authenticateToken, uploadReceipt.single('comprobante'), payMicrocredit);
router.put('/update-price', authenticateToken, updateInvestmentPrice);

// Rutas para admin - consignaciones
router.get('/pending-consignments', authenticateToken, getPendingConsignments);
router.get('/approved-consignments', authenticateToken, getApprovedConsignments);
router.get('/paid-purchases', authenticateToken, getPaidPurchases);
router.post('/approve-consignment', authenticateToken, approveConsignment);
router.post('/reject-consignment', authenticateToken, rejectConsignment);
router.post('/cancel-investment', authenticateToken, cancelInvestment);
// router.post('/fix-investment-prices', authenticateToken, fixInvestmentPrices); // Endpoint temporal - ya no necesario

export default router;