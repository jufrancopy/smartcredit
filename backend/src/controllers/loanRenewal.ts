import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendLoanApprovalEmail } from '../utils/emailService';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

// Verificar si un cliente es elegible para renovación
export const checkRenewalEligibility = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const clientId = parseInt(userId);

    // Obtener préstamos activos del cliente
    const activeLoans = await prisma.loan.findMany({
      where: { 
        userId: clientId, 
        estado: 'activo' 
      },
      include: {
        installments: true,
        user: true
      }
    });

    const eligibleLoans = activeLoans.filter(loan => {
      const totalInstallments = loan.installments.length;
      const paidInstallments = loan.installments.filter(inst => inst.monto_pagado >= inst.monto_expected).length;
      const remainingInstallments = totalInstallments - paidInstallments;
      
      // Calcular porcentaje pagado del capital principal
      const totalPaid = loan.installments.reduce((sum, inst) => sum + inst.monto_pagado, 0);
      const percentageOfPrincipal = totalPaid / loan.monto_principal;
      
      // Elegible si ha pagado 90% del capital principal O queda 1 cuota
      const eligible = percentageOfPrincipal >= 0.9 || remainingInstallments <= 1;
      
      return eligible;
    });

    if (eligibleLoans.length === 0) {
      return res.json({ 
        eligible: false, 
        message: 'Cliente no elegible. Necesita: 90% del capital principal pagado O 1 cuota restante' 
      });
    }

    // Calcular deuda pendiente total
    const totalPendingDebt = eligibleLoans.reduce((sum, loan) => {
      const totalPaid = loan.installments.reduce((paidSum, inst) => paidSum + inst.monto_pagado, 0);
      return sum + (loan.total_a_devolver - totalPaid);
    }, 0);

    res.json({
      eligible: true,
      eligibleLoans: eligibleLoans.map(loan => ({
        id: loan.id,
        monto_principal: loan.monto_principal,
        total_a_devolver: loan.total_a_devolver,
        pendingDebt: loan.total_a_devolver - loan.installments.reduce((sum, inst) => sum + inst.monto_pagado, 0)
      })),
      totalPendingDebt,
      clientName: `${eligibleLoans[0].user.nombre} ${eligibleLoans[0].user.apellido}`
    });
  } catch (error) {
    console.error('Error checking renewal eligibility:', error);
    res.status(500).json({ error: 'Error al verificar elegibilidad' });
  }
};

// Crear préstamo de renovación
export const createRenewalLoan = async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden crear renovaciones' });
    }

    const { 
      userId, 
      nuevoMontoPrincipal, 
      interesTotalPercent, 
      plazoDias, 
      fechaInicioCobro,
      loanIdsToClose 
    } = req.body;

    const clientId = parseInt(userId);

    // Verificar préstamos a cerrar
    const loansToClose = await prisma.loan.findMany({
      where: { 
        id: { in: loanIdsToClose },
        userId: clientId,
        estado: 'activo'
      },
      include: { installments: true }
    });

    // Calcular deuda pendiente total
    const totalPendingDebt = loansToClose.reduce((sum, loan) => {
      const totalPaid = loan.installments.reduce((paidSum, inst) => paidSum + inst.monto_pagado, 0);
      return sum + (loan.total_a_devolver - totalPaid);
    }, 0);

    // Validar que el nuevo monto cubra la deuda pendiente
    if (nuevoMontoPrincipal <= totalPendingDebt) {
      return res.status(400).json({ 
        error: `El nuevo monto (${nuevoMontoPrincipal.toLocaleString()}) debe ser mayor a la deuda pendiente (${totalPendingDebt.toLocaleString()})` 
      });
    }

    const totalADevolver = nuevoMontoPrincipal * (1 + interesTotalPercent / 100);
    const montoDiario = totalADevolver / plazoDias;

    await prisma.$transaction(async (tx) => {
      // 1. Crear el nuevo préstamo
      const newLoan = await tx.loan.create({
        data: {
          userId: clientId,
          monto_principal: nuevoMontoPrincipal,
          interes_total_percent: interesTotalPercent,
          total_a_devolver: totalADevolver,
          plazo_dias: plazoDias,
          monto_diario: montoDiario,
          fecha_otorgado: new Date(),
          fecha_inicio_cobro: new Date(fechaInicioCobro),
          estado: 'activo'
        }
      });

      // 2. Generar cuotas para el nuevo préstamo
      const installments = [];
      const startDate = new Date(fechaInicioCobro);
      
      for (let i = 0; i < plazoDias; i++) {
        const installmentDate = new Date(startDate);
        installmentDate.setDate(startDate.getDate() + i);
        
        installments.push({
          loanId: newLoan.id,
          fecha: installmentDate,
          monto_expected: montoDiario,
          monto_pagado: 0,
          status: 'pendiente' as const
        });
      }

      await tx.installment.createMany({ data: installments });

      // 3. Cerrar préstamos anteriores y marcar como pagados
      for (const loan of loansToClose) {
        await tx.loan.update({
          where: { id: loan.id },
          data: { estado: 'finiquitado' }
        });

        // Marcar todas las cuotas pendientes como pagadas
        const pendingInstallments = await tx.installment.findMany({
          where: { 
            loanId: loan.id,
            status: { not: 'pagado' }
          }
        });
        
        for (const installment of pendingInstallments) {
          await tx.installment.update({
            where: { id: installment.id },
            data: { 
              monto_pagado: installment.monto_expected,
              status: 'pagado'
            }
          });
        }
      }

      return newLoan;
    });

    // Enviar email de confirmación
    try {
      const client = await prisma.user.findUnique({ where: { id: clientId } });
      if (client?.email) {
        await sendLoanApprovalEmail({
          email: client.email,
          nombre: client.nombre,
          monto_principal: nuevoMontoPrincipal,
          total_a_devolver: totalADevolver,
          plazo_dias: plazoDias,
          monto_diario: montoDiario,
          fecha_inicio_cobro: fechaInicioCobro
        });
      }
    } catch (emailError) {
      console.error('Error sending renewal email:', emailError);
    }

    res.json({ 
      message: 'Préstamo renovado exitosamente',
      montoEfectivoEntregado: nuevoMontoPrincipal - totalPendingDebt,
      deudaPagada: totalPendingDebt
    });
  } catch (error) {
    console.error('Error creating renewal loan:', error);
    res.status(500).json({ error: 'Error al crear renovación' });
  }
};