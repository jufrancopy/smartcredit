import React, { useState, useEffect } from 'react';
import Modal from './Modal';

// Interfaz para el calendario de pagos elegante
export interface ElegantPaymentCalendarProps {
  installments: InstallmentForCollector[];
  onOpenConfirmPaymentModal: (paymentId: number, installmentId: number, monto: number, comprobante_url: string | undefined, debtorName: string) => void;
  onUploadReceipt: (installmentId: number, expectedMonto: number, debtorId: number, debtorName: string) => void;
  showUploadButton: boolean;
  onOpenReceiptsModal: (installment: InstallmentForCollector) => void;
}

export type InstallmentStatus = 'pagado' | 'vencido' | 'parcial' | 'futuro';

export interface Installment {
  id: number;
  loanId: number;
  installmentNumber: number;
  monto_expected: number;
  monto_pagado: number;
  fecha: string;
  confirmado: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentForCollector extends Installment {
  status: InstallmentStatus;
  hasUnconfirmedPayment: boolean;
  debtorId: number;
  debtorName: string;
  payments?: any[]; // Añadido para acceder a los pagos
}

// Componente de calendario elegante con más energía
const ElegantPaymentCalendar: React.FC<ElegantPaymentCalendarProps> = ({
  installments,
  onOpenConfirmPaymentModal,
  onUploadReceipt,
  showUploadButton,
  onOpenReceiptsModal
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetails, setShowDayDetails] = useState(false);

  // Navegación entre meses
  const changeMonth = (direction: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  // Obtener días del mes actual
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();

    const days = [];
    // Rellenar días vacíos al principio
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Agregar días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Dividir en semanas
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return weeks;
  };

  // Obtener cuotas para una fecha específica
  const getInstallmentsForDate = (date: Date) => {
    return installments.filter(installment => {
      const installmentDate = new Date(installment.fecha);
      return installmentDate.getDate() === date.getDate() &&
             installmentDate.getMonth() === date.getMonth() &&
             installmentDate.getFullYear() === date.getFullYear();
    });
  };

  // Determinar color para un día según estado de cuotas (más energético)
  const getStatusColorForDay = (date: Date) => {
    const dayInstallments = getInstallmentsForDate(date);
    if (dayInstallments.length === 0) return null;

    // Prioridad: vencido > no confirmado > parcial > futuro > pagado
    if (dayInstallments.some(inst => inst.status === 'vencido')) return 'bg-red-500 animate-pulse';
    if (dayInstallments.some(inst => inst.hasUnconfirmedPayment)) return 'bg-yellow-500';
    if (dayInstallments.some(inst => inst.status === 'parcial')) return 'bg-blue-500';
    if (dayInstallments.some(inst => inst.status === 'futuro')) return 'bg-gray-400';
    return 'bg-green-500'; // pagado
  };

  const weeks = getDaysInMonth();

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayDetails(true);
  };

  const handleCloseDayDetails = () => {
    setShowDayDetails(false);
    setSelectedDate(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-slate-800">
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={() => changeMonth(1)}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.map((week, weekIndex) => (
          week.map((day, dayIndex) => (
            <div
              key={`${weekIndex}-${dayIndex}`}
              className={`h-14 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                day ? 'hover:bg-slate-50' : ''
              }`}
              onClick={() => day && handleDayClick(day)}
            >
              {day ? (
                <>
                  <span className={`text-sm font-bold ${day.getMonth() !== currentMonth.getMonth() ? 'text-slate-300' : 'text-slate-700'}`}>
                    {day.getDate()}
                  </span>
                  {getStatusColorForDay(day) && (
                    <div className={`w-3 h-3 rounded-full ${getStatusColorForDay(day)} shadow-md`}></div>
                  )}
                </>
              ) : null}
            </div>
          ))
        ))}
      </div>

      {/* Botón para ver todas las cuotas */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={onShowAllInstallments} // Use prop
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          Ver Todas las Cuotas
        </button>
      </div>

      {/* Modal para detalles del día */}
      <Modal
        isOpen={showDayDetails && selectedDate !== null}
        onClose={handleCloseDayDetails}
        title={selectedDate?.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) || ''}
        size="md"
      >
        <div className="space-y-4">
          {selectedDate && getInstallmentsForDate(selectedDate).map(installment => (
            <div key={installment.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all transform hover:scale-[1.02]">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-slate-800">Cuota #{installment.installmentNumber}</h4>
                  <p className="text-sm text-slate-600">{installment.debtorName}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                  installment.status === 'pagado' ? 'bg-green-500 text-white shadow-md' :
                  installment.status === 'vencido' ? 'bg-red-500 text-white animate-pulse shadow-md' :
                  installment.status === 'parcial' ? 'bg-blue-500 text-white shadow-md' :
                  'bg-slate-200 text-slate-800'
                }`}>
                  {installment.status === 'pagado' ? 'Pagado ✅' :
                   installment.status === 'vencido' ? 'Vencido ⚠️' :
                   installment.status === 'parcial' ? 'Parcial ⏳' : 'Futuro 📅'}
                </div>
              </div>

              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-sm text-slate-600">Monto esperado</p>
                  <p className="font-bold text-lg">{installment.monto_expected.toLocaleString('es-PY')} Gs</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Pagado</p>
                  <p className="font-bold text-lg">{installment.monto_pagado.toLocaleString('es-PY')} Gs</p>
                </div>
              </div>

              {installment.hasUnconfirmedPayment && (
                <div className="mb-3 p-3 bg-yellow-100 rounded-lg text-yellow-800 text-sm flex items-center animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Pago pendiente de confirmación
                </div>
              )}

              <div className="flex space-x-2">
                {installment.status !== 'pagado' && showUploadButton && (
                  <button
                    onClick={() => {
                      onUploadReceipt(installment.id, installment.monto_expected, installment.debtorId, installment.debtorName);
                      handleCloseDayDetails();
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 text-sm font-bold flex items-center justify-center shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Subir Comprobante
                  </button>
                )}
                {installment.hasUnconfirmedPayment && (
                  <button
                    onClick={() => {
                      const unconfirmedPayment = installment.payments?.find((p: any) => !p.confirmado);
                      if (unconfirmedPayment) {
                        onOpenConfirmPaymentModal(
                          unconfirmedPayment.id,
                          installment.id,
                          installment.monto_expected,
                          unconfirmedPayment.comprobante_url,
                          installment.debtorName
                        );
                        handleCloseDayDetails();
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 text-sm font-bold flex items-center justify-center shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Confirmar Pago
                  </button>
                )}
                {installment.payments?.some(p => p.comprobante_url) && (
                  <button
                    onClick={() => onOpenReceiptsModal(installment)}
                    className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-2 px-4 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all transform hover:scale-105 text-sm font-bold flex items-center justify-center shadow-md"
                  >
                    Ver Comprobantes
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default ElegantPaymentCalendar;
