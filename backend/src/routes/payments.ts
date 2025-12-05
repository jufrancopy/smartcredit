import { Request, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { sendEmail, sendPaymentReceivedEmail, sendPaymentConfirmedEmail } from '../utils/emailService';
import multer from 'multer';
import path from 'path';
import { getAllPayments } from '../controllers/payments';

const router = Router();
const prisma = new PrismaClient();

router.get('/payments', authenticateToken, getAllPayments);

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', '..', 'uploads', 'photos'));
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

    try {
      // Notify the client about payment reception
      const clientUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, nombre: true } });
      if (clientUser && clientUser.email) {
        await sendPaymentReceivedEmail({
          email: clientUser.email,
          nombre: clientUser.nombre,
          monto: parseFloat(monto),
          installmentId
        });
      }

      // Notify the cobrador about a new payment
      const installmentWithLoan = await prisma.installment.findUnique({
        where: { id: installmentId },
        include: { loan: { select: { userId: true } } } // Get the loan userId
      });
      if (installmentWithLoan && installmentWithLoan.loan) {
        const cobradorForLoan = await prisma.user.findFirst({
          where: {
            role: 'cobrador',
            loans: {
              some: {
                id: installmentWithLoan.loanId
              }
            }
          },
          select: { email: true, nombre: true }
        });

        if (cobradorForLoan && cobradorForLoan.email) {
          const cobradorSubject = '¡Nuevo Pago Recibido!';
          const cobradorHtml = `
            <p>Hola ${cobradorForLoan.nombre},</p>
            <p>Se ha subido un nuevo pago de <b>$${monto}</b> para la cuota ID ${installmentId} (cliente ID ${userId}).</p>
            <p>Por favor, revisa el comprobante y confirma el pago en tu panel.</p>
            <p>Gracias,</p>
            <p>El equipo de AhorraConmigo</p>
          `;
          await sendEmail({ to: cobradorForLoan.email, subject: cobradorSubject, html: cobradorHtml });
        } else {
          console.warn(`No cobrador found or email for loan ${installmentWithLoan.loanId} to notify.`);
        }
      }

    } catch (emailError) {
      console.error('Error sending payment upload notification emails:', emailError);
    }
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

    try {
      // Notify the client about payment confirmation
      const clientUser = await prisma.user.findUnique({ where: { id: installment.loan.userId }, select: { email: true, nombre: true } });
      if (clientUser && clientUser.email) {
        // Calcular el número real de cuota
        const allInstallments = await prisma.installment.findMany({
          where: { loanId: installment.loanId },
          orderBy: { fecha: 'asc' }
        });
        const installmentNumber = allInstallments.findIndex(inst => inst.id === installmentId) + 1;
        
        await sendPaymentConfirmedEmail({
          email: clientUser.email,
          nombre: clientUser.nombre,
          monto,
          installmentNumber
        });
      }
    } catch (emailError) {
      console.error('Error sending payment confirmation email:', emailError);
    }
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

    try {
      // Notify the client about payment confirmation
      const clientUser = await prisma.user.findUnique({ where: { id: installment.loan.userId }, select: { email: true, nombre: true } });
      if (clientUser && clientUser.email) {
        // Calcular el número real de cuota
        const allInstallments = await prisma.installment.findMany({
          where: { loanId: installment.loanId },
          orderBy: { fecha: 'asc' }
        });
        const installmentNumber = allInstallments.findIndex(inst => inst.id === installmentId) + 1;
        
        await sendPaymentConfirmedEmail({
          email: clientUser.email,
          nombre: clientUser.nombre,
          monto: montoNum,
          installmentNumber
        });
      }
    } catch (emailError) {
      console.error('Error sending payment confirmation email (upload-and-confirm):', emailError);
    }
  } catch (error: any) {
    console.error('Error uploading and confirming payment:', error);
    res.status(500).json({ error: 'Error uploading and confirming payment', details: error.message });
  }
});

// Update a payment receipt
router.put('/payments/:id/update-receipt', authenticateToken, upload.single('comprobante'), async (req: AuthRequest, res) => {
  if (req.userRole !== 'cobrador' && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only cobrador or admin can update payment receipts.' });
  }

  const paymentId = Number(req.params.id);
  const { monto, comentario } = req.body;
  const comprobante_url = req.file ? `/uploads/photos/${req.file.filename}` : undefined;

  if (isNaN(paymentId)) {
    return res.status(400).json({ error: 'Invalid payment ID.' });
  }

  try {
    // Find the existing payment
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { installment: { include: { loan: true } } }
    });

    if (!existingPayment) {
      return res.status(404).json({ error: 'Payment not found.' });
    }

    // Prepare update data
    const updateData: any = {};
    if (monto !== undefined) updateData.monto = parseFloat(monto);
    if (comentario !== undefined) updateData.comentario = comentario;
    if (comprobante_url) updateData.comprobante_url = comprobante_url;

    // Update the payment
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
    });

    // If monto changed and payment is confirmed, update installment
    if (monto !== undefined && existingPayment.confirmado) {
      const oldMonto = existingPayment.monto;
      const newMonto = parseFloat(monto);
      const montoDifference = newMonto - oldMonto;

      // Update installment monto_pagado
      const installment = existingPayment.installment;
      const newMontoPagado = installment.monto_pagado + montoDifference;
      const newStatus = newMontoPagado >= installment.monto_expected ? 'pagado' : 'parcial';

      await prisma.installment.update({
        where: { id: installment.id },
        data: {
          monto_pagado: newMontoPagado,
          status: newStatus,
        },
      });

      // Update user's accumulated fund if needed
      if (montoDifference !== 0) {
        const totalInteresLoan = installment.loan.total_a_devolver - installment.loan.monto_principal;
        const proportionInteresInPayment = totalInteresLoan / installment.loan.total_a_devolver;
        const interestDifference = montoDifference * proportionInteresInPayment;

        await prisma.user.update({
          where: { id: installment.loan.userId },
          data: {
            fondo_acumulado: { increment: interestDifference },
          },
        });
      }
    }

    res.json(updatedPayment);
  } catch (error: any) {
    console.error('Error updating payment receipt:', error);
    res.status(500).json({ error: 'Error updating payment receipt', details: error.message });
  }
});

// Delete a payment
router.delete('/payments/:id', authenticateToken, async (req: AuthRequest, res) => {
  if (req.userRole !== 'cobrador' && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only cobrador or admin can delete payments.' });
  }

  const paymentId = Number(req.params.id);

  if (isNaN(paymentId)) {
    return res.status(400).json({ error: 'Invalid payment ID.' });
  }

  try {
    // Find the existing payment with related data
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { installment: { include: { loan: true } } }
    });

    if (!existingPayment) {
      return res.status(404).json({ error: 'Payment not found.' });
    }

    const paymentMonto = existingPayment.monto;
    const installment = existingPayment.installment;

    // Delete the payment
    await prisma.payment.delete({
      where: { id: paymentId }
    });

    // If payment was confirmed, update installment and user's accumulated fund
    if (existingPayment.confirmado) {
      // Update installment monto_pagado
      const newMontoPagado = Math.max(0, installment.monto_pagado - paymentMonto);
      const newStatus = newMontoPagado >= installment.monto_expected ? 'pagado' : 
                       newMontoPagado > 0 ? 'parcial' : 'pendiente';

      await prisma.installment.update({
        where: { id: installment.id },
        data: {
          monto_pagado: newMontoPagado,
          status: newStatus,
        },
      });

      // Update user's accumulated fund (subtract the interest portion)
      const totalInteresLoan = installment.loan.total_a_devolver - installment.loan.monto_principal;
      const proportionInteresInPayment = totalInteresLoan / installment.loan.total_a_devolver;
      const interestToSubtract = paymentMonto * proportionInteresInPayment;

      await prisma.user.update({
        where: { id: installment.loan.userId },
        data: {
          fondo_acumulado: { decrement: interestToSubtract },
        },
      });
    }

    res.json({ message: 'Payment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Error deleting payment', details: error.message });
  }
});

export default router;
