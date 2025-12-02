import React, { useState, useEffect } from 'react';
import { useCreateLoan, useGetUsers } from '../queries';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface CreateLoanFormProps {
  onSuccess: () => void;
}

const CreateLoanForm: React.FC<CreateLoanFormProps> = ({ onSuccess }) => {
  const [userId, setUserId] = useState<string>('');
  const [montoPrincipal, setMontoPrincipal] = useState<number>(0);
  const [displayMonto, setDisplayMonto] = useState<string>('');
  const [plazoDias, setPlazoDias] = useState<number>(21); // Default to 21 days
  const [fechaOtorgado, setFechaOtorgado] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fechaInicioCobro, setFechaInicioCobro] = useState<string>(new Date().toISOString().split('T')[0]);
  const [totalADevolver, setTotalADevolver] = useState<number>(0);
  const [montoDiario, setMontoDiario] = useState<number>(0);
  const [displayMontoDiario, setDisplayMontoDiario] = useState<string>('');
  
  const queryClient = useQueryClient();

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

  const handleMontoDiarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '');
    const numericValue = parseInt(rawValue, 10);

    if (isNaN(numericValue)) {
      setMontoDiario(0);
      setDisplayMontoDiario('');
    } else {
      setMontoDiario(numericValue);
      setDisplayMontoDiario(numericValue.toLocaleString('es-PY'));
    }
  };

  useEffect(() => {
    setDisplayMonto(montoPrincipal.toLocaleString('es-PY'));
    setDisplayMontoDiario(montoDiario.toLocaleString('es-PY'));

    // Recalculate totalADevolver based on new montoDiario or plazoDias
    const calculatedTotalADevolver = montoDiario * plazoDias;
    setTotalADevolver(calculatedTotalADevolver);
  }, [montoPrincipal, montoDiario, plazoDias]);

  const { mutate: createLoan, isLoading } = useCreateLoan({
    onSuccess: () => {
      toast.success('Préstamo creado exitosamente!');
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(`Error al crear el préstamo: ${error.message}`);
    }
  });
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
        monto_diario: montoDiario,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="form-control w-full md:col-span-2">
          <div className="label"><span className="label-text">Cliente</span></div>
          <select value={userId} onChange={(e) => setUserId(e.target.value)} className="select select-bordered" required>
            <option value="">Seleccione un cliente</option>
            {users.map((user: any) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </label>
        
        <label className="form-control w-full">
          <div className="label"><span className="label-text">Monto Principal (Gs.)</span></div>
          <input type="text" value={displayMonto} onChange={handleMontoChange} className="input input-bordered" required />
        </label>

        <label className="form-control w-full">
          <div className="label"><span className="label-text">Plazo (días)</span></div>
          <input type="number" value={plazoDias} onChange={(e) => setPlazoDias(parseInt(e.target.value))} className="input input-bordered" required />
        </label>

        <label className="form-control w-full">
          <div className="label"><span className="label-text">Monto Diario de Cuota (Gs.)</span></div>
          <input type="text" value={displayMontoDiario} onChange={handleMontoDiarioChange} className="input input-bordered" required />
        </label>
        
        <label className="form-control w-full">
          <div className="label"><span className="label-text">Total a Devolver (Gs.)</span></div>
          <input type="text" value={totalADevolver.toLocaleString('es-PY')} readOnly className="input input-bordered bg-slate-100" />
        </label>

        <label className="form-control w-full">
          <div className="label"><span className="label-text">Fecha Otorgado</span></div>
          <input type="date" value={fechaOtorgado} onChange={(e) => setFechaOtorgado(e.target.value)} className="input input-bordered" required />
        </label>

        <label className="form-control w-full">
          <div className="label"><span className="label-text">Fecha Inicio Cobro</span></div>
          <input type="date" value={fechaInicioCobro} onChange={(e) => setFechaInicioCobro(e.target.value)} className="input input-bordered" required />
        </label>
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
        {isLoading ? 'Creando Préstamo...' : 'Crear Préstamo'}
      </button>
    </form>
  );
};

export default CreateLoanForm;