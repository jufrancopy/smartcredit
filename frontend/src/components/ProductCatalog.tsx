import React, { useState } from 'react';
import { useGetProducts, useBuyProduct, useGetUserInvestments, useRequestRestock } from '../queries';
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
  const [cantidad, setCantidad] = useState('1');
  const [precioReventa, setPrecioReventa] = useState(0);
  const [editingInvestment, setEditingInvestment] = useState<any>(null);
  const [newPrice, setNewPrice] = useState(0);
  const [payingInvestment, setPayingInvestment] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentQuantity, setPaymentQuantity] = useState('1');
  const [paymentMode, setPaymentMode] = useState<'amount' | 'quantity'>('quantity');
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [paymentReceiptPreview, setPaymentReceiptPreview] = useState<string>('');
  const queryClient = useQueryClient();

  const buyProduct = useBuyProduct({
    onSuccess: () => {
      toast.success('¡Producto comprado exitosamente!');
      setSelectedProduct(null);
      setCantidad('1');
      setPrecioReventa(0);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['userInvestments'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pending-consignments'] });
      queryClient.invalidateQueries({ queryKey: ['approved-consignments'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const requestRestock = useRequestRestock({
    onSuccess: () => {
      toast.success('Solicitud de restock enviada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleBuyClick = (product: any) => {
    setSelectedProduct(product);
    setCantidad('1');
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
      


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product: any) => {
          const montoTotal = product.precio_compra * 1;
          const puedeComprar = fondoDisponible >= montoTotal && product.stock_disponible > 0;
          
          // Verificar si ya tiene este producto (activo o pendiente)
          const yaComprado = investments?.some((inv: any) => 
            inv.productId === product.id && 
            (inv.estado === 'activo' || inv.estado === 'vendido_parcial' || !inv.pagado)
          );
          
          // Obtener el estado del producto si ya fue comprado
          const investmentStatus = investments?.find((inv: any) => 
            inv.productId === product.id && 
            (inv.estado === 'activo' || inv.estado === 'vendido_parcial' || !inv.pagado)
          );
          
          return (
            <div key={product.id} className="space-y-4">
              {/* Card de inversión si existe */}
              {investmentStatus && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-gray-800">{investmentStatus.product.nombre}</h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      investmentStatus.esta_aprobado ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {investmentStatus.esta_aprobado ? 'Aprobado' : 'Pendiente de Aprobación'}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <div className="flex justify-between">
                      <span>Cantidad disponible:</span>
                      <span className="font-semibold">{investmentStatus.cantidad_restante} {investmentStatus.product.unidad}s</span>
                    </div>
                    {investmentStatus.esta_aprobado && (
                      <>
                        <div className="flex justify-between">
                          <span>Mi precio actual:</span>
                          <span className="font-semibold text-green-600">
                            {(investmentStatus.precio_reventa_cliente || investmentStatus.product.precio_venta_sugerido).toLocaleString('es-PY')} Gs
                          </span>
                        </div>
                        {investmentStatus.tipo_pago === 'microcredito' && investmentStatus.saldo_pendiente > 0 && (
                          <div className="flex justify-between">
                            <span>Saldo pendiente:</span>
                            <span className="font-semibold text-red-600">
                              {investmentStatus.saldo_pendiente.toLocaleString('es-PY')} Gs
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {investmentStatus.esta_aprobado ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setEditingInvestment(investmentStatus);
                          setNewPrice(investmentStatus.precio_reventa_cliente || investmentStatus.product.precio_venta_sugerido);
                        }}
                        className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                      >
                        ✏️ Editar Precio
                      </button>
                      {investmentStatus.tipo_pago === 'microcredito' && investmentStatus.saldo_pendiente > 0 && (
                        <button
                          onClick={() => {
                            const cantidadRestante = investmentStatus.cantidad_comprada - (investmentStatus.cantidad_vendida || 0);
                            setPayingInvestment({...investmentStatus, cantidad_restante: cantidadRestante});
                            setPaymentAmount(investmentStatus.saldo_pendiente);
                            setPaymentQuantity('1');
                            setPaymentMode('quantity');
                          }}
                          className="w-full bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                        >
                          💰 Pagar Consignación
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-3 text-gray-500 text-sm">
                      ⏳ Esperando aprobación del cobrador
                    </div>
                  )}
                </div>
              )}
              
              {/* Card del producto del catálogo */}
              <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 ${
                investmentStatus && investmentStatus.pagado && product.stock_disponible === 0 ? 'opacity-75' : ''
              }`}>
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
                  <h4 className="text-lg font-bold text-gray-800 truncate">
                    {product.nombre.length > 20 ? product.nombre.substring(0, 20) + '...' : product.nombre}
                  </h4>
                  <div className="flex gap-2">
                    <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full">
                      {product.categoria}
                    </span>
                    {yaComprado && investmentStatus && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        investmentStatus.esta_aprobado 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {investmentStatus.esta_aprobado ? '✅ Aprobado' : '⏳ Pendiente'}
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 h-10 overflow-hidden">
                  {product.descripcion && product.descripcion.length > 80 
                    ? product.descripcion.substring(0, 80) + '...' 
                    : product.descripcion}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Precio de compra:</span>
                    <span className="font-bold text-red-600">{product.precio_venta_sugerido.toLocaleString('es-PY')} Gs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Precio venta sugerido:</span>
                    <span className="font-bold text-green-600">{product.precio_venta_sugerido.toLocaleString('es-PY')} Gs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Tu ganancia mínima:</span>
                    <span className="font-bold text-purple-600">
                      0 Gs (0%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Stock disponible:</span>
                    <span className={`font-bold ${product.stock_disponible > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock_disponible} {product.unidad}s
                    </span>
                  </div>
                </div>
                
                {/* Lógica de botones según estado del producto y pago */}
                {investmentStatus && investmentStatus.pagado && product.stock_disponible === 0 ? (
                  <div className="space-y-2">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <span className="text-green-800 font-semibold text-sm">✅ Producto Pagado Completamente</span>
                    </div>
                    <button
                      onClick={() => requestRestock.mutate({ productId: product.id })}
                      disabled={requestRestock.isLoading}
                      className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {requestRestock.isLoading ? 'Enviando...' : '🔄 Solicitar Restock'}
                    </button>
                  </div>
                ) : product.stock_disponible === 0 ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-lg font-semibold bg-gray-300 text-gray-500 cursor-not-allowed"
                  >
                    ❌ Sin stock
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuyClick(product)}
                    disabled={yaComprado}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                      !yaComprado
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {yaComprado ? '✅ Ya solicitado' : '🛒 Ver opciones'}
                  </button>
                )}
              </div>
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
                  type="text"
                  value={cantidad}
                  onChange={(e) => {
                    const value = e.target.value;
                    const regex = /^[0-9]*[.,]?[0-9]*$/;
                    if (value === '' || regex.test(value)) {
                      setCantidad(value.replace(',', '.'));
                    }
                  }}
                  onBlur={() => {
                    if (!cantidad || parseFloat(cantidad) <= 0) {
                      setCantidad('1');
                    }
                  }}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Cantidad (ej: 3.5)"
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
                  <span className="font-bold">{parseFloat(cantidad) || 1} {selectedProduct.unidad}s</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total a pagar:</span>
                  <span className="text-purple-600">{(selectedProduct.precio_compra * (parseFloat(cantidad) || 1)).toLocaleString('es-PY')} Gs</span>
                </div>
                <div className="flex justify-between text-sm text-green-600 mt-1">
                  <span>Ganancia potencial:</span>
                  <span>+{(((precioReventa || selectedProduct.precio_venta_sugerido) - selectedProduct.precio_compra) * (parseFloat(cantidad) || 1)).toLocaleString('es-PY')} Gs</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {fondoDisponible >= (selectedProduct.precio_compra * (parseFloat(cantidad) || 1)) && (
                  <button
                    onClick={() => {
                      buyProduct.mutate({
                        productId: selectedProduct.id,
                        cantidad: parseFloat(cantidad) || 1,
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
                        queryClient.invalidateQueries({ queryKey: ['approved-consignments'] });
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
      
      {/* Modal para pago parcial de consignación */}
      {payingInvestment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Pagar Consignación</h3>
              <button onClick={() => setPayingInvestment(null)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">{payingInvestment.product.nombre}</h4>
                <p className="text-sm text-gray-600">{payingInvestment.cantidad_comprada} {payingInvestment.product.unidad}s</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Cantidad total:</span>
                  <span className="font-bold">{payingInvestment.cantidad_comprada} {payingInvestment.product.unidad}s</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Cantidad restante:</span>
                  <span className="font-bold text-blue-600">{payingInvestment.cantidad_restante} {payingInvestment.product.unidad}s</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Precio por {payingInvestment.product.unidad}:</span>
                  <span className="font-bold">{payingInvestment.precio_unitario.toLocaleString('es-PY')} Gs</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Saldo pendiente:</span>
                  <span className="text-red-600">{payingInvestment.saldo_pendiente.toLocaleString('es-PY')} Gs</span>
                </div>
              </div>
              
              {/* Selector de modo de pago */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-3">¿Cómo quieres pagar?</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setPaymentMode('quantity');
                      setPaymentQuantity('1');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                      paymentMode === 'quantity'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-300'
                    }`}
                  >
                    📦 Por Cantidad
                  </button>
                  <button
                    onClick={() => {
                      setPaymentMode('amount');
                      setPaymentAmount(0);
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                      paymentMode === 'amount'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-300'
                    }`}
                  >
                    💰 Por Monto
                  </button>
                </div>
              </div>
              
              {paymentMode === 'quantity' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad a pagar ({payingInvestment.product.unidad}s)
                  </label>
                  <input
                    type="text"
                    value={paymentQuantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      const regex = /^[0-9]*[.,]?[0-9]*$/;
                      if (value === '' || regex.test(value)) {
                        setPaymentQuantity(value.replace(',', '.'));
                      }
                    }}
                    onBlur={() => {
                      if (!paymentQuantity || parseFloat(paymentQuantity) <= 0) {
                        setPaymentQuantity('1');
                      }
                    }}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Ej: 1.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo: {payingInvestment.cantidad_restante} {payingInvestment.product.unidad}s
                  </p>
                  <div className="mt-2 p-2 bg-green-50 rounded border">
                    <p className="text-sm text-green-700">
                      💰 Monto a pagar: <span className="font-bold">
                        {(payingInvestment.precio_unitario * (parseFloat(paymentQuantity) || 1)).toLocaleString('es-PY')} Gs
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto a pagar
                  </label>
                  <input
                    type="text"
                    value={paymentAmount === 0 ? '' : paymentAmount.toLocaleString('es-PY')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setPaymentAmount(value ? parseInt(value) : 0);
                    }}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Ingrese monto"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo: {payingInvestment.saldo_pendiente.toLocaleString('es-PY')} Gs
                  </p>
                </div>
              )}
              
              {paymentMode === 'quantity' ? (
                <div className="flex space-x-3">
                  <button
                    onClick={() => setPaymentQuantity(payingInvestment.cantidad_restante.toString())}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg font-semibold hover:bg-blue-700 text-sm"
                  >
                    Pagar Todo
                  </button>
                  <button
                    onClick={() => setPaymentQuantity((payingInvestment.cantidad_restante / 2).toString())}
                    className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg font-semibold hover:bg-gray-700 text-sm"
                  >
                    Pagar Mitad
                  </button>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={() => setPaymentAmount(payingInvestment.saldo_pendiente)}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg font-semibold hover:bg-blue-700 text-sm"
                  >
                    Pagar Todo
                  </button>
                  <button
                    onClick={() => setPaymentAmount(Math.floor(payingInvestment.saldo_pendiente / 2))}
                    className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg font-semibold hover:bg-gray-700 text-sm"
                  >
                    Pagar Mitad
                  </button>
                </div>
              )}
              
              {/* Campo para comprobante */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comprobante de transferencia *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPaymentReceipt(file);
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setPaymentReceiptPreview(e.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
                {paymentReceiptPreview && (
                  <div className="mt-2">
                    <img 
                      src={paymentReceiptPreview} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    try {
                      if (!paymentReceipt) {
                        alert('Por favor sube el comprobante de transferencia');
                        return;
                      }
                      
                      const finalAmount = paymentMode === 'quantity' 
                        ? payingInvestment.precio_unitario * (parseFloat(paymentQuantity) || 1)
                        : paymentAmount;
                      
                      const formData = new FormData();
                      formData.append('investmentId', payingInvestment.id.toString());
                      formData.append('monto', finalAmount.toString());
                      formData.append('comprobante', paymentReceipt);
                        
                      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/investments/pay-microcredit`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: formData
                      });
                      
                      if (response.ok) {
                        const result = await response.json();
                        toast.success(result.message);
                        setPayingInvestment(null);
                        setPaymentReceipt(null);
                        setPaymentReceiptPreview('');
                        queryClient.invalidateQueries({ queryKey: ['userInvestments'] });
                        queryClient.invalidateQueries({ queryKey: ['user'] });
                        queryClient.invalidateQueries({ queryKey: ['approved-consignments'] });
                      } else {
                        const error = await response.json();
                        throw new Error(error.error);
                      }
                    } catch (error: any) {
                      toast.error(error.message);
                    }
                  }}
                  disabled={
                    !paymentReceipt || 
                    (paymentMode === 'quantity' 
                      ? (parseFloat(paymentQuantity) <= 0 || parseFloat(paymentQuantity) > payingInvestment.cantidad_restante)
                      : (paymentAmount <= 0 || paymentAmount > payingInvestment.saldo_pendiente))
                  }
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
                >
                  💰 Confirmar Pago
                </button>
                
                <button
                  onClick={() => {
                    setPayingInvestment(null);
                    setPaymentReceipt(null);
                    setPaymentReceiptPreview('');
                  }}
                  className="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600"
                >
                  Cancelar
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