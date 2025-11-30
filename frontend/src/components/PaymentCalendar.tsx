import React from 'react';

// Define a standalone interface for Installment to be used across components
export type InstallmentStatus = 'pagado' | 'vencido' | 'pendiente' | 'futuro' | 'parcial';

export interface Installment {
  id: string;
  loanId: string;
  fecha: string;
  status: InstallmentStatus;
  monto_expected: number;
  monto_pagado: number;
  payments: Array<{ confirmado: boolean }>;
  hasUnconfirmedPayment?: boolean;
}

interface PaymentCalendarProps {
  installments: Installment[];
  onOpenConfirmPaymentModal?: (paymentId: number, installmentId: number, monto: number, comprobante_url: string | undefined, debtorName: string) => void;
  // New prop for client to upload receipt
  onUploadReceipt?: (installmentId: number, expectedMonto: number, debtorId?: number, debtorName?: string) => void; 
  showUploadButton?: boolean;
}

const PaymentCalendar: React.FC<PaymentCalendarProps> = ({ installments, onOpenConfirmPaymentModal, onUploadReceipt, showUploadButton }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pagado': return 'bg-emerald-500';
      case 'vencido': return 'bg-red-500';
      case 'pendiente': return 'bg-yellow-500';
      case 'futuro': return 'bg-slate-300';
      case 'parcial': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pagado': return 'Pagado';
      case 'vencido': return 'Vencido';
      case 'pendiente': return 'Pendiente Hoy';
      case 'futuro': return 'Pendiente';
      case 'parcial': return 'Pago Parcial';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pagado': return '✓';
      case 'vencido': return '⚠';
      case 'pendiente': return '!';
      case 'futuro': return '○';
      case 'parcial': return '◎';
      default: return '○';
    }
  };

  return (
    <div className="space-y-2">
      {installments.map((inst) => (
        <div key={inst.id} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors">
          <div className={`w-8 h-8 rounded-full ${getStatusColor(inst.status)} flex items-center justify-center text-white font-bold text-sm`}>
            {getStatusIcon(inst.status)}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">
                {new Date(inst.fecha).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' })}
                {inst.hasUnconfirmedPayment && (
                  <span className="ml-2 text-xs font-semibold text-orange-500"> (Pendiente Confirmación)</span>
                )}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {inst.monto_expected.toLocaleString('es-PY')} Gs
              </span>
            </div>
            <span className={`text-xs ${
              inst.status === 'pagado' ? 'text-emerald-600' : 
              inst.status === 'vencido' ? 'text-red-600' : 
              inst.status === 'parcial' ? 'text-orange-600' :
              'text-slate-500'
            }`}>
              {getStatusText(inst.status)}
            </span>
          </div>
          {/* Button for Collector to confirm a payment */}
          {onOpenConfirmPaymentModal && inst.hasUnconfirmedPayment && inst.payments.filter(p => !p.confirmado).map(payment => (
            <button
              key={payment.id}
              onClick={() => onOpenConfirmPaymentModal(payment.id, parseInt(inst.id, 10), payment.monto, payment.comprobante_url, inst.debtorName)}
              className="ml-4 px-3 py-1 bg-green-500 text-white rounded-md text-xs hover:bg-green-600 transition-colors"
            >
              Confirmar Pago
            </button>
          ))}
          {/* Button for Client/Collector to upload a receipt */}
          {showUploadButton && onUploadReceipt && inst.status !== 'pagado' && !inst.hasUnconfirmedPayment && (
            <button
              onClick={() => {
                // @ts-ignore: `debtorId` and `debtorName` are only available when called from CollectorDashboard
                onUploadReceipt(parseInt(inst.id, 10), inst.monto_expected, inst.debtorId, inst.debtorName);
              }}
              className="ml-4 px-3 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600 transition-colors"
            >
              Subir Comprobante
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default PaymentCalendar;
