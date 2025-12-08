import React, { useState } from 'react';
import { useGetApprovedConsignments, useCancelInvestment } from '../queries';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const ConsignmentTracking: React.FC = () => {
  const { data: approvedConsignments, isLoading, error } = useGetApprovedConsignments();
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);
  const queryClient = useQueryClient();
  
  const cancelInvestment = useCancelInvestment({
    onSuccess: () => {
      toast.success('Compra cancelada exitosamente');
      setConfirmCancel(null);
      queryClient.invalidateQueries({ queryKey: ['approved-consignments'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

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
        <p className="text-red-600">Error al cargar productos en seguimiento</p>
      </div>
    );
  }

  if (!approvedConsignments || approvedConsignments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No hay productos en seguimiento</h3>
        <p className="text-gray-600">Los productos consignados aprobados aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {approvedConsignments.map((investment: any) => {
        const totalVendido = investment.salesReports?.reduce((sum: number, sale: any) => sum + sale.cantidad_vendida, 0) || 0;
        const cantidadRestante = investment.cantidad_comprada - totalVendido;
        const progreso = (totalVendido / investment.cantidad_comprada) * 100;
        
        return (
          <div key={investment.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{investment.product.nombre}</h3>
                  <p className="text-sm text-gray-600">{investment.user.nombre} {investment.user.apellido}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                  ✅ Activo
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cantidad total:</span>
                  <span className="font-medium">{investment.cantidad_comprada} {investment.product.unidad}s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Vendido:</span>
                  <span className="font-medium text-blue-600">{totalVendido} {investment.product.unidad}s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Restante:</span>
                  <span className="font-medium text-orange-600">{cantidadRestante} {investment.product.unidad}s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monto total:</span>
                  <span className="font-bold text-purple-600">{investment.monto_total.toLocaleString('es-PY')} Gs</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pagado:</span>
                  <span className="font-bold text-green-600">{investment.monto_pagado.toLocaleString('es-PY')} Gs</span>
                </div>
                {investment.monto_total > investment.monto_pagado && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Saldo pendiente:</span>
                    <span className="font-bold text-red-600">{(investment.monto_total - investment.monto_pagado).toLocaleString('es-PY')} Gs</span>
                  </div>
                )}
              </div>
              
              {/* Barra de progreso */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progreso de ventas</span>
                  <span>{progreso.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progreso}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Aprobado: {new Date(investment.createdAt).toLocaleDateString('es-PY')}
                </div>
                <button
                  onClick={() => setConfirmCancel(investment.id)}
                  className="text-red-600 hover:text-red-800 text-xs font-semibold"
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
    
    {/* Modal de confirmación */}
    {confirmCancel && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h3 className="text-xl font-bold text-gray-800 mb-4">⚠️ Cancelar Compra</h3>
          <p className="text-gray-600 mb-6">
            Esta acción restaurará el stock y devolverá los fondos pagados al cliente.
            ¿Estás seguro?
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => setConfirmCancel(null)}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={() => cancelInvestment.mutate({ investmentId: confirmCancel })}
              disabled={cancelInvestment.isLoading}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
            >
              {cancelInvestment.isLoading ? 'Cancelando...' : 'Sí, cancelar'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ConsignmentTracking;