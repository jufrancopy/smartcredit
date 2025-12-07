import React, { useState } from 'react';
import { useGetProducts, useBuyProduct, useGetUserInvestments } from '../queries';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface ProductCatalogProps {
  userId: number;
  fondoDisponible: number;
}

const ProductCatalog: React.FC<ProductCatalogProps> = ({ userId, fondoDisponible }) => {
  const { data: products, isLoading, error } = useGetProducts();
  const { data: investments } = useGetUserInvestments();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cantidad, setCantidad] = useState(1);
  const [precioReventa, setPrecioReventa] = useState(0);
  const [editingInvestment, setEditingInvestment] = useState<any>(null);
  const [newPrice, setNewPrice] = useState(0);
  const queryClient = useQueryClient();

  const buyProduct = useBuyProduct({
    onSuccess: () => {
      toast.success('¡Producto comprado exitosamente!');
      setSelectedProduct(null);
      setCantidad(1);
      setPrecioReventa(0);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleBuyClick = (product: any) => {
    setSelectedProduct(product);
    setCantidad(1);
    setPrecioReventa(product.precio_venta_sugerido);
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
        <p className="text-red-600">Error al cargar productos</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Sin productos disponibles</h3>
        <p className="text-gray-600">Aún no hay productos para invertir</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">🛒 Catálogo de Productos</h3>
        <p className="text-gray-600">Invierte tu fondo acumulado en productos para revender</p>
      </div>
      
      {/* Sección de productos ya comprados */}
      {investments && investments.length > 0 && (
        <div className="mb-8">
          <h4 className="text-xl font-bold text-gray-800 mb-4">💼 Mis Productos</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {investments.map((investment: any) => {
              const cantidadRestante = investment.cantidad_comprada - (investment.cantidad_vendida || 0);
              if (cantidadRestante <= 0) return null;
              
              return (
                <div key={investment.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-gray-800">{investment.product.nombre}</h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      investment.pagado ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {investment.pagado ? 'Pagado' : 'Consignación'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <div className="flex justify-between">
                      <span>Cantidad disponible:</span>
                      <span className="font-semibold">{cantidadRestante} {investment.product.unidad}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mi precio actual:</span>
                      <span className="font-semibold text-green-600">
                        {(investment.precio_reventa_cliente || investment.product.precio_venta_sugerido).toLocaleString('es-PY')} Gs
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setEditingInvestment(investment);
                      setNewPrice(investment.precio_reventa_cliente || investment.product.precio_venta_sugerido);
                    }}
                    className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    ✏️ Editar Precio
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product: any) => {
          const montoTotal = product.precio_compra * 1;
          const puedeComprar = fondoDisponible >= montoTotal && product.stock_disponible > 0;
          
          // Verificar si ya tiene este producto (activo o pendiente)
          const yaComprado = investments?.some((inv: any) => 
            inv.productId === product.id && 
            (inv.estado === 'activo' || inv.estado === 'vendido_parcial' || !inv.pagado)
          );
          
          return (
            <div key={product.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
              {product.imagen_url && (
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img 
                    src={`${import.meta.env.VITE_API_BASE_URL}${product.imagen_url}`} 
                    alt={product.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-bold text-gray-800">{product.nombre}</h4>
                  <div className="flex gap-2">
                    <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full">
                      {product.categoria}
                    </span>
                    {yaComprado && (
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                        ✅ Solicitado
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{product.descripcion}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Precio de compra:</span>
                    <span className="font-bold text-red-600">{product.precio_compra.toLocaleString('es-PY')} Gs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Precio venta sugerido:</span>
                    <span className="font-bold text-green-600">{product.precio_venta_sugerido.toLocaleString('es-PY')} Gs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Ganancia potencial:</span>
                    <span className="font-bold text-purple-600">
                      {product.ganancia_potencial.toLocaleString('es-PY')} Gs ({product.margen_porcentaje}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Stock disponible:</span>
                    <span className={`font-bold ${product.stock_disponible > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock_disponible} {product.unidad}s
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleBuyClick(product)}
                  disabled={product.stock_disponible === 0 || yaComprado}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    product.stock_disponible > 0 && !yaComprado
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {product.stock_disponible === 0 ? '❌ Sin stock' : 
                   yaComprado ? '✅ Ya solicitado' : '🛒 Ver opciones'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de compra */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Confirmar Compra</h3>
              <button onClick={() => setSelectedProduct(null)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">{selectedProduct.nombre}</h4>
                <p className="text-sm text-gray-600">{selectedProduct.descripcion}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad a comprar
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.stock_disponible}
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo disponible: {selectedProduct.stock_disponible} {selectedProduct.unidad}s
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mi precio de reventa (por {selectedProduct.unidad})
                </label>
                <input
                  type="text"
                  value={precioReventa === 0 ? '' : precioReventa.toLocaleString('es-PY')}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setPrecioReventa(value ? parseInt(value) : 0);
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) {
                      setPrecioReventa(selectedProduct.precio_venta_sugerido);
                    }
                  }}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Precio de venta"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Sugerido: {selectedProduct.precio_venta_sugerido.toLocaleString('es-PY')} Gs
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Precio unitario:</span>
                  <span className="font-bold">{selectedProduct.precio_compra.toLocaleString('es-PY')} Gs</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Cantidad:</span>
                  <span className="font-bold">{cantidad} {selectedProduct.unidad}s</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total a pagar:</span>
                  <span className="text-purple-600">{(selectedProduct.precio_compra * cantidad).toLocaleString('es-PY')} Gs</span>
                </div>
                <div className="flex justify-between text-sm text-green-600 mt-1">
                  <span>Ganancia potencial:</span>
                  <span>+{(((precioReventa || selectedProduct.precio_venta_sugerido) - selectedProduct.precio_compra) * cantidad).toLocaleString('es-PY')} Gs</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {fondoDisponible >= (selectedProduct.precio_compra * cantidad) && (
                  <button
                    onClick={() => {
                      buyProduct.mutate({
                        productId: selectedProduct.id,
                        cantidad: cantidad,
                        tipo_pago: 'inmediato',
                        precio_reventa_cliente: precioReventa
                      });
                    }}
                    disabled={buyProduct.isLoading}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {buyProduct.isLoading ? 'Procesando...' : '💰 Pagar con Fondo Acumulado'}
                  </button>
                )}
                
                <button
                  onClick={() => {
                    buyProduct.mutate({
                      productId: selectedProduct.id,
                      cantidad: cantidad,
                      tipo_pago: 'microcredito',
                      precio_reventa_cliente: precioReventa
                    });
                  }}
                  disabled={buyProduct.isLoading}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-400"
                >
                  {buyProduct.isLoading ? 'Procesando...' : '📋 Solicitar a Consignación (48h)'}
                </button>
                
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para editar precio de reventa */}
      {editingInvestment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Editar Precio de Reventa</h3>
              <button onClick={() => setEditingInvestment(null)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">{editingInvestment.product.nombre}</h4>
                <p className="text-sm text-gray-600">Cantidad disponible: {editingInvestment.cantidad_comprada - (editingInvestment.cantidad_vendida || 0)} {editingInvestment.product.unidad}s</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo precio de reventa (por {editingInvestment.product.unidad})
                </label>
                <input
                  type="text"
                  value={newPrice === 0 ? '' : newPrice.toLocaleString('es-PY')}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setNewPrice(value ? parseInt(value) : 0);
                  }}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nuevo precio"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Precio actual: {(editingInvestment.precio_reventa_cliente || editingInvestment.product.precio_venta_sugerido).toLocaleString('es-PY')} Gs
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Costo por unidad:</span>
                  <span className="font-bold">{editingInvestment.precio_unitario.toLocaleString('es-PY')} Gs</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Nueva ganancia por unidad:</span>
                  <span className="font-bold text-green-600">+{((newPrice || editingInvestment.product.precio_venta_sugerido) - editingInvestment.precio_unitario).toLocaleString('es-PY')} Gs</span>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setEditingInvestment(null)}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/investments/update-price`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                          investmentId: editingInvestment.id,
                          nuevoPrecio: newPrice || editingInvestment.product.precio_venta_sugerido
                        })
                      });
                      
                      if (response.ok) {
                        toast.success('Precio actualizado exitosamente');
                        setEditingInvestment(null);
                        queryClient.invalidateQueries({ queryKey: ['userInvestments'] });
                      } else {
                        throw new Error('Error al actualizar precio');
                      }
                    } catch (error) {
                      toast.error('Error al actualizar precio');
                    }
                  }}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Actualizar Precio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;