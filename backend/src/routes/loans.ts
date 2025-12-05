import { Request, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { sendLoanApprovalEmail } from '../utils/emailService';

// Extend the Request interface to include user information, mirroring auth.ts
interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

const router = Router();
const prisma = new PrismaClient();

// Flat interest rate for the loan period (e.g., 20%)
const TOTAL_INTEREST_RATE = 0.20; 

// Create a new loan
router.post('/loans', authenticateToken, async (req: AuthRequest, res) => {
  let { userId, monto_principal, plazo_dias, fecha_otorgado, fecha_inicio_cobro, monto_diario } = req.body;

  // For 'deudor' role, ensure loan is created for themselves
  if (req.userRole === 'deudor') {
    userId = req.userId; // Override userId from body with authenticated user's ID
  }

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required for loan creation.' });
  }
  try {
    // 1. Calculate final_total_a_devolver based on monto_diario and plazo_dias from the frontend
    const final_total_a_devolver = monto_diario * plazo_dias;
    const interes_total_percent = (final_total_a_devolver / monto_principal - 1) * 100;

    const loan = await prisma.loan.create({
      data: {
        userId,
        monto_principal,
        interes_total_percent: parseFloat(interes_total_percent.toFixed(2)),
        total_a_devolver: final_total_a_devolver,
        plazo_dias,
        monto_diario, // Save monto_diario from frontend
        fecha_otorgado,
        fecha_inicio_cobro,
      },
    });

    // Create installments using monto_diario from frontend
    for (let i = 0; i < plazo_dias; i++) {
      const installmentDate = new Date(fecha_inicio_cobro);
      installmentDate.setDate(installmentDate.getDate() + i);
      await prisma.installment.create({
        data: {
          loanId: loan.id,
          fecha: installmentDate,
          monto_expected: monto_diario,
        },
      });
    }

    res.json(loan);

    // Send email notification to the client
    const client = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, nombre: true } });
    if (client && client.email) {
      try {
        await sendLoanApprovalEmail({
          email: client.email,
          nombre: client.nombre,
          monto_principal,
          total_a_devolver: final_total_a_devolver,
          plazo_dias,
          monto_diario,
          fecha_inicio_cobro
        });
      } catch (emailError) {
        console.error('Error sending loan approval email:', emailError);
      }
    }
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(500).json({ error: 'Error creating loan' });
  }
});

// Get all loans
router.get('/loans', authenticateToken, async (req: AuthRequest, res) => {
  try {
    let whereClause: any = {};
    if (req.userRole === 'deudor') {
      if (!req.userId) {
        return res.status(403).json({ error: 'User ID not found in token for deudor role.' });
      }
      whereClause = { userId: req.userId };
    }

    // Filtrar por fecha si se proporciona el parámetro 'nuevos'
    const { nuevos, desde } = req.query;
    
    if (nuevos === 'true') {
      // Obtener préstamos de los últimos 7 días
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 7);
      whereClause.createdAt = {
        gte: fechaLimite
      };
    } else if (desde) {
      // Filtrar desde una fecha específica
      whereClause.createdAt = {
        gte: new Date(desde as string)
      };
    }

    const loans = await prisma.loan.findMany({
      where: whereClause,
      include: {
        user: true,
        installments: {
          include: { payments: true }, // Include payments for each installment
        },
      },
      orderBy: {
        createdAt: 'desc' // Ordenar por fecha de creación, más recientes primero
      }
    });
    const formattedLoans = loans.map(loan => ({
      ...loan,
      fecha_otorgado: loan.fecha_otorgado.toISOString().split('T')[0],
      fecha_inicio_cobro: loan.fecha_inicio_cobro.toISOString().split('T')[0],
      createdAt: loan.createdAt.toISOString(),
      installments: loan.installments.map(installment => ({
        ...installment,
        fecha: installment.fecha.toISOString().split('T')[0],
      })),
    }));
    res.json({
      loans: formattedLoans,
      total: formattedLoans.length,
      filtros: {
        nuevos: nuevos === 'true',
        desde: desde || null
      }
    });
  } catch (error) {
    console.error('Error getting loans:', error);
    res.status(500).json({ error: 'Error getting loans' });
  }
});

// Get loans by status (nuevos vs existentes)
router.get('/loans/by-status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    let baseWhereClause: any = {};
    if (req.userRole === 'deudor') {
      if (!req.userId) {
        return res.status(403).json({ error: 'User ID not found in token for deudor role.' });
      }
      baseWhereClause = { userId: req.userId };
    }

    // Definir fecha límite para "nuevos" (últimos 7 días)
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 7);

    // Obtener préstamos nuevos (últimos 7 días) - solo activos
    const prestamosNuevos = await prisma.loan.findMany({
      where: {
        ...baseWhereClause,
        estado: 'activo',
        createdAt: {
          gte: fechaLimite
        }
      },
      include: {
        user: true,
        installments: {
          include: { payments: true },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Obtener préstamos existentes (más de 7 días) - solo activos
    const prestamosExistentes = await prisma.loan.findMany({
      where: {
        ...baseWhereClause,
        estado: 'activo',
        createdAt: {
          lt: fechaLimite
        }
      },
      include: {
        user: true,
        installments: {
          include: { payments: true },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formatLoan = (loan: any) => ({
      ...loan,
      fecha_otorgado: loan.fecha_otorgado.toISOString().split('T')[0],
      fecha_inicio_cobro: loan.fecha_inicio_cobro.toISOString().split('T')[0],
      createdAt: loan.createdAt.toISOString(),
      installments: loan.installments.map((installment: any) => ({
        ...installment,
        fecha: installment.fecha.toISOString().split('T')[0],
      })),
    });

    res.json({
      nuevos: prestamosNuevos.map(formatLoan),
      existentes: prestamosExistentes.map(formatLoan),
      totales: {
        nuevos: prestamosNuevos.length,
        existentes: prestamosExistentes.length,
        total: prestamosNuevos.length + prestamosExistentes.length
      },
      fechaLimite: fechaLimite.toISOString()
    });
  } catch (error) {
    console.error('Error getting loans by status:', error);
    res.status(500).json({ error: 'Error getting loans by status' });
  }
});

export default router;
