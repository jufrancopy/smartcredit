import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { upload, uploadProductImage } from '../controllers/upload';

const router = express.Router();

router.post('/product-image', authenticateToken, upload.single('image'), uploadProductImage);

export default router;