import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import UploadReceipt from './UploadReceipt';
import { useGetLoans, useConfirmPayment } from '../queries';

// Interfaz para el calendario de pagos elegante
interface ElegantPaymentCalendarProps {
  installments: InstallmentForCollector[];
  onOpenConfirmPaymentModal: (paymentId: number, installmentId: number, monto: number, comprobante_url: string | undefined, debtorName: string) => void;
  onUploadReceipt: (installmentId: number, expectedMonto: number, debtorId: number, debtorName: string) => void;
  showUploadButton: boolean;
  onOpenReceiptsModal: (installment: InstallmentForCollector) => void;
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
  const [showAllInstallments, setShowAllInstallments] = useState(false);

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

  const handleShowAllInstallments = () => {
    setShowAllInstallments(true);
  };

  const handleCloseAllInstallments = () => {
    setShowAllInstallments(false);
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
          onClick={handleShowAllInstallments}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          Ver Todas las Cuotas
        </button>
      </div>

      {/* Modal para detalles del día */}
      {showDayDetails && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <button onClick={handleCloseDayDetails} className="text-slate-500 hover:text-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {getInstallmentsForDate(selectedDate).map(installment => (
                <div key={installment.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all transform hover:scale-[1.02]">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-800">Cuota #{installment.id}</h4>
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
          </div>
        </div>
      )}

      {/* Modal para ver todas las cuotas */}
      {showAllInstallments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Todas las Cuotas</h3>
              <button onClick={handleCloseAllInstallments} className="text-slate-500 hover:text-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {installments.map(installment => (
                <div key={installment.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all transform hover:scale-[1.02]">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-800">Cuota #{installment.id}</h4>
                      <p className="text-sm text-slate-600">{installment.debtorName}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(installment.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
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
                          handleCloseAllInstallments();
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
                            handleCloseAllInstallments();
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
          </div>
        </div>
      )}
    </div>
  );
};

// Resto de las interfaces y código existente...
interface PaymentToConfirm {
  paymentId: number;
  installmentId: number;
  monto: number;
  comprobante_url?: string;
  debtorName: string;
}

interface Debtor {
  id: number;
  name: string;
  amountDue: number;
  installments: Installment[];
  foto_url?: string;
  loans: { id: number; monto_principal: number }[];
}

interface InstallmentForCollector extends Installment {
  status: InstallmentStatus;
  hasUnconfirmedPayment: boolean;
  debtorId: number;
  debtorName: string;
  payments?: any[]; // Añadido para acceder a los pagos
}

const CollectorDashboard: React.FC = () => {
  const { data: loans, isLoading, isError, refetch } = useGetLoans();
  const confirmPaymentMutation = useConfirmPayment();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<number | null>(null);
  const [selectedInstallmentExpectedMonto, setSelectedInstallmentExpectedMonto] = useState<number>(0);
  const [selectedDebtorId, setSelectedDebtorId] = useState<number | null>(null);
  const [selectedDebtorName, setSelectedDebtorName] = useState<string>('');
  const [showConfirmPaymentModal, setShowConfirmPaymentModal] = useState<boolean>(false);
  const [paymentToConfirm, setPaymentToConfirm] = useState<PaymentToConfirm | null>(null);
  const [showReceiptsModal, setShowReceiptsModal] = useState(false);
  const [selectedInstallmentForReceipts, setSelectedInstallmentForReceipts] = useState<InstallmentForCollector | null>(null);
  const [accumulatedEarnings, setAccumulatedEarnings] = useState<number>(() => {
    const savedEarnings = localStorage.getItem('accumulatedCollectorEarnings');
    return savedEarnings ? parseFloat(savedEarnings) : 0;
  });

  useEffect(() => {
    localStorage.setItem('accumulatedCollectorEarnings', accumulatedEarnings.toString());
  }, [accumulatedEarnings]);

  const COLLECTOR_PROFIT_PERCENTAGE = 0.05; // 5% profit for the collector

  useEffect(() => {
    console.log('CollectorDashboard - modal states:', { showUploadModal, showConfirmPaymentModal, selectedInstallmentId, selectedDebtorId });
  }, [showUploadModal, showConfirmPaymentModal, selectedInstallmentId, selectedDebtorId]);

  const handleOpenConfirmPaymentModal = (paymentId: number, installmentId: number, monto: number, comprobante_url: string | undefined, debtorName: string) => {
    setShowUploadModal(false);
    setPaymentToConfirm({ paymentId, installmentId, monto, comprobante_url, debtorName });
    setShowConfirmPaymentModal(true);
  };

  const handleOpenReceiptsModal = (installment: InstallmentForCollector) => {
    setSelectedInstallmentForReceipts(installment);
    setShowReceiptsModal(true);
  };

  const handleCloseReceiptsModal = () => {
    setSelectedInstallmentForReceipts(null);
    setShowReceiptsModal(false);
  };

  const handleCloseConfirmPaymentModal = () => {
    setPaymentToConfirm(null);
    setShowConfirmPaymentModal(false);
  };

  const handleConfirmPaymentAction = async () => {
    if (paymentToConfirm) {
      try {
        await confirmPaymentMutation.mutateAsync({ installmentId: paymentToConfirm.installmentId, monto: paymentToConfirm.monto, paymentId: paymentToConfirm.paymentId });
        toast.success('Pago confirmado exitosamente!');
        setAccumulatedEarnings(prev => prev + (paymentToConfirm.monto * COLLECTOR_PROFIT_PERCENTAGE));
        refetch();
        handleCloseConfirmPaymentModal();
      } catch (error) {
        console.error('Error confirming payment:', error);
        toast.error('Error al confirmar el pago.');
      }
    }
  };

  const handleUploadReceipt = (installmentId: number, expectedMonto: number, debtorId: number, debtorName: string) => {
    setShowConfirmPaymentModal(false);
    setSelectedInstallmentId(installmentId);
    setSelectedInstallmentExpectedMonto(expectedMonto);
    setSelectedDebtorId(debtorId);
    setSelectedDebtorName(debtorName);
    setShowUploadModal(true);
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setSelectedInstallmentId(null);
    setSelectedInstallmentExpectedMonto(0);
    setSelectedDebtorId(null);
    setSelectedDebtorName('');
    refetch();
  };

  const handleSuccessfulUploadAndConfirm = async (paymentId: number, installmentId: number, monto: number) => {
    try {
      setAccumulatedEarnings(prev => prev + (monto * COLLECTOR_PROFIT_PERCENTAGE));
      refetch();
    } catch (error) {
      console.error('Error handling successful upload and confirm:', error);
      toast.error('Error al procesar la confirmación automática del pago.');
    }
  };

  const debtors: Debtor[] = useMemo(() => {
    if (!loans) return [];
    
    const debtorsMap = new Map<number, Debtor>();
    
    loans.forEach((loan: any) => {
      if (!debtorsMap.has(loan.user.id)) {
        debtorsMap.set(loan.user.id, {
          id: loan.user.id,
          name: `${loan.user.nombre} ${loan.user.apellido}`,
          amountDue: 0,
          installments: [],
          foto_url: loan.user.foto_url,
          loans: [],
        });
      }
      
      const debtor = debtorsMap.get(loan.user.id)!;
      debtor.loans.push({ id: loan.id, monto_principal: loan.monto_principal });
      debtor.amountDue += loan.total_a_devolver - loan.installments.reduce((sum: number, inst: any) => sum + inst.monto_pagado, 0);
      
      const processedInstallments: InstallmentForCollector[] = loan.installments.map((inst: any) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const instDate = new Date(inst.fecha);
        instDate.setHours(0, 0, 0, 0);
        
        let status: InstallmentStatus = 'futuro';
        if (inst.monto_pagado >= inst.monto_expected) {
          status = 'pagado';
        } else if (instDate < today) {
          status = 'vencido';
        } else if (instDate.getTime() === today.getTime()) {
          status = 'parcial';
        }

        const hasUnconfirmedPayment = Array.isArray(inst.payments) ? inst.payments.some((payment: any) => !payment.confirmado) : false;

        return { 
          ...inst, 
          status, 
          hasUnconfirmedPayment, 
          debtorId: loan.user.id, 
          debtorName: `${loan.user.nombre} ${loan.user.apellido}`,
          payments: inst.payments // Añadido para acceder a los pagos
        };
      });
      
      debtor.installments.push(...processedInstallments);
    });
    
    return Array.from(debtorsMap.values());
  }, [loans]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Cargando préstamos...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 font-semibold text-lg">Error al cargar préstamos</p>
        </div>
      </div>
    );
  }

  const totalAmount = debtors.reduce((sum, d) => sum + d.amountDue, 0);
  const totalLoanedAmount = loans?.reduce((sum: number, loan: any) => sum + loan.monto_principal, 0) || 0;
  const overdueCount = debtors.reduce((count, d) => 
    count + d.installments.filter(i => i.status === 'vencido').length, 0
  );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
              Panel del Cobrador
            </h1>
            <p className="text-slate-600">Gestiona los pagos y comprobantes de tus clientes</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="text-4xl">💳</div>
                <div className="text-2xl">📈</div>
              </div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total a Cobrar</p>
              <p className="text-3xl font-bold">{totalAmount.toLocaleString('es-PY')} Gs</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-purple-500/20 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="text-4xl">💸</div>
                <div className="text-2xl">📊</div>
              </div>
              <p className="text-purple-100 text-sm font-medium mb-1">Monto Prestado Total</p>
              <p className="text-3xl font-bold">{totalLoanedAmount.toLocaleString('es-PY')} Gs</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="text-4xl">👥</div>
              </div>
              <p className="text-slate-600 text-sm font-medium mb-1">Total Clientes</p>
              <p className="text-3xl font-bold text-slate-800">{debtors.length}</p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl shadow-red-500/20 transform hover:scale-105 transition-all duration-300 animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="text-4xl">⚠️</div>
              </div>
              <p className="text-red-100 text-sm font-medium mb-1">Pagos Vencidos</p>
              <p className="text-3xl font-bold">{overdueCount}</p>
            </div>
          </div>

          {/* Earnings Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl shadow-green-500/20 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="text-4xl">💰</div>
                <div className="text-2xl">💸</div>
              </div>
              <p className="text-green-100 text-sm font-medium mb-1">Ganancias Acumuladas</p>
              <p className="text-3xl font-bold">{accumulatedEarnings.toLocaleString('es-PY')} Gs</p>
            </div>
          </div>

          {/* Debtors Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Clientes</h2>
            {debtors.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                <div className="text-6xl mb-4">💳</div>
                <p className="text-slate-500 text-lg">No hay clientes registrados</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {debtors.map((debtor) => (
                  <div key={debtor.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200 hover:shadow-xl transition-all transform hover:scale-[1.02]">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6">
                      <div className="flex items-start">
                        {debtor.foto_url && (
                          <img 
                            src={`http://localhost:3000${debtor.foto_url}`} 
                            alt={debtor.name} 
                            className="w-16 h-16 rounded-full mr-4 border-2 border-slate-500 object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-bold text-xl text-white mb-1">{debtor.name}</h3>
                              <p className="text-slate-300 text-sm">ID: {debtor.id}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-300 text-xs mb-1">Monto Prestado</p>
                              <p className="text-lg font-bold text-white">
                                {debtor.loans.reduce((sum, l) => sum + l.monto_principal, 0).toLocaleString('es-PY')} <span className="text-sm">Gs</span>
                              </p>
                              <p className="text-slate-300 text-xs mb-1 mt-2">Total Deuda</p>
                              <p className="text-2xl font-bold text-white">
                                {debtor.amountDue.toLocaleString('es-PY')} <span className="text-sm">Gs</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-6">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl">📅</span>
                          <h4 className="text-lg font-semibold text-slate-800">Calendario de Pagos</h4>
                        </div>
                        <ElegantPaymentCalendar 
                          installments={debtor.installments} 
                          onOpenConfirmPaymentModal={handleOpenConfirmPaymentModal} 
                          onUploadReceipt={handleUploadReceipt}
                          showUploadButton={true}
                          onOpenReceiptsModal={handleOpenReceiptsModal}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showUploadModal && selectedInstallmentId != null && selectedDebtorId != null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[500]">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative z-[999] transform transition-all duration-300 scale-100 opacity-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Subir Comprobante para Cuota #{selectedInstallmentId} ({selectedDebtorName})</h3>
              <UploadReceipt 
                debtorId={selectedDebtorId} 
                installmentId={selectedInstallmentId.toString()} 
                expectedMonto={selectedInstallmentExpectedMonto}
                onClose={handleCloseUploadModal}
                isCollector={true}
                onSuccessfulUploadAndConfirm={handleSuccessfulUploadAndConfirm}
              />
              <button
                onClick={handleCloseUploadModal}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {showConfirmPaymentModal && paymentToConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[400] p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-auto relative transform transition-all duration-300 scale-100 opacity-100">
              <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center">Confirmar Pago para {paymentToConfirm.debtorName}</h3>
              <button
                onClick={handleCloseConfirmPaymentModal}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="space-y-4">
                <p className="text-slate-700"><strong className="font-semibold">Cuota ID:</strong> {paymentToConfirm.installmentId}</p>
                <p className="text-slate-700"><strong className="font-semibold">Monto a Confirmar:</strong> {paymentToConfirm.monto.toLocaleString('es-PY')} Gs</p>
                {paymentToConfirm.comprobante_url ? (
                  <div>
                    <p className="text-slate-700 font-semibold mb-2">Comprobante:</p>
                    <img src={`http://localhost:3000${paymentToConfirm.comprobante_url}`} alt="Comprobante de Pago" className="max-w-full h-auto rounded-lg shadow-md" />
                  </div>
                ) : (
                  <p className="text-slate-700">No hay comprobante adjunto para este pago.</p>
                )}
                <button
                  onClick={handleConfirmPaymentAction}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 font-bold shadow-lg"
                  disabled={confirmPaymentMutation.isLoading}
                >
                  {confirmPaymentMutation.isLoading ? 'Confirmando...' : 'Confirmar Pago'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showReceiptsModal && selectedInstallmentForReceipts && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[600] p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800">
                  Comprobantes para Cuota #{selectedInstallmentForReceipts.id}
                </h3>
                <button onClick={handleCloseReceiptsModal} className="text-slate-500 hover:text-slate-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                {selectedInstallmentForReceipts.payments && selectedInstallmentForReceipts.payments.length > 0 ? (
                  selectedInstallmentForReceipts.payments.map((payment: any) => (
                    <div key={payment.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-slate-800">Pago ID: {payment.id}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${payment.confirmado ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>
                          {payment.confirmado ? 'Confirmado' : 'Pendiente'}
                        </span>
                      </div>
                      <p className="text-slate-600 mb-2">Monto: <span className="font-bold">{payment.monto.toLocaleString('es-PY')} Gs</span></p>
                      {payment.comprobante_url ? (
                        <img src={`http://localhost:3000${payment.comprobante_url}`} alt={`Comprobante para pago ${payment.id}`} className="max-w-full h-auto rounded-lg shadow-md mt-2" />
                      ) : (
                        <p className="text-slate-500 mt-2">No hay comprobante para este pago.</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center">No hay pagos registrados para esta cuota.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CollectorDashboard;