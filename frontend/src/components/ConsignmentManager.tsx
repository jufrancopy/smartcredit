import React, { useState } from 'react';
import { useGetPendingConsignments, useApproveConsignment, useRejectConsignment } from '../queries';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const ConsignmentManager: React.FC = () => {
  const { data: pendingConsignments, isLoading, error } = useGetPendingConsignments();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject', id: number } | null>(null);

  const approveConsignment = useApproveConsignment({
    onSuccess: () => {
      toast.success('Consignación aprobada');
      queryClient.invalidateQueries({ queryKey: ['pending-consignments'] });
      queryClient.invalidateQueries({ queryKey: ['approved-consignments'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['userInvestments'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const rejectConsignment = useRejectConsignment({
    onSuccess: () => {
      toast.success('Consignación rechazada');
      queryClient.invalidateQueries({ queryKey: ['pending-consignments'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['userInvestments'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleApprove = (investmentId: number) => {
    setConfirmAction({ type: 'approve', id: investmentId });
  };

  const handleReject = (investmentId: number) => {
    setConfirmAction({ type: 'reject', id: investmentId });
  };

  const confirmApprove = () => {
    if (confirmAction) {
      approveConsignment.mutate({ investmentId: confirmAction.id });
      setConfirmAction(null);
    }
  };

  const confirmReject = () => {
    if (confirmAction) {
      rejectConsignment.mutate({ investmentId: confirmAction.id });
      setConfirmAction(null);
    }
  };

  const getTimeRemaining = (fechaLimite: string) => {
    const now = new Date();
    const limite = new Date(fechaLimite);
    const diff = limite.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return hours > 0 ? `${hours}h restantes` : 'Vencido';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-xl mb-4">❌</div>
        <p className="text-red-600">Error al cargar consignaciones</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📋 Consignaciones Pendientes</h2>
        <p className="text-gray-600">Gestiona las solicitudes de consignación de los clientes</p>
      </div>

      {!pendingConsignments || pendingConsignments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No hay consignaciones pendientes</h3>
          <p className="text-gray-600">Todas las solicitudes han sido procesadas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingConsignments.map((investment: any) => {
            const isExpired = investment.fecha_limite_pago && new Date() > new Date(investment.fecha_limite_pago);
            
            return (
              <div key={investment.id} className={`bg-white rounded-xl shadow-lg border-2 overflow-hidden ${
                isExpired ? 'border-red-300' : investment.tipo_pago === 'microcredito' ? 'border-orange-300' : 'border-green-300'
              }`}>
                <div className={`p-4 ${
                  isExpired ? 'bg-red-50' : investment.tipo_pago === 'microcredito' ? 'bg-orange-50' : 'bg-green-50'
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isExpired ? 'bg-red-200 text-red-800' : 
                      investment.tipo_pago === 'microcredito' ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'
                    }`}>
                      {investment.tipo_pago === 'microcredito' ? '📋 Consignación' : '💰 Pago Directo'}
                    </span>
                    {investment.fecha_limite_pago && (
                      <span className={`text-xs font-medium ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                        {getTimeRemaining(investment.fecha_limite_pago)}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{investment.product.nombre}</h3>
                  <p className="text-sm text-gray-600 mb-3">{investment.product.descripcion}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Cliente:</span>
                      <span className="font-medium">{investment.user.nombre} {investment.user.apellido}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">WhatsApp:</span>
                      <span className="font-medium">{investment.user.whatsapp}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Cantidad:</span>
                      <span className="font-medium">{investment.cantidad_comprada} {investment.product.unidad}s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Monto Total:</span>
                      <span className="font-bold text-purple-600">{investment.monto_total.toLocaleString('es-PY')} Gs</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Fecha:</span>
                      <span className="font-medium">{new Date(investment.createdAt).toLocaleDateString('es-PY')}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprove(investment.id)}
                      disabled={approveConsignment.isLoading}
                      className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 text-sm"
                    >
                      ✅ Aprobar
                    </button>
                    <button
                      onClick={() => handleReject(investment.id)}
                      disabled={rejectConsignment.isLoading}
                      className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 text-sm"
                    >
                      ❌ Rechazar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Modal de confirmación DaisyUI */}
      {confirmAction && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {confirmAction.type === 'approve' ? '¿Aprobar consignación?' : '¿Rechazar consignación?'}
            </h3>
            <p className="py-4">
              {confirmAction.type === 'approve' 
                ? 'Esta acción marcará la consignación como pagada'
                : 'Se restaurará el stock del producto'}
            </p>
            <div className="modal-action">
              <button 
                className={`btn ${confirmAction.type === 'approve' ? 'btn-success' : 'btn-error'}`}
                onClick={confirmAction.type === 'approve' ? confirmApprove : confirmReject}
              >
                {confirmAction.type === 'approve' ? 'Sí, aprobar' : 'Sí, rechazar'}
              </button>
              <button className="btn" onClick={() => setConfirmAction(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsignmentManager;