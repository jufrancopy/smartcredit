import { Request, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

// Extend the Request interface to include user information, mirroring auth.ts
interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

const router = Router();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      adapter: 'postgresql',
    },
  },
});

// Flat interest rate for the loan period (e.g., 20%)
const TOTAL_INTEREST_RATE = 0.20; 

// Create a new loan
router.post('/loans', authenticateToken, async (req: AuthRequest, res) => {
  let { userId, monto_principal, plazo_dias, fecha_otorgado, fecha_inicio_cobro } = req.body;

  // For 'deudor' role, ensure loan is created for themselves
  if (req.userRole === 'deudor') {
    userId = req.userId; // Override userId from body with authenticated user's ID
  }

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required for loan creation.' });
  }
  try {
    // 1. Calculate the total amount to be repaid with a flat interest rate
    const total_a_devolver = Math.round(monto_principal * (1 + TOTAL_INTEREST_RATE));

    // 2. Calculate the daily installment amount and round it
    const dailyAmount = Math.round(total_a_devolver / plazo_dias);

    // 3. Recalculate total_a_devolver to avoid rounding inconsistencies
    const final_total_a_devolver = dailyAmount * plazo_dias;
    const interes_total_percent = (final_total_a_devolver / monto_principal - 1) * 100;

    const loan = await prisma.loan.create({
      data: {
        userId,
        monto_principal,
        interes_total_percent: parseFloat(interes_total_percent.toFixed(2)),
        total_a_devolver: final_total_a_devolver,
        plazo_dias,
        fecha_otorgado,
        fecha_inicio_cobro,
      },
    });

    // Create installments
    for (let i = 0; i < plazo_dias; i++) {
      const installmentDate = new Date(fecha_inicio_cobro);
      installmentDate.setDate(installmentDate.getDate() + i);
      await prisma.installment.create({
        data: {
          loanId: loan.id,
          fecha: installmentDate,
          monto_expected: dailyAmount,
        },
      });
    }

    res.json(loan);
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(500).json({ error: 'Error creating loan' });
  }
});

// Get all loans
router.get('/loans', authenticateToken, async (req: AuthRequest, res) => {
  try {
    let whereClause = {};
    if (req.userRole === 'deudor') {
      if (!req.userId) {
        return res.status(403).json({ error: 'User ID not found in token for deudor role.' });
      }
      whereClause = { userId: req.userId };
    }

    const loans = await prisma.loan.findMany({
      where: whereClause,
      include: {
        user: true,
        installments: {
          include: { payments: true }, // Include payments for each installment
        },
      },
    });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: 'Error getting loans' });
  }
});

export default router;
