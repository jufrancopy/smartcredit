import express from 'express';
import { authenticateToken } from '../middleware/auth';
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
  approveConsignment,
  rejectConsignment,
  updateInvestmentPrice
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
router.post('/pay-microcredit', authenticateToken, payMicrocredit);
router.put('/update-price', authenticateToken, updateInvestmentPrice);

// Rutas para admin - consignaciones
router.get('/pending-consignments', authenticateToken, getPendingConsignments);
router.post('/approve-consignment', authenticateToken, approveConsignment);
router.post('/reject-consignment', authenticateToken, rejectConsignment);

export default router;