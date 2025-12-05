import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getClientProducts,
  createClientProduct,
  updateClientProduct,
  deleteClientProduct,
  getCategories
} from '../controllers/clientProducts';

const router = express.Router();

router.get('/', authenticateToken, getClientProducts);
router.get('/categories', authenticateToken, getCategories);
router.post('/', authenticateToken, createClientProduct);
router.put('/:id', authenticateToken, updateClientProduct);
router.delete('/:id', authenticateToken, deleteClientProduct);

export default router;