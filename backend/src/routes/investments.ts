import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getProducts,
  buyProduct,
  getUserInvestments,
  reportSale,
  getInvestmentDashboard
} from '../controllers/investments';

const router = express.Router();

// Rutas para productos (MiniTienda)
router.get('/products', authenticateToken, getProducts);

// Rutas para inversiones
router.post('/buy', authenticateToken, buyProduct);
router.get('/my-investments', authenticateToken, getUserInvestments);
router.post('/report-sale', authenticateToken, reportSale);
router.get('/dashboard', authenticateToken, getInvestmentDashboard);

export default router;