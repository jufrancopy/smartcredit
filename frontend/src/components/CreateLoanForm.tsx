import React, { useState, useEffect } from 'react';
import { useCreateLoan, useGetUsers } from '../queries';

const CreateLoanForm: React.FC = () => {
  const [userId, setUserId] = useState<string>('');
  const [montoPrincipal, setMontoPrincipal] = useState<number>(0);
  const [displayMonto, setDisplayMonto] = useState<string>('');
  const [plazoDias, setPlazoDias] = useState<number>(21); // Default to 21 days
  const [fechaOtorgado, setFechaOtorgado] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fechaInicioCobro, setFechaInicioCobro] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '');
    const numericValue = parseInt(rawValue, 10);

    if (isNaN(numericValue)) {
      setMontoPrincipal(0);
      setDisplayMonto('');
    } else {
      setMontoPrincipal(numericValue);
      setDisplayMonto(numericValue.toLocaleString('es-PY'));
    }
  };

  useEffect(() => {
    setDisplayMonto(montoPrincipal.toLocaleString('es-PY'));
  }, [montoPrincipal]);

  const { mutate: createLoan, isLoading, isSuccess, isError, error } = useCreateLoan();
  const { data: usersData } = useGetUsers();
  const users = usersData ? usersData.map((user: any) => ({ id: user.id, name: `${user.nombre} ${user.apellido}` })) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId && montoPrincipal > 0 && plazoDias > 0) {
      createLoan({
        userId: parseInt(userId),
        monto_principal: montoPrincipal,
        plazo_dias: plazoDias,
        fecha_otorgado: new Date(fechaOtorgado),
        fecha_inicio_cobro: new Date(fechaInicioCobro),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Crear Nuevo Préstamo
          </h1>
          <p className="text-slate-600">Completa el formulario para registrar un nuevo préstamo en el sistema</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 transform transition-all duration-300 hover:shadow-2xl">
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6">
            <div className="flex items-center justify-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Información del Préstamo</h2>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1 md:col-span-2">
                  <label htmlFor="userId" className="block text-sm font-medium text-slate-700">
                    Cliente <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <select
                      id="userId"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="pl-10 block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      required
                    >
                      <option value="">Seleccione un cliente</option>
                      {users.map((user: any) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="montoPrincipal" className="block text-sm font-medium text-slate-700">
                    Monto Principal (Gs.) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="montoPrincipal"
                      value={displayMonto}
                      onChange={handleMontoChange}
                      onFocus={(e) => e.target.select()}
                      className="pl-10 block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="plazoDias" className="block text-sm font-medium text-slate-700">
                    Plazo (días) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="number"
                      id="plazoDias"
                      value={plazoDias}
                      onChange={(e) => setPlazoDias(parseInt(e.target.value))}
                      className="pl-10 block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="fechaOtorgado" className="block text-sm font-medium text-slate-700">
                    Fecha Otorgado <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="date"
                      id="fechaOtorgado"
                      value={fechaOtorgado}
                      onChange={(e) => setFechaOtorgado(e.target.value)}
                      className="pl-10 block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="fechaInicioCobro" className="block text-sm font-medium text-slate-700">
                    Fecha Inicio Cobro <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="date"
                      id="fechaInicioCobro"
                      value={fechaInicioCobro}
                      onChange={(e) => setFechaInicioCobro(e.target.value)}
                      className="pl-10 block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-700 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-[1.02] shadow-lg font-medium flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando Préstamo...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Crear Préstamo
                    </>
                  )}
                </button>
              </div>
            </form>

            {isSuccess && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-700 font-medium">¡Préstamo creado exitosamente!</p>
              </div>
            )}

            {isError && (
              <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 font-medium">Error al crear préstamo: {error?.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLoanForm;