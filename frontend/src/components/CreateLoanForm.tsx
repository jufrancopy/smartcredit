import React, { useState, useEffect } from 'react';
import { useCreateLoan, useGetUsers } from '../queries';

const CreateLoanForm: React.FC = () => {
  const [userId, setUserId] = useState<string>('');
  const [montoPrincipal, setMontoPrincipal] = useState<number>(0);
  const [displayMonto, setDisplayMonto] = useState<string>('');
  const [plazoDias, setPlazoDias] = useState<number>(21); // Default to 21 days

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
  const [fechaOtorgado, setFechaOtorgado] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fechaInicioCobro, setFechaInicioCobro] = useState<string>(new Date().toISOString().split('T')[0]);

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
    <div className="p-6 bg-white rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Crear Nuevo Préstamo</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="userId" className="block text-sm font-medium text-gray-700">Cliente</label>
          <select
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          >
            <option value="">Seleccione un cliente</option>
            {users.map((user: any) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="montoPrincipal" className="block text-sm font-medium text-gray-700">Monto Principal (Gs.)</label>
          <input
            type="text"
            id="montoPrincipal"
            value={displayMonto}
            onChange={handleMontoChange}
            onFocus={(e) => e.target.select()}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="plazoDias" className="block text-sm font-medium text-gray-700">Plazo (días)</label>
          <input
            type="number"
            id="plazoDias"
            value={plazoDias}
            onChange={(e) => setPlazoDias(parseInt(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="fechaOtorgado" className="block text-sm font-medium text-gray-700">Fecha Otorgado</label>
          <input
            type="date"
            id="fechaOtorgado"
            value={fechaOtorgado}
            onChange={(e) => setFechaOtorgado(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="fechaInicioCobro" className="block text-sm font-medium text-gray-700">Fecha Inicio Cobro</label>
          <input
            type="date"
            id="fechaInicioCobro"
            value={fechaInicioCobro}
            onChange={(e) => setFechaInicioCobro(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={isLoading}
        >
          {isLoading ? 'Creando...' : 'Crear Préstamo'}
        </button>
        {isSuccess && <p className="mt-2 text-sm text-green-600">¡Préstamo creado exitosamente!</p>}
        {isError && <p className="mt-2 text-sm text-red-600">Error al crear préstamo: {error?.message}</p>}
      </form>
    </div>
  );
};

export default CreateLoanForm;
