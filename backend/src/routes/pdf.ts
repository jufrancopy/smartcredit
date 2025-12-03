import express from 'express';
import { generateLoanDetailPDF } from '../controllers/pdf';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Ruta para generar PDF del detalle del préstamo
router.get('/loan/:loanId', authenticateToken, generateLoanDetailPDF);

export default router;