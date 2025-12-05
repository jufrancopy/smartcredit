import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import toast from 'react-hot-toast';
import UploadReceipt from './UploadReceipt';
import StoreMonitor from './StoreMonitor';
import ConsignmentManager from './ConsignmentManager';
import { useGetLoans, useConfirmPayment, useDeletePayment, downloadLoanPDF } from '../queries';
import '../styles/animations.css';

// Interfaz para el calendario de pagos elegante
interface ElegantPaymentCalendarProps {
  installments: InstallmentForCollector[];
  onOpenConfirmPaymentModal: (paymentId: number, installmentId: number, monto: number, comprobante_url: string | undefined, debtorName: string) => void;
  onUploadReceipt: (installmentId: number, expectedMonto: number, debtorId: number, debtorName: string, installmentNumber: number) => void;
  showUploadButton: boolean;
  onOpenReceiptsModal: (installment: InstallmentForCollector) => void;
  onDownloadPDF: (installments: InstallmentForCollector[]) => void;
}

// Componente de calendario elegante con más energía
const ElegantPaymentCalendar: React.FC<ElegantPaymentCalendarProps> = ({ 
  installments, 
  onOpenConfirmPaymentModal, 
  onUploadReceipt,
  showUploadButton,
  onOpenReceiptsModal,
  onDownloadPDF
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [showAllInstallments, setShowAllInstallments] = useState(false);
  const modalRoot = document.getElementById('modal-root');

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

  // Función para normalizar fechas (eliminar problema de zona horaria)
  const normalizeDate = (dateInput: string | Date): Date => {
    let d: Date;
    if (typeof dateInput === 'string') {
      // Si es string (YYYY-MM-DD), lo parseamos como fecha local
      const [year, month, day] = dateInput.split('-').map(Number);
      d = new Date(year, month - 1, day); // Se crea en la zona horaria local
    } else {
      // Si ya es un objeto Date, lo "normalizamos" a medianoche local
      d = new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
    }
    d.setHours(0, 0, 0, 0); // Asegurar que está a medianoche
    return d;
  };

  // Obtener cuotas para una fecha específica
  const getInstallmentsForDate = (date: Date) => {
    const normalizedDate = normalizeDate(date);
    
    return installments.filter(installment => {
      const installmentDate = normalizeDate(installment.fecha);
      return installmentDate.getTime() === normalizedDate.getTime();
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

  const handleDownloadPDF = (installments: InstallmentForCollector[]) => {
    onDownloadPDF(installments);
  };

  if (!modalRoot) return null;

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
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

      {/* Botones para ver todas las cuotas y descargar PDF */}
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={handleShowAllInstallments}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          Ver Todas las Cuotas
        </button>
        <button
          onClick={() => handleDownloadPDF(installments)}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2 px-4 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all transform hover:scale-105 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Descargar PDF
        </button>
      </div>

      {/* Modal para detalles del día */}
      {showDayDetails && selectedDate && ReactDOM.createPortal(
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
                          onUploadReceipt(installment.id, installment.monto_expected, installment.debtorId, installment.debtorName, installment.installmentNumber);
                          handleCloseDayDetails();
                        }}
                        className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-md relative group"
                        aria-label="Subir Comprobante"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span className="tooltip">Subir Comprobante</span>
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
                        className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors shadow-md relative group"
                        aria-label="Confirmar Pago"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="tooltip">Confirmar Pago</span>
                      </button>
                    )}
                    {installment.payments?.some(p => p.comprobante_url) && (
                      <button
                        onClick={() => onOpenReceiptsModal(installment)}
                        className="p-2 rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-colors shadow-md relative group"
                        aria-label="Ver Comprobantes"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        <span className="tooltip">Ver Comprobantes</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        modalRoot
      )}

      {/* Modal para ver todas las cuotas */}
      {showAllInstallments && ReactDOM.createPortal(
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
                      <h4 className="font-semibold text-slate-800">Cuota #{installment.installmentNumber}</h4>
                      <p className="text-sm text-slate-600">{installment.debtorName}</p>
                      <p className="text-xs text-slate-500">
                        {normalizeDate(installment.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
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
                          onUploadReceipt(installment.id, installment.monto_expected, installment.debtorId, installment.debtorName, installment.installmentNumber);
                          handleCloseAllInstallments();
                        }}
                        className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-md relative group"
                        aria-label="Subir Comprobante"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span className="tooltip">Subir Comprobante</span>
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
                        className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors shadow-md relative group"
                        aria-label="Confirmar Pago"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="tooltip">Confirmar Pago</span>
                      </button>
                    )}
                    {installment.payments?.some(p => p.comprobante_url) && (
                      <button
                        onClick={() => onOpenReceiptsModal(installment)}
                        className="p-2 rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-colors shadow-md relative group"
                        aria-label="Ver Comprobantes"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        <span className="tooltip">Ver Comprobantes</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        modalRoot
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
  loans: { id: number; monto_principal: number; monto_diario: number }[];
}

interface InstallmentForCollector extends Installment {
  status: InstallmentStatus;
  hasUnconfirmedPayment: boolean;
  debtorId: number;
  debtorName: string;
  installmentNumber: number; // Nuevo campo para el número de cuota
  payments?: any[]; // Añadido para acceder a los pagos
}

const CollectorDashboard: React.FC = () => {
  const { data: loans, isLoading, isError, refetch } = useGetLoans();
  const confirmPaymentMutation = useConfirmPayment();
  const deletePaymentMutation = useDeletePayment();

  const [activeTab, setActiveTab] = useState('payments');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<number | null>(null);
  const [selectedInstallmentNumber, setSelectedInstallmentNumber] = useState<number | null>(null);
  const [selectedInstallmentExpectedMonto, setSelectedInstallmentExpectedMonto] = useState<number>(0);
  const [selectedDebtorId, setSelectedDebtorId] = useState<number | null>(null);
  const [selectedDebtorName, setSelectedDebtorName] = useState<string>('');
  const [showConfirmPaymentModal, setShowConfirmPaymentModal] = useState<boolean>(false);
  const [paymentToConfirm, setPaymentToConfirm] = useState<PaymentToConfirm | null>(null);
  const [showReceiptsModal, setShowReceiptsModal] = useState(false);
  const [selectedInstallmentForReceipts, setSelectedInstallmentForReceipts] = useState<InstallmentForCollector | null>(null);
  const [showAllInstallments, setShowAllInstallments] = useState(false); // State for "Todas las Cuotas" modal
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [selectedPaymentToEdit, setSelectedPaymentToEdit] = useState<any | null>(null);
  const [accumulatedEarnings, setAccumulatedEarnings] = useState<number>(() => {
    const savedEarnings = localStorage.getItem('accumulatedCollectorEarnings');
    return savedEarnings ? parseFloat(savedEarnings) : 0;
  });

  useEffect(() => {
    localStorage.setItem('accumulatedCollectorEarnings', accumulatedEarnings.toString());
  }, [accumulatedEarnings]);

  const COLLECTOR_PROFIT_PERCENTAGE = 0.05; // 5% profit for the collector



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

  const handleOpenEditPaymentModal = (payment: any) => {
    setSelectedPaymentToEdit(payment);
    setShowEditPaymentModal(true);
    setShowReceiptsModal(false);
  };

  const handleCloseEditPaymentModal = () => {
    setSelectedPaymentToEdit(null);
    setShowEditPaymentModal(false);
    refetch();
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (window.confirm('¿Estás seguro de que quieres borrar este pago? Esta acción no se puede deshacer.')) {
      try {
        await deletePaymentMutation.mutateAsync(paymentId);
        toast.success('Pago borrado exitosamente');
        setShowReceiptsModal(false);
        refetch();
      } catch (error) {
        console.error('Error deleting payment:', error);
        toast.error('Error al borrar el pago');
      }
    }
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

  const handleUploadReceipt = (installmentId: number, expectedMonto: number, debtorId: number, debtorName: string, installmentNumber: number) => {
    setShowConfirmPaymentModal(false);
    setSelectedInstallmentId(installmentId);
    setSelectedInstallmentNumber(installmentNumber);
    setSelectedInstallmentExpectedMonto(expectedMonto);
    setSelectedDebtorId(debtorId);
    setSelectedDebtorName(debtorName);
    setShowUploadModal(true);
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setSelectedInstallmentId(null);
    setSelectedInstallmentNumber(null);
    setSelectedInstallmentExpectedMonto(0);
    setSelectedDebtorId(null);
    setSelectedDebtorName('');
    refetch();
  };

  const handleShowAllInstallments = () => {
    setShowAllInstallments(true);
  };

  const handleCloseAllInstallments = () => {
    setShowAllInstallments(false);
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

  const handleDownloadPDF = async (installments: InstallmentForCollector[]) => {
    try {
      // Obtener el loanId del primer installment
      if (installments.length === 0) {
        toast.error('No hay cuotas para generar el PDF');
        return;
      }
      
      // Buscar el loan que contiene estos installments
      const loanWithInstallments = loans?.find((loan: any) => 
        loan.installments.some((inst: any) => 
          installments.some(targetInst => targetInst.id === inst.id)
        )
      );
      
      if (!loanWithInstallments) {
        toast.error('No se pudo encontrar el préstamo');
        return;
      }
      
      toast.loading('Generando PDF...');
      await downloadLoanPDF(loanWithInstallments.id);
      toast.dismiss();
      toast.success('PDF descargado exitosamente!');
    } catch (error) {
      toast.dismiss();
      console.error('Error downloading PDF:', error);
      toast.error('Error al descargar el PDF');
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
      debtor.loans.push({ id: loan.id, monto_principal: loan.monto_principal, monto_diario: loan.monto_diario });
      
      // Calcular deuda pendiente para este préstamo específico
      const totalPagadoEstePresta mo = loan.installments.reduce((sum: number, inst: any) => sum + inst.monto_pagado, 0);
      const deudaPendienteEstePrestamo = loan.total_a_devolver - totalPagadoEstePrestamo;
      debtor.amountDue += deudaPendienteEstePrestamo;
      
      const processedInstallments: InstallmentForCollector[] = loan.installments
        .sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
        .map((inst: any, index: number) => {
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
          installmentNumber: index + 1, // Asignar número de cuota basado en el índice
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4 shadow-lg">
              <span className="text-3xl text-white">💼</span>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-3">
              Panel del Cobrador
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Gestiona los pagos y comprobantes de tus clientes de forma eficiente
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="group bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-blue-500/25 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-2xl">💳</span>
                  </div>
                  <div className="text-3xl opacity-60">📈</div>
                </div>
                <p className="text-blue-100 text-sm font-medium mb-2 uppercase tracking-wide">
                  Total a Cobrar
                </p>
                <p className="text-4xl font-bold mb-1">
                  {totalAmount.toLocaleString('es-PY')}
                </p>
                <p className="text-blue-200 text-sm">Guaraníes</p>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl shadow-purple-500/25 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-2xl">💸</span>
                  </div>
                  <div className="text-3xl opacity-60">📊</div>
                </div>
                <p className="text-purple-100 text-sm font-medium mb-2 uppercase tracking-wide">
                  Monto Prestado Total
                </p>
                <p className="text-4xl font-bold mb-1">
                  {totalLoanedAmount.toLocaleString('es-PY')}
                </p>
                <p className="text-purple-200 text-sm">Guaraníes</p>
              </div>
            </div>

            <div className="group bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl text-white">👥</span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm font-medium mb-2 uppercase tracking-wide">
                  Total Clientes
                </p>
                <p className="text-4xl font-bold text-slate-800 mb-1">
                  {debtors.length}
                </p>
                <p className="text-slate-500 text-sm">Activos</p>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-red-500 via-pink-600 to-rose-600 rounded-3xl p-8 text-white shadow-2xl shadow-red-500/25 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden ${overdueCount > 0 ? 'animate-pulse' : ''}">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-2xl">⚠️</span>
                  </div>
                </div>
                <p className="text-red-100 text-sm font-medium mb-2 uppercase tracking-wide">
                  Pagos Vencidos
                </p>
                <p className="text-4xl font-bold mb-1">{overdueCount}</p>
                <p className="text-red-200 text-sm">Cuotas</p>
              </div>
            </div>
          </div>

          {/* Earnings Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="group bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 rounded-3xl p-8 text-white shadow-2xl shadow-emerald-500/25 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-3xl">💰</span>
                  </div>
                  <div className="text-4xl opacity-60">💸</div>
                </div>
                <p className="text-emerald-100 text-sm font-medium mb-2 uppercase tracking-wide">
                  Ganancias Acumuladas
                </p>
                <p className="text-4xl font-bold mb-1">
                  {Math.round(accumulatedEarnings).toLocaleString('es-PY')}
                </p>
                <p className="text-emerald-200 text-sm">Guaraníes (5% comisión)</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-10">
            <div className="bg-white rounded-2xl shadow-lg p-2">
              <nav className="flex space-x-2" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`${
                    activeTab === 'payments'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  } flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300`}
                >
                  💳 Pagos
                </button>
                <button
                  onClick={() => setActiveTab('stores')}
                  className={`${
                    activeTab === 'stores'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  } flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300`}
                >
                  🏪 Tiendas
                </button>
                <button
                  onClick={() => setActiveTab('consignments')}
                  className={`${
                    activeTab === 'consignments'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  } flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300`}
                >
                  📋 Consignaciones
                </button>
              </nav>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'payments' && (
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center">
                  <span className="text-xl text-white">👥</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-800">Clientes</h2>
                  <p className="text-slate-600">Gestiona los pagos de cada cliente</p>
                </div>
              </div>
            {debtors.length === 0 ? (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-16 text-center shadow-2xl border border-slate-200">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl text-white">💳</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">No hay Clientes</h3>
                <p className="text-slate-600 text-lg max-w-md mx-auto">
                  Aún no tienes clientes registrados. Los clientes aparecerán aquí cuando se les asignen préstamos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {debtors.map((debtor) => (
                  <div key={debtor.id} className="bg-white rounded-3xl shadow-2xl border border-slate-100 hover:shadow-3xl transition-all transform hover:scale-[1.02] duration-500 overflow-hidden">
                    {/* Card Header */}
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-20 translate-x-20"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 rounded-full translate-y-16 -translate-x-16"></div>
                      <div className="relative z-10">
                        <div className="flex items-start">
                          {debtor.foto_url ? (
                            <img 
                              src={`${import.meta.env.VITE_API_BASE_URL}${debtor.foto_url}`} 
                              alt={debtor.name} 
                              className="w-20 h-20 rounded-2xl mr-6 border-3 border-white/20 object-cover shadow-lg"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mr-6 flex items-center justify-center shadow-lg">
                              <span className="text-2xl text-white font-bold">{debtor.name.charAt(0)}</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-2xl text-white mb-2">{debtor.name}</h3>
                                <div className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                                  <span className="text-slate-300 text-sm">ID: {debtor.id}</span>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-6">
                              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                                <p className="text-slate-300 text-xs font-medium mb-1">💰 Prestado</p>
                                <p className="text-xl font-bold text-white">
                                  {debtor.loans.reduce((sum, l) => sum + l.monto_principal, 0).toLocaleString('es-PY')} Gs
                                </p>
                              </div>
                              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                                <p className="text-slate-300 text-xs font-medium mb-1">📅 Diario</p>
                                <p className="text-xl font-bold text-white">
                                  {debtor.loans.reduce((sum, l) => sum + l.monto_diario, 0).toLocaleString('es-PY')} Gs
                                </p>
                              </div>
                              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 col-span-2">
                                <p className="text-slate-300 text-xs font-medium mb-1">💳 Total Deuda</p>
                                <p className="text-3xl font-bold text-emerald-400">
                                  {debtor.amountDue.toLocaleString('es-PY')} Gs
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                          <span className="text-xl text-white">📅</span>
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-slate-800">Calendario de Pagos</h4>
                          <p className="text-slate-600">Gestiona las cuotas del cliente</p>
                        </div>
                      </div>
                      <ElegantPaymentCalendar 
                        installments={debtor.installments} 
                        onOpenConfirmPaymentModal={handleOpenConfirmPaymentModal} 
                        onUploadReceipt={handleUploadReceipt}
                        showUploadButton={true}
                        onOpenReceiptsModal={handleOpenReceiptsModal}
                        onDownloadPDF={handleDownloadPDF}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          )}

          {activeTab === 'stores' && (
            <div className="mb-10">
              <StoreMonitor />
            </div>
          )}

          {activeTab === 'consignments' && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <ConsignmentManager />
            </div>
          )}
        </div>

        {/* Modals */}
        {showUploadModal && selectedInstallmentId != null && selectedDebtorId != null && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[500] animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg relative z-[999] animate-slideUp">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-xl text-white">📄</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Subir Comprobante
                  </h3>
                  <p className="text-slate-600">Cuota #{selectedInstallmentNumber} - {selectedDebtorName}</p>
                </div>
              </div>
              <UploadReceipt 
                debtorId={selectedDebtorId} 
                installmentId={selectedInstallmentId.toString()} 
                expectedMonto={selectedInstallmentExpectedMonto}
                onClose={handleCloseUploadModal}
                isCollector={true}
                onSuccessfulUploadAndConfirm={handleSuccessfulUploadAndConfirm}
                onSuccess={() => toast.success('¡Comprobante subido y confirmado exitosamente!')}
              />
              <button
                onClick={handleCloseUploadModal}
                className="absolute top-4 right-4 w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {showConfirmPaymentModal && paymentToConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[400] p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg mx-auto relative animate-slideUp max-h-[90vh] overflow-y-auto">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-xl text-white">✅</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    Confirmar Pago
                  </h3>
                  <p className="text-slate-600">{paymentToConfirm.debtorName}</p>
                </div>
              </div>
              <button
                onClick={handleCloseConfirmPaymentModal}
                className="absolute top-4 right-4 w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-2xl p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Cuota ID</p>
                      <p className="text-xl font-bold text-slate-800">#{paymentToConfirm.installmentId}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Monto a Confirmar</p>
                      <p className="text-xl font-bold text-emerald-600">{paymentToConfirm.monto.toLocaleString('es-PY')} Gs</p>
                    </div>
                  </div>
                </div>
                {paymentToConfirm.comprobante_url ? (
                  <div>
                    <p className="text-slate-700 font-semibold mb-3">Comprobante de Pago:</p>
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <img 
                        src={`${import.meta.env.VITE_API_BASE_URL}${paymentToConfirm.comprobante_url}`} 
                        alt="Comprobante de Pago" 
                        className="max-w-full h-auto rounded-xl shadow-lg border border-slate-200" 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-amber-50 border-l-4 border-amber-400 rounded-2xl">
                    <p className="text-amber-800">No hay comprobante adjunto para este pago.</p>
                  </div>
                )}
                <button
                  onClick={handleConfirmPaymentAction}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 font-bold shadow-lg text-lg"
                  disabled={confirmPaymentMutation.isLoading}
                >
                  {confirmPaymentMutation.isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Confirmando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">✅</span>
                      Confirmar Pago
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showReceiptsModal && selectedInstallmentForReceipts && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[600] p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-xl text-white">📋</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-800">
                    Comprobantes de Pago
                  </h3>
                  <p className="text-slate-600">Cuota #{selectedInstallmentForReceipts.installmentNumber}</p>
                </div>
                <button 
                  onClick={handleCloseReceiptsModal} 
                  className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-6">
                {selectedInstallmentForReceipts.payments && selectedInstallmentForReceipts.payments.length > 0 ? (
                  selectedInstallmentForReceipts.payments.map((payment: any) => (
                    <div key={payment.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all duration-300">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="font-bold text-slate-800 text-lg">Pago #{payment.id}</p>
                          <p className="text-slate-600">Fecha: {new Date(payment.createdAt).toLocaleDateString('es-PY')}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                          payment.confirmado 
                            ? 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border border-green-300' 
                            : 'bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800 border border-amber-300'
                        }`}>
                          {payment.confirmado ? '✅ Confirmado' : '⏳ Pendiente'}
                        </span>
                      </div>
                      <div className="bg-white rounded-xl p-4 mb-4">
                        <p className="text-slate-600 text-sm">Monto del Pago</p>
                        <p className="text-2xl font-bold text-slate-800">{payment.monto.toLocaleString('es-PY')} Gs</p>
                      </div>
                      {payment.comprobante_url ? (
                        <div className="bg-white rounded-xl p-4">
                          <p className="text-slate-600 text-sm mb-3">Comprobante:</p>
                          <img 
                            src={`${import.meta.env.VITE_API_BASE_URL}${payment.comprobante_url}`} 
                            alt={`Comprobante para pago ${payment.id}`} 
                            className="max-w-full h-auto rounded-xl shadow-lg border border-slate-200" 
                          />
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <p className="text-amber-800">No hay comprobante para este pago.</p>
                        </div>
                      )}
                      <div className="flex justify-end gap-2 mt-4">
                        <button
                          onClick={() => handleOpenEditPaymentModal(payment)}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 font-medium text-sm flex items-center shadow-md"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 font-medium text-sm flex items-center shadow-md"
                          disabled={deletePaymentMutation.isLoading}
                        >
                          {deletePaymentMutation.isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          ) : (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                          Borrar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-slate-500">📄</span>
                    </div>
                    <p className="text-slate-500 text-lg">No hay pagos registrados para esta cuota.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal para editar pago */}
        {showEditPaymentModal && selectedPaymentToEdit && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[700] p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slideUp">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-xl text-white">✏️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-800">
                    Editar Pago
                  </h3>
                  <p className="text-slate-600">Pago #{selectedPaymentToEdit.id}</p>
                </div>
                <button 
                  onClick={handleCloseEditPaymentModal} 
                  className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-2xl p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Monto Actual</p>
                      <p className="text-xl font-bold text-slate-800">{selectedPaymentToEdit.monto?.toLocaleString('es-PY')} Gs</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Estado</p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${
                        selectedPaymentToEdit.confirmado 
                          ? 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border border-green-300' 
                          : 'bg-gradient-to-r from-amber-100 to-yellow-200 text-amber-800 border border-amber-300'
                      }`}>
                        {selectedPaymentToEdit.confirmado ? '✅ Confirmado' : '⏳ Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedPaymentToEdit.comprobante_url && (
                  <div>
                    <p className="text-slate-700 font-semibold mb-3">Comprobante Actual:</p>
                    <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                      <img 
                        src={`${import.meta.env.VITE_API_BASE_URL}${selectedPaymentToEdit.comprobante_url}`} 
                        alt="Comprobante actual" 
                        className="max-w-full h-auto rounded-xl shadow-lg border border-slate-200" 
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-slate-700 font-semibold mb-3">Subir Nuevo Comprobante:</p>
                  <UploadReceipt 
                    debtorId={selectedPaymentToEdit.installment?.loan?.user?.id || 0}
                    installmentId={selectedPaymentToEdit.installment?.id?.toString() || '0'}
                    expectedMonto={selectedPaymentToEdit.monto || 0}
                    onClose={handleCloseEditPaymentModal}
                    isCollector={true}
                    paymentId={selectedPaymentToEdit.id}
                    isEditing={true}
                    onSuccess={() => toast.success('¡Comprobante actualizado exitosamente!')}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default CollectorDashboard;