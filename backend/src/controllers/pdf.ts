import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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

    // Generar HTML para el PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: Arial, sans-serif; 
                line-height: 1.4; 
                color: #333;
                padding: 20px;
                background: #fff;
            }
            .container { 
                max-width: 800px; 
                margin: 0 auto; 
            }
            .header { 
                text-align: center;
                margin-bottom: 15px;
                padding-bottom: 8px;
                border-bottom: 1px solid #333;
            }
            .header h1 { 
                font-size: 18px; 
                margin-bottom: 2px;
            }
            .header p { 
                font-size: 12px; 
                color: #666;
            }
            .info-line {
                display: flex;
                justify-content: space-between;
                padding: 3px 0;
                font-size: 11px;
                border-bottom: 1px solid #eee;
            }
            .info-line:last-child {
                border-bottom: none;
            }
            .info-container {
                margin-bottom: 10px;
                padding: 8px;
                background: #f9f9f9;
            }
            .table-container {
                margin-top: 10px;
            }
            .installments-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }
            .installments-table th {
                background: #f1f3f4;
                padding: 10px 8px;
                text-align: left;
                font-weight: bold;
                border: 1px solid #ddd;
            }
            .installments-table td {
                padding: 8px;
                border: 1px solid #ddd;
            }
            .installments-table tr:nth-child(even) {
                background: #f9f9f9;
            }
            .status-paid {
                color: #28a745;
                font-weight: bold;
            }
            .status-pending {
                color: #6c757d;
            }
            .status-overdue {
                color: #dc3545;
                font-weight: bold;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 11px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 15px;
            }
            .amount {
                text-align: right;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Detalle de Préstamo</h1>
                <p>SmartCredit</p>
            </div>
            
            <div class="info-container">
                <div class="info-line">
                    <span><strong>Cliente:</strong> ${loan.user.nombre} ${loan.user.apellido}</span>
                    <span><strong>Fecha:</strong> ${loan.fecha_otorgado ? new Date(loan.fecha_otorgado).toLocaleDateString('es-PY') : 'N/A'}</span>
                </div>
                <div class="info-line">
                    <span><strong>Principal:</strong> ${loan.monto_principal.toLocaleString('es-PY')} Gs</span>
                    <span><strong>Diario:</strong> ${loan.monto_diario.toLocaleString('es-PY')} Gs</span>
                </div>
                <div class="info-line">
                    <span><strong>Pagadas:</strong> ${cuotasPagadas} | <strong>Pendientes:</strong> ${cuotasPendientes}</span>
                    <span><strong>Saldo:</strong> ${montoPendiente.toLocaleString('es-PY')} Gs</span>
                </div>
            </div>

            <div class="table-container">
                <div class="info-title">Cronograma de Pagos</div>
                <table class="installments-table">
                    <thead>
                        <tr>
                            <th>Cuota</th>
                            <th>Fecha</th>
                            <th>Monto Esperado</th>
                            <th>Monto Pagado</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${loan.installments.map((installment, index) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const instDate = new Date(installment.fecha);
                            instDate.setHours(0, 0, 0, 0);
                            
                            let statusClass = 'status-pending';
                            let statusText = 'Pendiente';
                            
                            if (installment.monto_pagado >= installment.monto_expected) {
                                statusClass = 'status-paid';
                                statusText = 'Pagado';
                            } else if (instDate < today) {
                                statusClass = 'status-overdue';
                                statusText = 'Vencido';
                            }
                            
                            return `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${instDate.toLocaleDateString('es-PY')}</td>
                                    <td class="amount">${installment.monto_expected.toLocaleString('es-PY')} Gs</td>
                                    <td class="amount">${installment.monto_pagado.toLocaleString('es-PY')} Gs</td>
                                    <td class="${statusClass}">${statusText}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div class="footer">
                <p>SmartCredit - Sistema de Gestión de Préstamos</p>
                <p>Generado el: ${new Date().toLocaleDateString('es-PY', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
            </div>
        </div>
    </body>
    </html>
    `;

    // Enviar HTML para que el navegador lo convierta a PDF
    const fileName = `prestamo_${loan.user.nombre}_${loan.user.apellido}_${new Date().toISOString().split('T')[0]}.html`;
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    res.send(htmlContent);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
};