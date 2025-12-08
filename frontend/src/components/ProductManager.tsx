import React, { useState } from 'react';
import { useGetProducts, useCreateProduct, useUpdateProduct, useUpdateStock, useDeleteProduct, useUploadProductImage } from '../queries';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const ProductManager: React.FC = () => {
  const { data: products, isLoading, error } = useGetProducts();
  const queryClient = useQueryClient();
  
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showStockModal, setShowStockModal] = useState<any>(null);
  const [stockValue, setStockValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  
  const createProduct = useCreateProduct({
    onSuccess: () => {
      toast.success('Producto creado');
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
  
  const updateProduct = useUpdateProduct({
    onSuccess: () => {
      toast.success('Producto actualizado');
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
  
  const updateStock = useUpdateStock({
    onSuccess: () => {
      toast.success('Stock actualizado');
      setShowStockModal(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
  
  const deleteProduct = useDeleteProduct({
    onSuccess: () => {
      toast.success('Producto eliminado');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
  
  const uploadImage = useUploadProductImage({
    onSuccess: (data) => {
      setUploadedImageUrl(data.imagen_url);
      console.log('Imagen subida:', data.imagen_url);
    },
    onError: (error: any) => {
      toast.error(error.message);
      setImagePreview('');
      setUploadedImageUrl('');
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: formData.get('nombre'),
      descripcion: formData.get('descripcion'),
      categoria: formData.get('categoria'),
      precio_compra: parseInt((formData.get('precio_compra') as string).replace(/\D/g, '')),
      precio_venta_sugerido: parseInt((formData.get('precio_venta_sugerido') as string).replace(/\D/g, '')),
      stock_disponible: parseFloat(formData.get('stock_disponible') as string),
      unidad: formData.get('unidad'),
      cantidad_por_unidad: parseFloat(formData.get('cantidad_por_unidad') as string),
      imagen_url: uploadedImageUrl || editingProduct?.imagen_url
    };
    
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, ...data });
    } else {
      createProduct.mutate(data);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Mostrar preview local inmediatamente
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      // Subir archivo
      uploadImage.mutate(file);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setSelectedImage(null);
    setImagePreview('');
    setUploadedImageUrl('');
    // Limpiar el input de archivo
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleStockUpdate = () => {
    if (showStockModal && stockValue) {
      updateStock.mutate({ id: showStockModal.id, stock_disponible: parseFloat(stockValue) });
    }
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

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Productos</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
        >
          ➕ Agregar Producto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((product: any) => (
          <div key={product.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden">
            {product.imagen_url && (
              <div className="h-48 bg-gray-200 overflow-hidden">
                <img 
                  src={`${import.meta.env.VITE_API_BASE_URL}${product.imagen_url}`} 
                  alt={product.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">{product.nombre}</h3>
                <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                  {product.categoria}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{product.descripcion}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Precio Compra:</span>
                  <span className="font-bold text-red-600">{product.precio_compra.toLocaleString('es-PY')} Gs</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Precio Venta:</span>
                  <span className="font-bold text-green-600">{product.precio_venta_sugerido.toLocaleString('es-PY')} Gs</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Ganancia:</span>
                  <span className="font-bold text-purple-600">
                    {product.ganancia_potencial.toLocaleString('es-PY')} Gs ({product.margen_porcentaje}%)
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Stock Bodega:</span>
                  <span className={`font-bold ${product.stock_disponible > 10 ? 'text-green-600' : product.stock_disponible > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {product.stock_disponible} {product.unidad}s
                  </span>
                </div>
                
                {product.total_en_clientes > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">En Clientes:</span>
                    <span className="font-bold text-blue-600">
                      {product.total_en_clientes} {product.unidad}s
                    </span>
                  </div>
                )}
                
                {product.microcreditos_pendientes > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Microcréditos:</span>
                    <span className="font-bold text-orange-600">
                      {product.microcreditos_pendientes} pendientes
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Unidad:</span>
                  <span className="text-gray-700">{product.cantidad_por_unidad} por {product.unidad}</span>
                </div>
              </div>
              
              {product.detalle_inventario && product.detalle_inventario.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Distribución:</h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {product.detalle_inventario.map((detalle: any, index: number) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className={detalle.vencido ? 'text-red-600' : 'text-gray-600'}>
                          {detalle.cliente}
                        </span>
                        <span className={`font-medium ${
                          detalle.vencido ? 'text-red-600' : 
                          !detalle.pagado ? 'text-orange-600' : 'text-gray-700'
                        }`}>
                          {detalle.cantidad_disponible} {product.unidad}s
                          {!detalle.pagado && ' (MC)'}
                          {detalle.vencido && ' (Vencido)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex space-x-2">
                <button 
                  onClick={() => {
                    setEditingProduct(product);
                    setImagePreview('');
                    setUploadedImageUrl(product.imagen_url || '');
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 text-sm"
                >
                  ✏️ Editar
                </button>
                <button 
                  onClick={() => {
                    setShowStockModal(product);
                    setStockValue(product.stock_disponible.toString());
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 text-sm"
                >
                  📦 Stock
                </button>
                <button 
                  onClick={() => {
                    if (confirm('¿Eliminar este producto?')) {
                      deleteProduct.mutate(product.id);
                    }
                  }}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2 px-3 rounded-lg transition-all duration-300 text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {products?.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No hay productos</h3>
          <p className="text-gray-600">Agrega productos para que los clientes puedan invertir</p>
        </div>
      )}

      {/* Modal Formulario */}
      {(showForm || editingProduct) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input name="nombre" defaultValue={editingProduct?.nombre} placeholder="Nombre" className="w-full p-3 border rounded-lg" required />
              <textarea name="descripcion" defaultValue={editingProduct?.descripcion} placeholder="Descripción" className="w-full p-3 border rounded-lg" required />
              <input name="categoria" defaultValue={editingProduct?.categoria} placeholder="Categoría" className="w-full p-3 border rounded-lg" required />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Foto del producto</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleImageChange}
                  className="w-full p-3 border rounded-lg"
                />
                {(imagePreview || editingProduct?.imagen_url) && (
                  <div className="mt-2">
                    <img 
                      src={imagePreview || (editingProduct?.imagen_url ? `${import.meta.env.VITE_API_BASE_URL}${editingProduct.imagen_url}` : '')} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
              <input 
                name="precio_compra" 
                type="text" 
                defaultValue={editingProduct?.precio_compra?.toLocaleString('es-PY')} 
                placeholder="Precio Compra (Gs)" 
                className="w-full p-3 border rounded-lg" 
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  e.target.value = value ? parseInt(value).toLocaleString('es-PY') : '';
                }}
                required 
              />
              <input 
                name="precio_venta_sugerido" 
                type="text" 
                defaultValue={editingProduct?.precio_venta_sugerido?.toLocaleString('es-PY')} 
                placeholder="Precio Venta (Gs)" 
                className="w-full p-3 border rounded-lg" 
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  e.target.value = value ? parseInt(value).toLocaleString('es-PY') : '';
                }}
                required 
              />
              <input 
                name="stock_disponible" 
                type="number" 
                step="0.01" 
                defaultValue={editingProduct?.stock_disponible} 
                placeholder="Stock disponible" 
                className="w-full p-3 border rounded-lg" 
                required 
              />
              <select name="unidad" defaultValue={editingProduct?.unidad} className="w-full p-3 border rounded-lg" required>
                <option value="">Seleccionar unidad</option>
                <option value="unidad">Unidad (productos individuales)</option>
                <option value="paquete">Paquete (cajas, bolsas)</option>
                <option value="plancha">Plancha (huevos)</option>
                <option value="kilo">Kilo (peso)</option>
                <option value="litro">Litro (líquidos)</option>
                <option value="metro">Metro (telas, cables)</option>
                <option value="docena">Docena (12 unidades)</option>
              </select>
              <input 
                name="cantidad_por_unidad" 
                type="number" 
                step="0.01" 
                defaultValue={editingProduct?.cantidad_por_unidad} 
                placeholder="Cantidad por unidad (ej: 1 para kilo, 12 para docena)" 
                className="w-full p-3 border rounded-lg" 
                required 
              />
              
              <div className="flex space-x-3">
                <button type="submit" className="flex-1 bg-purple-600 text-white py-2 rounded-lg">
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" onClick={resetForm} className="flex-1 bg-gray-500 text-white py-2 rounded-lg">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Stock */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-xl font-bold mb-4">Actualizar Stock</h3>
            <p className="text-gray-600 mb-4">{showStockModal.nombre}</p>
            <input 
              type="number" 
              step="0.01"
              value={stockValue} 
              onChange={(e) => setStockValue(e.target.value)}
              placeholder="Nuevo stock" 
              className="w-full p-3 border rounded-lg mb-4" 
            />
            <div className="flex space-x-3">
              <button onClick={handleStockUpdate} className="flex-1 bg-green-600 text-white py-2 rounded-lg">
                Actualizar
              </button>
              <button onClick={() => setShowStockModal(null)} className="flex-1 bg-gray-500 text-white py-2 rounded-lg">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;