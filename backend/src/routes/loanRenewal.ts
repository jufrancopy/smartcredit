import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkRenewalEligibility, createRenewalLoan } from '../controllers/loanRenewal';

const router = express.Router();

// Verificar elegibilidad para renovación
router.get('/check-eligibility/:userId', authenticateToken, checkRenewalEligibility);

// Crear préstamo de renovación
router.post('/create', authenticateToken, createRenewalLoan);

export default router;