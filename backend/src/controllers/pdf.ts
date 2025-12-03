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
    
    // Header con fondo azul
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('💳 SmartCredit', 20, 15);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Detalle de Préstamo', 20, 25);
    
    // Reset color
    doc.setTextColor(0, 0, 0);
    
    // Información del cliente en caja
    doc.setFillColor(248, 249, 250);
    doc.rect(15, 45, 180, 25, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, 45, 180, 25, 'S');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('👤 INFORMACIÓN DEL CLIENTE', 20, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${loan.user.nombre} ${loan.user.apellido}`, 20, 62);
    doc.text(`Fecha Otorgamiento: ${loan.fecha_otorgado ? new Date(loan.fecha_otorgado).toLocaleDateString('es-PY') : 'N/A'}`, 110, 62);
    
    // Detalles del préstamo en grid
    const startY = 80;
    doc.setFillColor(240, 248, 255);
    doc.rect(15, startY, 180, 35, 'F');
    doc.rect(15, startY, 180, 35, 'S');
    
    doc.setFont('helvetica', 'bold');
    doc.text('💰 DETALLES DEL PRÉSTAMO', 20, startY + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Principal: ${loan.monto_principal.toLocaleString('es-PY')} Gs`, 20, startY + 20);
    doc.text(`Diario: ${loan.monto_diario.toLocaleString('es-PY')} Gs`, 110, startY + 20);
    doc.text(`Pagadas: ${cuotasPagadas}`, 20, startY + 28);
    doc.text(`Pendientes: ${cuotasPendientes}`, 70, startY + 28);
    doc.text(`Saldo: ${montoPendiente.toLocaleString('es-PY')} Gs`, 120, startY + 28);
    
    // Tabla de cuotas con headers
    let yPos = 130;
    doc.setFont('helvetica', 'bold');
    doc.text('📋 CRONOGRAMA DE PAGOS', 20, yPos);
    
    yPos += 10;
    // Header de tabla
    doc.setFillColor(102, 126, 234);
    doc.rect(15, yPos - 5, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('#', 20, yPos);
    doc.text('Fecha', 35, yPos);
    doc.text('Esperado', 70, yPos);
    doc.text('Pagado', 110, yPos);
    doc.text('Estado', 150, yPos);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    loan.installments.forEach((installment, index) => {
      yPos += 8;
      
      // Alternar colores de fila
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, yPos - 5, 180, 8, 'F');
      }
      
      const fecha = new Date(installment.fecha).toLocaleDateString('es-PY');
      const esperado = installment.monto_expected.toLocaleString('es-PY');
      const pagado = installment.monto_pagado.toLocaleString('es-PY');
      
      let status = 'Pendiente';
      let statusColor = [108, 117, 125]; // Gris
      if (installment.monto_pagado >= installment.monto_expected) {
        status = '✅ Pagado';
        statusColor = [40, 167, 69]; // Verde
      } else if (new Date(installment.fecha) < new Date()) {
        status = '⚠️ Vencido';
        statusColor = [220, 53, 69]; // Rojo
      }
      
      doc.text(`${index + 1}`, 20, yPos);
      doc.text(fecha, 35, yPos);
      doc.text(`${esperado} Gs`, 70, yPos);
      doc.text(`${pagado} Gs`, 110, yPos);
      
      // Estado con color
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(status, 150, yPos);
      doc.setTextColor(0, 0, 0);
      
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(248, 249, 250);
    doc.rect(0, pageHeight - 20, 210, 20, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('SmartCredit - Sistema de Gestión de Préstamos', 20, pageHeight - 12);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-PY')} ${new Date().toLocaleTimeString('es-PY')}`, 20, pageHeight - 6);
    
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