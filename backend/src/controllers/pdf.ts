import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { jsPDF } from 'jspdf';

const prisma = new PrismaClient();

export const generateLoanDetailPDF = async (req: Request, res: Response) => {
  try {
    const { loanId } = req.params;

    // Obtener datos del préstamo con todas las relaciones necesarias
    const loan = await prisma.loan.findUnique({
      where: { id: parseInt(loanId) },
      include: {
        user: true,
        installments: {
          include: {
            payments: true
          },
          orderBy: { fecha: 'asc' }
        }
      }
    });

    if (!loan) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }

    // Calcular estadísticas
    const totalCuotas = loan.installments.length;
    const cuotasPagadas = loan.installments.filter(inst => 
      inst.monto_pagado >= inst.monto_expected
    ).length;
    const cuotasPendientes = totalCuotas - cuotasPagadas;
    const montoTotalPagado = loan.installments.reduce((sum, inst) => sum + inst.monto_pagado, 0);
    const montoPendiente = loan.total_a_devolver - montoTotalPagado;

    // Generar PDF con jsPDF
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('SmartCredit - Detalle de Préstamo', 20, 20);
    
    // Cliente
    doc.setFontSize(12);
    doc.text(`Cliente: ${loan.user.nombre} ${loan.user.apellido}`, 20, 40);
    doc.text(`Fecha: ${loan.fecha_otorgado ? new Date(loan.fecha_otorgado).toLocaleDateString('es-PY') : 'N/A'}`, 20, 50);
    
    // Detalles del préstamo
    doc.text(`Monto Principal: ${loan.monto_principal.toLocaleString('es-PY')} Gs`, 20, 70);
    doc.text(`Monto Diario: ${loan.monto_diario.toLocaleString('es-PY')} Gs`, 20, 80);
    doc.text(`Cuotas Pagadas: ${cuotasPagadas} | Pendientes: ${cuotasPendientes}`, 20, 90);
    doc.text(`Saldo Pendiente: ${montoPendiente.toLocaleString('es-PY')} Gs`, 20, 100);
    
    // Tabla de cuotas (simplificada)
    let yPos = 120;
    doc.text('Cuota | Fecha | Esperado | Pagado | Estado', 20, yPos);
    
    loan.installments.slice(0, 20).forEach((installment, index) => {
      yPos += 10;
      const fecha = new Date(installment.fecha).toLocaleDateString('es-PY');
      const esperado = installment.monto_expected.toLocaleString('es-PY');
      const pagado = installment.monto_pagado.toLocaleString('es-PY');
      
      let status = 'Pendiente';
      if (installment.monto_pagado >= installment.monto_expected) {
        status = 'Pagado';
      } else if (new Date(installment.fecha) < new Date()) {
        status = 'Vencido';
      }
      
      const line = `${index + 1} | ${fecha} | ${esperado} | ${pagado} | ${status}`;
      doc.text(line, 20, yPos);
      
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    const fileName = `prestamo_${loan.user.nombre}_${loan.user.apellido}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
};