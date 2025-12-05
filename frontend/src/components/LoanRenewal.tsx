import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface LoanRenewalProps {
  clientId: number;
  clientName: string;
  eligibilityData: {
    eligible: boolean;
    eligibleLoans: Array<{
      id: number;
      monto_principal: number;
      total_a_devolver: number;
      pendingDebt: number;
    }>;
    totalPendingDebt: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const LoanRenewal: React.FC<LoanRenewalProps> = ({ 
  clientId, 
  clientName, 
  eligibilityData, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    nuevoMontoPrincipal: eligibilityData.totalPendingDebt + 100000, // Deuda + 100k mínimo
    montoDiario: Math.round((eligibilityData.totalPendingDebt + 100000) * 1.2 / 30), // Aproximadamente 20% interés
    plazoDias: 30,
    fechaInicioCobro: new Date().toISOString().split('T')[0]
  });

  const queryClient = useQueryClient();

  const createRenewalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/loan-renewal/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear renovación');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`¡Renovación exitosa! Efectivo entregado: ${data.montoEfectivoEntregado.toLocaleString()} Gs`);
      // Invalidar todas las queries relacionadas con préstamos y pagos
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.nuevoMontoPrincipal <= eligibilityData.totalPendingDebt) {
      toast.error('El nuevo monto debe ser mayor a la deuda pendiente');
      return;
    }

    createRenewalMutation.mutate({
      userId: clientId,
      nuevoMontoPrincipal: formData.nuevoMontoPrincipal,
      interesTotalPercent: interesTotalPercent,
      plazoDias: formData.plazoDias,
      fechaInicioCobro: formData.fechaInicioCobro,
      loanIdsToClose: eligibilityData.eligibleLoans.map(loan => loan.id)
    });
  };

  const montoEfectivo = formData.nuevoMontoPrincipal - eligibilityData.totalPendingDebt;
  const totalADevolver = formData.montoDiario * formData.plazoDias;
  const interesTotalPercent = formData.nuevoMontoPrincipal > 0 ? 
    ((totalADevolver - formData.nuevoMontoPrincipal) / formData.nuevoMontoPrincipal * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4">
            <span className="text-xl text-white">🔄</span>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-slate-800">Renovar Préstamo</h3>
            <p className="text-slate-600">{clientName}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Resumen de deuda actual */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
          <h4 className="text-lg font-bold text-amber-800 mb-4">📋 Deuda Pendiente</h4>
          <div className="space-y-2">
            {eligibilityData.eligibleLoans.map((loan, index) => (
              <div key={loan.id} className="flex justify-between text-sm">
                <span>Préstamo #{index + 1}</span>
                <span className="font-bold">{loan.pendingDebt.toLocaleString()} Gs</span>
              </div>
            ))}
            <div className="border-t border-amber-300 pt-2 flex justify-between font-bold text-amber-800">
              <span>Total a Pagar:</span>
              <span>{eligibilityData.totalPendingDebt.toLocaleString()} Gs</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nuevo Monto Principal (Gs)
              </label>
              <input
                type="number"
                value={formData.nuevoMontoPrincipal}
                onChange={(e) => setFormData({...formData, nuevoMontoPrincipal: parseInt(e.target.value)})}
                min={eligibilityData.totalPendingDebt + 1}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Mínimo: {(eligibilityData.totalPendingDebt + 1).toLocaleString()} Gs
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Monto Diario (Gs)
              </label>
              <input
                type="number"
                value={formData.montoDiario}
                onChange={(e) => setFormData({...formData, montoDiario: parseInt(e.target.value)})}
                min="1000"
                step="1000"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Plazo (días)
              </label>
              <input
                type="number"
                value={formData.plazoDias}
                onChange={(e) => setFormData({...formData, plazoDias: parseInt(e.target.value)})}
                min="1"
                max="365"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha Inicio Cobro
              </label>
              <input
                type="date"
                value={formData.fechaInicioCobro}
                onChange={(e) => setFormData({...formData, fechaInicioCobro: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Resumen del nuevo préstamo */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-green-800 mb-4">💰 Resumen del Nuevo Préstamo</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-slate-600">Efectivo a Entregar</p>
                <p className="text-2xl font-bold text-green-600">{montoEfectivo.toLocaleString()} Gs</p>
              </div>
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-slate-600">Total a Devolver</p>
                <p className="text-xl font-bold text-slate-800">{totalADevolver.toLocaleString()} Gs</p>
              </div>
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-slate-600">Cuota Diaria</p>
                <p className="text-xl font-bold text-slate-800">{formData.montoDiario.toLocaleString()} Gs</p>
              </div>
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-slate-600">Interés Total</p>
                <p className="text-xl font-bold text-purple-600">{(interesTotalPercent || 0).toFixed(1)}%</p>
              </div>
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-slate-600">Deuda que se Paga</p>
                <p className="text-xl font-bold text-amber-600">{eligibilityData.totalPendingDebt.toLocaleString()} Gs</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-200 text-slate-700 py-3 px-6 rounded-xl hover:bg-slate-300 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createRenewalMutation.isLoading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 font-bold shadow-lg disabled:opacity-50"
            >
              {createRenewalMutation.isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Procesando...
                </div>
              ) : (
                '🔄 Renovar Préstamo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanRenewal;