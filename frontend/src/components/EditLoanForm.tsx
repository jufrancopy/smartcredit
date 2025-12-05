import React, { useState, useEffect } from 'react';
import { useUpdateLoan } from '../queries';
import toast from 'react-hot-toast';

interface EditLoanFormProps {
  loan: {
    id: number;
    monto_principal: number;
    interes_total_percent: number;
    total_a_devolver: number;
    plazo_dias: number;
    monto_diario: number;
    fecha_inicio_cobro: string;
  };
  onSuccess: () => void;
}

const EditLoanForm: React.FC<EditLoanFormProps> = ({ loan, onSuccess }) => {
  const [formData, setFormData] = useState({
    monto_principal: loan.monto_principal,
    plazo_dias: loan.plazo_dias,
    monto_diario: loan.monto_diario,
    fecha_inicio_cobro: loan.fecha_inicio_cobro
  });

  const updateLoanMutation = useUpdateLoan({
    onSuccess: () => {
      toast.success('Préstamo actualizado exitosamente');
      onSuccess();
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar préstamo');
    }
  });

  const totalADevolver = formData.monto_diario * formData.plazo_dias;
  const interesTotal = ((totalADevolver - formData.monto_principal) / formData.monto_principal * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateLoanMutation.mutate({
      id: loan.id,
      ...formData,
      interes_total_percent: parseFloat(interesTotal.toFixed(2))
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto Principal (Gs)
          </label>
          <input
            type="number"
            value={formData.monto_principal}
            onChange={(e) => setFormData({...formData, monto_principal: parseFloat(e.target.value)})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Plazo (días)
          </label>
          <input
            type="number"
            value={formData.plazo_dias}
            onChange={(e) => setFormData({...formData, plazo_dias: parseInt(e.target.value)})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto Diario (Gs)
          </label>
          <input
            type="number"
            value={formData.monto_diario}
            onChange={(e) => setFormData({...formData, monto_diario: parseFloat(e.target.value)})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha Inicio Cobro
          </label>
          <input
            type="date"
            value={formData.fecha_inicio_cobro}
            onChange={(e) => setFormData({...formData, fecha_inicio_cobro: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">Resumen Calculado</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total a Devolver:</span>
            <span className="font-bold ml-2">{totalADevolver.toLocaleString()} Gs</span>
          </div>
          <div>
            <span className="text-gray-600">Interés Total:</span>
            <span className="font-bold ml-2">{interesTotal.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={updateLoanMutation.isLoading}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
        >
          {updateLoanMutation.isLoading ? 'Actualizando...' : 'Actualizar Préstamo'}
        </button>
      </div>
    </form>
  );
};

export default EditLoanForm;