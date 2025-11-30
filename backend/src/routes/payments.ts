import { Request, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'backend/uploads/photos/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Extend the Request interface to include user information, mirroring auth.ts
interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

const router = Router();
const prisma = new PrismaClient({
  datasource: {
    url: process.env.DATABASE_URL,
    adapter: 'postgresql',
  },
});

// Upload a payment receipt
router.post('/payments/upload', authenticateToken, upload.single('comprobante'), async (req: AuthRequest, res) => {
  let { installmentId: rawInstallmentId, userId: rawUserId, monto, comentario } = req.body;
  const comprobante_url = req.file ? `/uploads/photos/${req.file.filename}` : undefined;

  const installmentId = Number(rawInstallmentId);
  let userId = Number(rawUserId); // Use let because it might be overridden for deudores

  if (req.userRole === 'deudor') {
    if (rawUserId && userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden: Deudor can only upload payments for themselves.' });
    }
    userId = req.userId!; // Ensure userId is the authenticated user's ID
  }

  if (isNaN(userId) || isNaN(installmentId) || monto === undefined) {
    return res.status(400).json({ error: 'User ID, Installment ID, and Monto must be valid numbers and are required for payment upload.' });
  }
  try {
    const payment = await prisma.payment.create({
      data: {
        installment: { connect: { id: installmentId } }, // Correctly connect to the existing installment
        user: { connect: { id: userId } }, // Correctly connect to the existing user
        monto: parseFloat(monto),
        comprobante_url,
        comentario,
      },
    });
    res.json(payment);
  } catch (error: any) {
    console.error('Error uploading payment:', error);
    res.status(500).json({ error: 'Error uploading payment', details: error.message });
  }
});

// Confirm a payment, now referencing installmentId directly
router.post('/payments/confirm', authenticateToken, async (req: AuthRequest, res) => {
  if (req.userRole !== 'cobrador' && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only cobrador or admin can confirm payments.' });
  }
  const { paymentId, installmentId, monto } = req.body; // Added paymentId
  const collectorId = req.userId; // Get the collector's ID from the authenticated token

  if (paymentId === undefined || !installmentId || monto === undefined || !collectorId) {
    return res.status(400).json({ error: 'paymentId, installmentId, monto, and a valid collector token are required.' });
  }

  try {
    const installment = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: { loan: true }, // Include the related loan to get userId
    });

    if (!installment) {
      return res.status(404).json({ error: 'Installment not found' });
    }

    // Find the specific payment to update
    let payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found for confirmation.' });
    }

    if (payment.confirmado) {
      return res.status(409).json({ error: 'Payment already confirmed.' });
    }

    // Update the existing unconfirmed payment
    payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        monto,
        confirmado: true,
        confirmado_por: collectorId,
        comentario: `Pago confirmado por el cobrador ID: ${collectorId}`,
      },
    });

    // Calculate interest portion for accumulated fund
    const totalInteresLoan = installment.loan.total_a_devolver - installment.loan.monto_principal;
    const proportionInteresInPayment = totalInteresLoan / installment.loan.total_a_devolver;
    const interesToAccumulate = monto * proportionInteresInPayment;

    // Update the user's accumulated fund
    await prisma.user.update({
      where: { id: installment.loan.userId },
      data: {
        fondo_acumulado: { increment: interesToAccumulate },
      },
    });

    // Update the installment with the new payment amount
    const newMontoPagado = installment.monto_pagado + monto;
    const newStatus = newMontoPagado >= installment.monto_expected ? 'pagado' : 'parcial';

    const updatedInstallment = await prisma.installment.update({
      where: { id: installmentId },
      data: {
        monto_pagado: newMontoPagado,
        status: newStatus,
      },
    });

    res.json({ payment, updatedInstallment });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Error confirming payment' });
  }
});


// Upload a payment receipt and confirm automatically (for collector/admin)
router.post('/payments/upload-and-confirm', authenticateToken, upload.single('comprobante'), async (req: AuthRequest, res) => {
  if (req.userRole !== 'cobrador' && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only cobrador or admin can upload and confirm payments.' });
  }

  let { installmentId: rawInstallmentId, userId: rawDebtorId, monto, comentario } = req.body;
  const comprobante_url = req.file ? `/uploads/photos/${req.file.filename}` : undefined;

  const installmentId = Number(rawInstallmentId);
  const debtorId = Number(rawDebtorId);
  const collectorId = req.userId; // Get the collector's ID from the authenticated token

  if (isNaN(debtorId) || isNaN(installmentId) || monto === undefined || !collectorId) {
    return res.status(400).json({ error: 'Debtor ID, Installment ID, Monto, Comprobante, and a valid collector token are required.' });
  }

  try {
    // Step 1: Create the payment (similar to /payments/upload but with confirmation)
    const payment = await prisma.payment.create({
      data: {
        installment: { connect: { id: installmentId } },
        user: { connect: { id: debtorId } },
        monto: parseFloat(monto),
        comprobante_url,
        comentario,
        confirmado: true, // Auto-confirm
        confirmado_por: collectorId,
      },
    });

    // Step 2: Update the installment and user's accumulated fund (similar to /payments/confirm)
    const installment = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: { loan: true },
    });

    if (!installment) {
      return res.status(404).json({ error: 'Installment not found after payment creation.' });
    }

    const montoNum = parseFloat(monto);

    // Calculate interest portion for accumulated fund
    const totalInteresLoan = installment.loan.total_a_devolver - installment.loan.monto_principal;
    const proportionInteresInPayment = totalInteresLoan / installment.loan.total_a_devolver;
    const interesToAccumulate = montoNum * proportionInteresInPayment;

    // Update the user's accumulated fund
    await prisma.user.update({
      where: { id: installment.loan.userId },
      data: {
        fondo_acumulado: { increment: interesToAccumulate },
      },
    });

    // Update the installment with the new payment amount
    const newMontoPagado = installment.monto_pagado + montoNum;
    const newStatus = newMontoPagado >= installment.monto_expected ? 'pagado' : 'parcial';

    const updatedInstallment = await prisma.installment.update({
      where: { id: installmentId },
      data: {
        monto_pagado: newMontoPagado,
        status: newStatus,
      },
    });

    res.json({ payment, updatedInstallment });
  } catch (error: any) {
    console.error('Error uploading and confirming payment:', error);
    res.status(500).json({ error: 'Error uploading and confirming payment', details: error.message });
  }
});

export default router;
