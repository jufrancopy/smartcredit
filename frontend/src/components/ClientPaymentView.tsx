import React, { useState, useMemo } from "react";
import { useGetUser } from "../queries";
import { useGetLoans } from "../queries";
import UploadReceipt from "./UploadReceipt";
import "../styles/animations.css";

const getReceiptImageUrl = (comprobante_url: string): string => {
  if (!comprobante_url) return "";
  if (comprobante_url.startsWith("/uploads/photos/")) {
    return `${import.meta.env.VITE_API_BASE_URL}${comprobante_url}`;
  }
  return `${
    import.meta.env.VITE_API_BASE_URL
  }/uploads/photos/${comprobante_url}`;
};

interface ClientPaymentViewProps {
  userId: number;
}

// Interfaz para el calendario de pagos elegante para clientes
interface ElegantPaymentCalendarProps {
  installments: InstallmentForClient[];
  onUploadReceipt: (installmentId: number, expectedMonto: number, installmentNumber: number) => void;
  showUploadButton: boolean;
  onOpenPendingModal: (payment: any) => void;
}

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

// Función para formatear fecha correctamente
const formatDate = (dateString: string): string => {
  return normalizeDate(dateString).toLocaleDateString("es-PY");
};

// Componente de calendario elegante para clientes
const ElegantPaymentCalendar: React.FC<ElegantPaymentCalendarProps> = ({
  installments,
  onUploadReceipt,
  showUploadButton,
  onOpenPendingModal,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetails, setShowDayDetails] = useState(false);

  // Navegación entre meses
  const changeMonth = (direction: number) => {
    setCurrentMonth((prev) => {
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
    const normalizedDate = normalizeDate(date);

    return installments.filter((installment) => {
      const installmentDate = normalizeDate(installment.fecha);
      return installmentDate.getTime() === normalizedDate.getTime();
    });
  };

  // Determinar color para un día según estado de cuotas
  const getStatusColorForDay = (date: Date) => {
    const dayInstallments = getInstallmentsForDate(date);
    if (dayInstallments.length === 0) return null;

    // Prioridad: vencido > pendiente > parcial > futuro > pagado
    if (dayInstallments.some((inst) => inst.status === "vencido"))
      return "bg-red-500 animate-pulse";
    if (dayInstallments.some((inst) => inst.status === "pendiente"))
      return "bg-yellow-500";
    if (dayInstallments.some((inst) => inst.status === "parcial"))
      return "bg-blue-500";
    if (dayInstallments.some((inst) => inst.status === "futuro"))
      return "bg-gray-400";
    return "bg-green-500"; // pagado
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
    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-slate-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-slate-800">
          {currentMonth.toLocaleString("es-ES", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <button
          onClick={() => changeMonth(1)}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-slate-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-slate-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => (
            <div
              key={`${weekIndex}-${dayIndex}`}
              className={`h-14 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                day ? "hover:bg-slate-50" : ""
              }`}
              onClick={() => day && handleDayClick(day)}
            >
              {day ? (
                <>
                  <span
                    className={`text-sm font-bold ${
                      day.getMonth() !== currentMonth.getMonth()
                        ? "text-slate-300"
                        : "text-slate-700"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {getStatusColorForDay(day) && (
                    <div
                      className={`w-3 h-3 rounded-full ${getStatusColorForDay(
                        day
                      )} shadow-md`}
                    ></div>
                  )}
                </>
              ) : null}
            </div>
          ))
        )}
      </div>

      {/* Modal para detalles del día */}
      {showDayDetails && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                {selectedDate.toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <button
                onClick={handleCloseDayDetails}
                className="text-slate-500 hover:text-slate-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {getInstallmentsForDate(selectedDate).map((installment, index) => (
                <div
                  key={installment.id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all transform hover:scale-[1.02]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-800">
                        Cuota #{installment.installmentNumber}
                      </h4>
                      <p className="text-sm text-slate-500">
                        {formatDate(installment.fecha)}
                      </p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        installment.status === "pagado"
                          ? "bg-green-500 text-white shadow-md"
                          : installment.status === "vencido"
                          ? "bg-red-500 text-white animate-pulse shadow-md"
                          : installment.status === "pendiente"
                          ? "bg-yellow-500 text-white shadow-md"
                          : installment.status === "parcial"
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-slate-200 text-slate-800"
                      }`}
                    >
                      {installment.status === "pagado"
                        ? "Pagado ✅"
                        : installment.status === "vencido"
                        ? "Vencido ⚠️"
                        : installment.status === "pendiente"
                        ? "Pendiente ⏳"
                        : installment.status === "parcial"
                        ? "Parcial ⏳"
                        : "Futuro 📅"}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-sm text-slate-600">Monto esperado</p>
                      <p className="font-bold text-lg">
                        {installment.monto_expected.toLocaleString("es-PY")} Gs
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Pagado</p>
                      <p className="font-bold text-lg">
                        {installment.monto_pagado.toLocaleString("es-PY")} Gs
                      </p>
                    </div>
                  </div>

                  {installment.hasUnconfirmedPayment && (
                    <div
                      className="mb-3 p-3 bg-yellow-100 rounded-lg text-yellow-800 text-sm flex items-center animate-pulse cursor-pointer hover:bg-yellow-200"
                      onClick={() => {
                        const pendingPayment = installment.payments.find(
                          (p) => !p.confirmado
                        );
                        if (pendingPayment) {
                          onOpenPendingModal(pendingPayment);
                        }
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Pago pendiente de confirmación (clic para ver)
                    </div>
                  )}

                  {installment.status === "pagado" && installment.payments.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-slate-600 mb-2">Comprobantes de pago:</p>
                      <div className="space-y-2">
                        {installment.payments.filter(p => p.confirmado).map((payment: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                {payment.monto.toLocaleString('es-PY')} Gs
                              </p>
                              <p className="text-xs text-green-600">
                                {new Date(payment.createdAt).toLocaleDateString('es-PY')}
                              </p>
                            </div>
                            {payment.comprobante_url && (
                              <button
                                onClick={() => onOpenPendingModal(payment)}
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                Ver comprobante
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {installment.status !== "pagado" && showUploadButton && (
                    <button
                      onClick={() => {
                        onUploadReceipt(
                          installment.id,
                          installment.monto_expected,
                          installment.installmentNumber
                        );
                        handleCloseDayDetails();
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 text-sm font-bold flex items-center justify-center shadow-md"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
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
  status: "pagado" | "vencido" | "pendiente" | "futuro" | "parcial";
  hasUnconfirmedPayment?: boolean;
  payments: any[];
  installmentNumber: number; // Añadido para el número de cuota secuencial
}

const ClientPaymentView: React.FC<ClientPaymentViewProps> = ({ userId }) => {
  const [selectedLoanId, setSelectedLoanId] = useState<string>("");
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<
    number | null
  >(null);
  const [selectedInstallmentNumber, setSelectedInstallmentNumber] = useState<
    number | null
  >(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [
    selectedInstallmentExpectedMonto,
    setSelectedInstallmentExpectedMonto,
  ] = useState<number>(0);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const {
    data: loansData,
    isLoading: isLoadingLoans,
    isError: isErrorLoans,
    error: errorLoans,
    refetch,
  } = useGetLoans(userId);
  const {
    data: userData,
    isLoading: isLoadingUser,
    isError: isErrorUser,
    error: errorUser,
  } = useGetUser(userId);

  const handleLoanSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLoanId(e.target.value);
    setSelectedInstallmentId(null);
    setShowUploadModal(false);
  };

  const handleUploadReceiptClick = (
    installmentId: number,
    expectedMonto: number,
    installmentNumber: number
  ) => {
    setSelectedInstallmentId(installmentId);
    setSelectedInstallmentNumber(installmentNumber);
    setSelectedInstallmentExpectedMonto(expectedMonto);
    setShowUploadModal(true);
    setSelectedPayment(null); // Asegurar que el modal de pago pendiente esté cerrado
  };

  const handleOpenPendingModal = (payment: any) => {
    setSelectedPayment(payment);
    setShowPendingModal(true);
    setShowUploadModal(false); // Asegurar que el modal de subida esté cerrado
  };

  const handleClosePendingModal = () => {
    setSelectedPayment(null);
    setShowPendingModal(false);
    setShowUploadModal(false); // Asegurar que el modal de subida también esté cerrado
  };

  const handleCloseUploadModal = () => {
    setSelectedInstallmentId(null);
    setSelectedInstallmentNumber(null);
    setSelectedInstallmentExpectedMonto(0);
    setShowUploadModal(false);
    setSelectedPayment(null); // Asegurar que el modal de pago pendiente también esté cerrado
    refetch();
  };

  // Función para calcular la fecha correcta de inicio de cobro (más robusta)
  const calculateCorrectStartDate = (fechaOtorgado: string): string => {
    // Parsear la fecha en UTC
    const [year, month, day] = fechaOtorgado
      .split("T")[0]
      .split("-")
      .map(Number);

    // Crear fecha en UTC
    const grantedDate = new Date(Date.UTC(year, month - 1, day));

    // Sumar 1 día en UTC
    const startDate = new Date(Date.UTC(year, month - 1, day + 1));

    return startDate.toISOString().split("T")[0];
  };

  interface LoanWithProcessedInstallments extends Omit<any, "installments"> {
    installments: InstallmentForClient[];
  }

  const selectedLoan: LoanWithProcessedInstallments | undefined =
    useMemo(() => {
      const loan = loansData?.find(
        (loanItem) => loanItem.id.toString() === selectedLoanId
      );
      if (!loan) return undefined;

      const processedInstallments = loan.installments.map((inst: any, index: number) => {
        // Usar normalizeDate para eliminar problemas de zona horaria
        const today = normalizeDate(new Date());
        const instDate = normalizeDate(inst.fecha);

        const hasUnconfirmedPayment = inst.payments.some(
          (payment: any) => !payment.confirmado
        );

        let status: "pagado" | "vencido" | "pendiente" | "futuro" | "parcial" =
          "futuro";
        if (inst.monto_pagado >= inst.monto_expected) {
          status = "pagado";
        } else if (hasUnconfirmedPayment) {
          status = "pendiente";
        } else if (instDate < today) {
          status = "vencido";
        } else if (
          inst.monto_pagado > 0 &&
          inst.monto_pagado < inst.monto_expected
        ) {
          status = "parcial";
        } else if (instDate.getTime() === today.getTime()) {
          status = "pendiente";
        }

        return {
          ...inst,
          status,
          hasUnconfirmedPayment,
          payments: inst.payments,
          installmentNumber: index + 1, // Asignar número de cuota secuencial
        };
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
          <p className="text-red-600 font-semibold text-lg">
            Error al cargar préstamos: {errorLoans?.message}
          </p>
        </div>
      </div>
    );
  }

  if (isErrorUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 font-semibold text-lg">
            Error al cargar datos de usuario: {errorUser?.message}
          </p>
        </div>
      </div>
    );
  }

  const totalAmount = selectedLoan
    ? selectedLoan.total_a_devolver -
      selectedLoan.installments.reduce(
        (sum, inst) => sum + inst.monto_pagado,
        0
      )
    : 0;
  const totalPaid = selectedLoan
    ? selectedLoan.installments.reduce(
        (sum, inst) => sum + inst.monto_pagado,
        0
      )
    : 0;
  const overdueCount = selectedLoan
    ? selectedLoan.installments.filter((i) => i.status === "vencido").length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <span className="text-3xl text-white">💳</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Mi Portal de Pagos
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Gestiona tus préstamos y pagos de forma sencilla y segura
          </p>
          {userData && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-white rounded-full shadow-md border border-slate-200">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">{userData.nombre.charAt(0)}</span>
              </div>
              <span className="text-slate-700 font-medium">Bienvenido, {userData.nombre} {userData.apellido}</span>
            </div>
          )}
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
                Total a Pagar
              </p>
              <p className="text-4xl font-bold mb-1">
                {totalAmount.toLocaleString("es-PY")}
              </p>
              <p className="text-blue-200 text-sm">Guaraníes</p>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 rounded-3xl p-8 text-white shadow-2xl shadow-emerald-500/25 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl">💸</span>
                </div>
                <div className="text-3xl opacity-60">📊</div>
              </div>
              <p className="text-emerald-100 text-sm font-medium mb-2 uppercase tracking-wide">
                Total Pagado
              </p>
              <p className="text-4xl font-bold mb-1">
                {totalPaid.toLocaleString("es-PY")}
              </p>
              <p className="text-emerald-200 text-sm">Guaraníes</p>
            </div>
          </div>

          <div className="group bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl text-white">📋</span>
                </div>
              </div>
              <p className="text-slate-600 text-sm font-medium mb-2 uppercase tracking-wide">
                Préstamos Activos
              </p>
              <p className="text-4xl font-bold text-slate-800 mb-1">
                {loansData?.length || 0}
              </p>
              <p className="text-slate-500 text-sm">Contratos</p>
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

        {/* Loan Selection */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-10 border border-slate-100 backdrop-blur-sm">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
              <span className="text-xl text-white">🏦</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Seleccionar Préstamo</h2>
              <p className="text-slate-600">Elige el préstamo que deseas gestionar</p>
            </div>
          </div>
          <div className="mb-6">
            <select
              id="loanSelect"
              value={selectedLoanId}
              onChange={handleLoanSelect}
              className="block w-full px-6 py-4 border-2 border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-medium bg-slate-50 hover:bg-white transition-all duration-300"
              required
            >
              <option value="">✨ Seleccione un préstamo</option>
              {loansData?.map((loan: any) => (
                <option key={loan.id} value={loan.id}>
                  💰 Préstamo #{loan.id} - {loan.monto_principal.toLocaleString("es-PY")} Gs
                </option>
              ))}
            </select>
          </div>

          {selectedLoan && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-20 translate-x-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 rounded-full translate-y-16 -translate-x-16"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
                    <span className="text-2xl text-white">📊</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">
                      Detalles del Préstamo #{selectedLoan.id}
                    </h3>
                    <p className="text-slate-300">Información completa de tu préstamo</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <p className="text-slate-300 text-sm font-medium mb-1">💰 Monto Principal</p>
                    <p className="text-2xl font-bold">
                      {selectedLoan.monto_principal.toLocaleString("es-PY")} Gs
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <p className="text-slate-300 text-sm font-medium mb-1">⏰ Plazo</p>
                    <p className="text-2xl font-bold">
                      {selectedLoan.plazo_dias} días
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <p className="text-slate-300 text-sm font-medium mb-1">📅 Fecha Otorgado</p>
                    <p className="text-xl font-bold">
                      {formatDate(selectedLoan.fecha_otorgado)}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <p className="text-slate-300 text-sm font-medium mb-1">🚀 Inicio Cobro</p>
                    <p className="text-xl font-bold">
                      {formatDate(
                        calculateCorrectStartDate(selectedLoan.fecha_otorgado)
                      )}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <p className="text-slate-300 text-sm font-medium mb-1">✅ Monto Pagado</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {selectedLoan.installments
                        .reduce((sum, inst) => sum + inst.monto_pagado, 0)
                        .toLocaleString("es-PY")} Gs
                    </p>
                  </div>
                  {userData?.fondo_acumulado !== undefined && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                      <p className="text-slate-300 text-sm font-medium mb-1">🏦 Fondo Acumulado</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {userData.fondo_acumulado.toLocaleString("es-PY")} Gs
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Calendar */}
        {selectedLoan && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-10 border border-slate-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                <span className="text-2xl text-white">📅</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-800">
                  Calendario de Pagos
                </h2>
                <p className="text-slate-600">Gestiona tus cuotas de forma visual</p>
              </div>
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
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-16 text-center shadow-2xl border border-blue-100">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl text-white">📋</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">Selecciona un Préstamo</h3>
            <p className="text-slate-600 text-lg max-w-md mx-auto">
              Elige un préstamo de la lista superior para ver tu calendario de pagos y gestionar tus cuotas.
            </p>
          </div>
        )}
        {!selectedLoan && loansData && loansData.length === 0 && (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-16 text-center shadow-2xl border border-slate-200">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl text-white">💳</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">No hay Préstamos</h3>
            <p className="text-slate-600 text-lg max-w-md mx-auto">
              Actualmente no tienes préstamos activos. Contacta con tu asesor para más información.
            </p>
          </div>
        )}

        {/* Upload Receipt Modal */}
        {showUploadModal && selectedInstallmentId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[500] animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg relative z-[999] transform transition-all duration-500 scale-100 opacity-100 animate-slideUp">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-xl text-white">📄</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Subir Comprobante
                  </h3>
                  <p className="text-slate-600">Cuota #{selectedInstallmentNumber}</p>
                </div>
              </div>
              <UploadReceipt
                debtorId={userId}
                installmentId={selectedInstallmentId.toString()}
                expectedMonto={selectedInstallmentExpectedMonto}
                onClose={handleCloseUploadModal}
                isCollector={false}
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

        {/* Pending Payment Modal */}
        {showPendingModal && selectedPayment && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[500] animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg relative z-[999] animate-slideUp">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-xl text-white">📋</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Comprobante de Pago
                  </h3>
                  <p className="text-slate-600">Detalles de tu transacción</p>
                </div>
              </div>
              
              {!selectedPayment.confirmado && (
                <div className="p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-2xl mb-6">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">⏳</span>
                    <div>
                      <p className="font-bold text-amber-800">Pendiente de Aprobación</p>
                      <p className="text-amber-700">Tu pago está siendo revisado por el cobrador.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedPayment.confirmado && (
                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 rounded-2xl mb-6">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">✅</span>
                    <div>
                      <p className="font-bold text-green-800">Pago Confirmado</p>
                      <p className="text-green-700">Tu pago ha sido aprobado exitosamente.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedPayment.comprobante_url && (
                <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                  <img
                    src={getReceiptImageUrl(selectedPayment.comprobante_url)}
                    alt="Comprobante de pago"
                    className="max-w-full h-auto rounded-xl shadow-lg border border-slate-200"
                  />
                </div>
              )}
              
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Monto:</span>
                  <span className="font-bold text-lg">{selectedPayment.monto?.toLocaleString('es-PY')} Gs</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-slate-600">Fecha:</span>
                  <span className="font-medium">{new Date(selectedPayment.createdAt).toLocaleDateString('es-PY')}</span>
                </div>
              </div>
              
              <button
                onClick={handleClosePendingModal}
                className="absolute top-4 right-4 w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientPaymentView;
