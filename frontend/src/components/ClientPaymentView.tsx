import React, { useState, useMemo } from 'react';
import { useGetUser } from '../queries';
import { useGetLoans } from '../queries';
import UploadReceipt from './UploadReceipt';

const getReceiptImageUrl = (comprobante_url: string): string => {
  if (!comprobante_url) return '';
  if (comprobante_url.startsWith('/uploads/photos/')) {
    return `http://localhost:3000${comprobante_url}`;
  }
  return `http://localhost:3000/uploads/photos/${comprobante_url}`;
};

interface ClientPaymentViewProps {
  userId: number;
}

// Interfaz para el calendario de pagos elegante para clientes
interface ElegantPaymentCalendarProps {
  installments: InstallmentForClient[];
  onUploadReceipt: (installmentId: number, expectedMonto: number) => void;
  showUploadButton: boolean;
  onOpenPendingModal: (payment: any) => void;
}

// Componente de calendario elegante para clientes
const ElegantPaymentCalendar: React.FC<ElegantPaymentCalendarProps> = ({ 
  installments, 
  onUploadReceipt,
  showUploadButton,
  onOpenPendingModal
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

  // Determinar color para un día según estado de cuotas
  const getStatusColorForDay = (date: Date) => {
    const dayInstallments = getInstallmentsForDate(date);
    if (dayInstallments.length === 0) return null;

    // Prioridad: vencido > pendiente > parcial > futuro > pagado
    if (dayInstallments.some(inst => inst.status === 'vencido')) return 'bg-red-500 animate-pulse';
    if (dayInstallments.some(inst => inst.status === 'pendiente')) return 'bg-yellow-500';
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
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                      installment.status === 'pagado' ? 'bg-green-500 text-white shadow-md' :
                      installment.status === 'vencido' ? 'bg-red-500 text-white animate-pulse shadow-md' :
                      installment.status === 'pendiente' ? 'bg-yellow-500 text-white shadow-md' :
                      installment.status === 'parcial' ? 'bg-blue-500 text-white shadow-md' :
                      'bg-slate-200 text-slate-800'
                    }`}>
                      {installment.status === 'pagado' ? 'Pagado ✅' :
                       installment.status === 'vencido' ? 'Vencido ⚠️' :
                       installment.status === 'pendiente' ? 'Pendiente ⏳' :
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
                    <div 
                      className="mb-3 p-3 bg-yellow-100 rounded-lg text-yellow-800 text-sm flex items-center animate-pulse cursor-pointer hover:bg-yellow-200"
                      onClick={() => {
                        const pendingPayment = installment.payments.find(p => !p.confirmado);
                        if (pendingPayment) {
                          onOpenPendingModal(pendingPayment);
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Pago pendiente de confirmación (clic para ver)
                    </div>
                  )}

                  {installment.status !== 'pagado' && showUploadButton && (
                    <button
                      onClick={() => {
                        onUploadReceipt(installment.id, installment.monto_expected);
                        handleCloseDayDetails();
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 text-sm font-bold flex items-center justify-center shadow-md"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Subir Comprobante
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface InstallmentForClient {
  id: number;
  fecha: string;
  monto_expected: number;
  monto_pagado: number;
  status: 'pagado' | 'vencido' | 'pendiente' | 'futuro' | 'parcial';
  hasUnconfirmedPayment?: boolean;
  payments: any[];
}

const ClientPaymentView: React.FC<ClientPaymentViewProps> = ({ userId }) => {
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [selectedInstallmentExpectedMonto, setSelectedInstallmentExpectedMonto] = useState<number>(0);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const { data: loansData, isLoading: isLoadingLoans, isError: isErrorLoans, error: errorLoans, refetch } = useGetLoans(userId);
  const { data: userData, isLoading: isLoadingUser, isError: isErrorUser, error: errorUser } = useGetUser(userId);

  const handleLoanSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLoanId(e.target.value);
    setSelectedInstallmentId(null);
    setShowUploadModal(false);
  };

  const handleUploadReceiptClick = (installmentId: number, expectedMonto: number) => {
    setSelectedInstallmentId(installmentId);
    setSelectedInstallmentExpectedMonto(expectedMonto);
    setShowUploadModal(true);
  };

  const handleOpenPendingModal = (payment: any) => {
    setSelectedPayment(payment);
    setShowPendingModal(true);
  };

  const handleClosePendingModal = () => {
    setSelectedPayment(null);
    setShowPendingModal(false);
  };

  const handleCloseUploadModal = () => {
    setSelectedInstallmentId(null);
    setSelectedInstallmentExpectedMonto(0);
    setShowUploadModal(false);
    refetch();
  };

  interface LoanWithProcessedInstallments extends Omit<any, 'installments'> {
    installments: InstallmentForClient[];
  }

  const selectedLoan: LoanWithProcessedInstallments | undefined = useMemo(() => {
    const loan = loansData?.find(loanItem => loanItem.id.toString() === selectedLoanId);
    if (!loan) return undefined;

    const processedInstallments = loan.installments.map((inst: any) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const instDate = new Date(inst.fecha);
      instDate.setHours(0, 0, 0, 0);

      const hasUnconfirmedPayment = inst.payments.some((payment: any) => !payment.confirmado);

      let status: 'pagado' | 'vencido' | 'pendiente' | 'futuro' | 'parcial' = 'futuro';
      if (inst.monto_pagado >= inst.monto_expected) {
        status = 'pagado';
      } else if (hasUnconfirmedPayment) {
        status = 'pendiente';
      } else if (instDate < today) {
        status = 'vencido';
      } else if (inst.monto_pagado > 0 && inst.monto_pagado < inst.monto_expected) {
        status = 'parcial';
      } else if (instDate.getTime() === today.getTime()) {
        status = 'pendiente';
      }

      return { ...inst, status, hasUnconfirmedPayment, payments: inst.payments };
    });

    return { ...loan, installments: processedInstallments };
  }, [loansData, selectedLoanId]);

  if (isLoadingLoans || isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (isErrorLoans) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 font-semibold text-lg">Error al cargar préstamos: {errorLoans?.message}</p>
        </div>
      </div>
    );
  }

  if (isErrorUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 font-semibold text-lg">Error al cargar datos de usuario: {errorUser?.message}</p>
        </div>
      </div>
    );
  }

  const totalAmount = selectedLoan ? 
    selectedLoan.total_a_devolver - selectedLoan.installments.reduce((sum, inst) => sum + inst.monto_pagado, 0) : 0;
  const totalPaid = selectedLoan ? 
    selectedLoan.installments.reduce((sum, inst) => sum + inst.monto_pagado, 0) : 0;
  const overdueCount = selectedLoan ? 
    selectedLoan.installments.filter(i => i.status === 'vencido').length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Mi Portal de Pagos
          </h1>
          <p className="text-slate-600">Gestiona tus préstamos y pagos de forma sencilla</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="text-4xl">💳</div>
              <div className="text-2xl">📈</div>
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">Total a Pagar</p>
            <p className="text-3xl font-bold">{totalAmount.toLocaleString('es-PY')} Gs</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-purple-500/20 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="text-4xl">💸</div>
              <div className="text-2xl">📊</div>
            </div>
            <p className="text-purple-100 text-sm font-medium mb-1">Total Pagado</p>
            <p className="text-3xl font-bold">{totalPaid.toLocaleString('es-PY')} Gs</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="text-4xl">📋</div>
            </div>
            <p className="text-slate-600 text-sm font-medium mb-1">Préstamos Activos</p>
            <p className="text-3xl font-bold text-slate-800">{loansData?.length || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl shadow-red-500/20 transform hover:scale-105 transition-all duration-300 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="text-4xl">⚠️</div>
            </div>
            <p className="text-red-100 text-sm font-medium mb-1">Pagos Vencidos</p>
            <p className="text-3xl font-bold">{overdueCount}</p>
          </div>
        </div>

        {/* Loan Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-slate-200">
          <div className="mb-4">
            <label htmlFor="loanSelect" className="block text-sm font-medium text-slate-700 mb-2">Seleccionar Préstamo</label>
            <select
              id="loanSelect"
              value={selectedLoanId}
              onChange={handleLoanSelect}
              className="block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-lg font-medium"
              required
            >
              <option value="">Seleccione un préstamo</option>
              {loansData?.map((loan: any) => (
                <option key={loan.id} value={loan.id}>
                  Préstamo #{loan.id} - Monto: {loan.monto_principal.toLocaleString('es-PY')} Gs
                </option>
              ))}
            </select>
          </div>

          {selectedLoan && (
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 rounded-xl text-white">
              <h3 className="text-xl font-bold mb-4">Detalles del Préstamo Seleccionado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-300 text-sm">Monto Principal</p>
                  <p className="text-lg font-bold">{selectedLoan.monto_principal.toLocaleString('es-PY')} Gs</p>
                </div>
                <div>
                  <p className="text-slate-300 text-sm">Plazo</p>
                  <p className="text-lg font-bold">{selectedLoan.plazo_dias} días</p>
                </div>
                <div>
                  <p className="text-slate-300 text-sm">Fecha Otorgado</p>
                  <p className="text-lg font-bold">{new Date(selectedLoan.fecha_otorgado).toLocaleDateString('es-PY')}</p>
                </div>
                <div>
                  <p className="text-slate-300 text-sm">Fecha Inicio Cobro</p>
                  <p className="text-lg font-bold">{new Date(selectedLoan.fecha_inicio_cobro).toLocaleDateString('es-PY')}</p>
                </div>
                <div>
                  <p className="text-slate-300 text-sm">Monto ya Pagado</p>
                  <p className="text-lg font-bold">{selectedLoan.installments.reduce((sum, inst) => sum + inst.monto_pagado, 0).toLocaleString('es-PY')} Gs</p>
                </div>
                {userData?.fondo_acumulado !== undefined && (
                  <div>
                    <p className="text-slate-300 text-sm">Fondo Acumulado</p>
                    <p className="text-lg font-bold">{userData.fondo_acumulado.toLocaleString('es-PY')} Gs</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Payment Calendar */}
        {selectedLoan && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📅</span>
              <h2 className="text-2xl font-bold text-slate-800">Calendario de Pagos</h2>
            </div>
            <ElegantPaymentCalendar 
              installments={selectedLoan.installments} 
              onUploadReceipt={handleUploadReceiptClick}
              showUploadButton={true}
              onOpenPendingModal={handleOpenPendingModal}
            />
          </div>
        )}

        {!selectedLoan && loansData && loansData.length > 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-slate-500 text-lg">Por favor, seleccione un préstamo para ver sus pagos.</p>
          </div>
        )}
        {!selectedLoan && loansData && loansData.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <div className="text-6xl mb-4">💳</div>
            <p className="text-slate-500 text-lg">No hay préstamos disponibles para mostrar.</p>
          </div>
        )}

        {/* Upload Receipt Modal */}
        {showUploadModal && selectedInstallmentId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[500]">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative z-[999] transform transition-all duration-300 scale-100 opacity-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Subir Comprobante para Cuota #{selectedInstallmentId}</h3>
              <UploadReceipt 
                debtorId={userId} 
                installmentId={selectedInstallmentId.toString()} 
                expectedMonto={selectedInstallmentExpectedMonto}
                onClose={handleCloseUploadModal}
                isCollector={false} // Client is uploading, no auto-confirmation
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

        {/* Pending Payment Modal */}
        {showPendingModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[500]">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative z-[999]">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Comprobante Enviado</h3>
              <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 mb-4">
                <p className="font-bold">Pendiente de Aprobación</p>
                <p>Tu pago está siendo revisado por el cobrador.</p>
              </div>
              {selectedPayment.comprobante_url && (
                <img
                  src={getReceiptImageUrl(selectedPayment.comprobante_url)}
                  alt="Comprobante de pago"
                  className="max-w-full h-auto rounded-lg shadow-md"
                />
              )}
              <button
                onClick={handleClosePendingModal}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientPaymentView;