import React from 'react';
import { useGetCollectorStores } from '../queries';

const StoreMonitor: React.FC = () => {
  const { data: stores, isLoading, error } = useGetCollectorStores();
  
  // Debug: mostrar datos recibidos
  console.log('StoreMonitor - Datos recibidos:', stores);

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
        <p className="text-red-600">Error al cargar tiendas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Monitoreo de Tiendas</h2>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
          {stores?.length || 0} tiendas activas
        </span>
      </div>

      {stores?.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Sin tiendas activas</h3>
          <p className="text-gray-600">Los clientes aún no han activado sus tiendas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stores?.map((store: any) => (
            <div key={store.cliente.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h3 className="text-lg font-bold">{store.cliente.tienda_nombre || `Tienda de ${store.cliente.nombre}`}</h3>
                    <p className="text-purple-100 text-sm">{store.cliente.nombre}</p>
                  </div>
                  <a
                    href={`/tienda/${store.cliente.tienda_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg text-sm font-semibold transition-all duration-300"
                  >
                    🔗 Ver Tienda
                  </a>
                </div>
              </div>

              <div className="p-6">
                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{store.estadisticas.total_inversiones}</div>
                    <div className="text-xs text-gray-500">Inversiones</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(store.estadisticas.total_ventas || 0).toLocaleString('es-PY')} Gs
                    </div>
                    <div className="text-xs text-gray-500">Total Ventas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{store.estadisticas.ventas_recientes || 0}</div>
                    <div className="text-xs text-gray-500">Ventas Recientes</div>
                  </div>
                </div>

                {/* Ventas Recientes */}
                {store.ventas_recientes.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Últimas Ventas</h4>
                    <div className="space-y-2">
                      {store.ventas_recientes.map((venta: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-sm">{venta.cantidad_vendida} unidades</div>
                            <div className="text-xs text-gray-500">
                              {new Date(venta.fecha_venta).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              {venta.monto_total_venta.toLocaleString('es-PY')} Gs
                            </div>
                            <div className="text-xs text-gray-500">
                              Ganancia: {venta.ganancia_generada.toLocaleString('es-PY')} Gs
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {store.ventas_recientes.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <div className="text-2xl mb-2">📊</div>
                    <p className="text-sm">Sin ventas recientes</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoreMonitor;