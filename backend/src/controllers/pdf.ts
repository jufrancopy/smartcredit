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
    
    // Header moderno con fondo gris
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SmartCredit', 20, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Detalle de Prestamo', 20, 18);
    
    // Información del cliente en caja
    doc.setFillColor(250, 250, 250);
    doc.rect(15, 30, 180, 20, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, 30, 180, 20, 'S');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE', 20, 37);
    doc.setFont('helvetica', 'normal');
    doc.text(`${loan.user.nombre} ${loan.user.apellido}`, 20, 43);
    doc.text(`Fecha: ${loan.fecha_otorgado ? new Date(loan.fecha_otorgado).toLocaleDateString('es-PY') : 'N/A'}`, 120, 43);
    
    // Resumen en tarjetas
    const cardY = 55;
    const cardWidth = 42;
    const cardHeight = 18;
    
    // Tarjeta 1: Principal
    doc.setFillColor(230, 245, 255);
    doc.rect(15, cardY, cardWidth, cardHeight, 'F');
    doc.rect(15, cardY, cardWidth, cardHeight, 'S');
    doc.setFontSize(7);
    doc.text('PRINCIPAL', 17, cardY + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`${loan.monto_principal.toLocaleString('es-PY')}`, 17, cardY + 12);
    
    // Tarjeta 2: Diario (calculado desde installments si monto_diario es 0)
    const montoDiarioReal = loan.monto_diario || (loan.installments.length > 0 ? loan.installments[0].monto_expected : 0);
    doc.setFillColor(255, 245, 230);
    doc.rect(60, cardY, cardWidth, cardHeight, 'F');
    doc.rect(60, cardY, cardWidth, cardHeight, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('DIARIO', 62, cardY + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`${montoDiarioReal.toLocaleString('es-PY')}`, 62, cardY + 12);
    
    // Tarjeta 3: Pagadas
    doc.setFillColor(230, 255, 230);
    doc.rect(105, cardY, cardWidth, cardHeight, 'F');
    doc.rect(105, cardY, cardWidth, cardHeight, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('PAGADAS', 107, cardY + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${cuotasPagadas}`, 107, cardY + 12);
    
    // Tarjeta 4: Saldo
    doc.setFillColor(255, 230, 230);
    doc.rect(150, cardY, cardWidth, cardHeight, 'F');
    doc.rect(150, cardY, cardWidth, cardHeight, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('SALDO', 152, cardY + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`${montoPendiente.toLocaleString('es-PY')}`, 152, cardY + 12);
    
    // Tabla moderna
    let yPos = 80;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Cronograma de Pagos', 20, yPos);

    yPos += 8;
    // Header de tabla con fondo
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPos - 3, 180, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('#', 20, yPos);
    doc.text('Fecha', 35, yPos);
    doc.text('Esperado', 70, yPos);
    doc.text('Pagado', 110, yPos);
    doc.text('Estado', 150, yPos);
    
    doc.setFont('helvetica', 'normal');
    
    // Mostrar cuotas con colores alternados
    const maxCuotas = Math.min(loan.installments.length, 28);
    
    for (let i = 0; i < maxCuotas; i++) {
      const installment = loan.installments[i];
      yPos += 6;
      
      // Fila alternada
      if (i % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(15, yPos - 3, 180, 6, 'F');
      }
      
      const fecha = new Date(installment.fecha).toLocaleDateString('es-PY');
      const esperado = installment.monto_expected.toLocaleString('es-PY');
      const pagado = installment.monto_pagado.toLocaleString('es-PY');
      
      let status = 'Pendiente';
      if (installment.monto_pagado >= installment.monto_expected) {
        status = 'OK';
      } else if (new Date(installment.fecha) < new Date()) {
        status = 'Vencido';
      }
      
      doc.setFontSize(7);
      doc.text(`${i + 1}`, 20, yPos);
      doc.text(fecha, 35, yPos);
      doc.text(esperado, 70, yPos);
      doc.text(pagado, 110, yPos);
      doc.text(status, 150, yPos);
    }
    
    // Nota si hay más cuotas
    if (loan.installments.length > 28) {
      yPos += 8;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text(`+ ${loan.installments.length - 28} cuotas adicionales`, 20, yPos);
    }
    
    // Footer moderno
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(240, 240, 240);
    doc.rect(0, pageHeight - 15, 210, 15, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('SmartCredit', 20, pageHeight - 8);
    doc.text(`${new Date().toLocaleDateString('es-PY')}`, 170, pageHeight - 8);
    
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