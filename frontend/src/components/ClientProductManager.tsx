import React, { useState } from 'react';
import { useGetClientProducts, useCreateClientProduct, useUpdateClientProduct, useDeleteClientProduct, useUploadProductImage, useGetCategories } from '../queries';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const ClientProductManager: React.FC = () => {
  const { data: products, isLoading, error } = useGetClientProducts();
  const { data: categories } = useGetCategories();
  const queryClient = useQueryClient();
  
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  
  const createProduct = useCreateClientProduct({
    onSuccess: () => {
      toast.success('Producto creado');
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['client-products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
  
  const updateProduct = useUpdateClientProduct({
    onSuccess: () => {
      toast.success('Producto actualizado');
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ['client-products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
  
  const deleteProduct = useDeleteClientProduct({
    onSuccess: () => {
      toast.success('Producto eliminado');
      queryClient.invalidateQueries({ queryKey: ['client-products'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
  
  const uploadImage = useUploadProductImage({
    onSuccess: (data) => {
      setUploadedImageUrl(data.imagen_url);
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
      precio: parseFloat(formData.get('precio') as string),
      stock: parseInt(formData.get('stock') as string),
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
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      uploadImage.mutate(file);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setSelectedImage(null);
    setImagePreview('');
    setUploadedImageUrl('');
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
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🏪 Mis Productos</h2>
          <p className="text-gray-600">Gestiona los productos de tu negocio</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
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
                  src={`http://localhost:3000${product.imagen_url}`} 
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
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                  {product.categoria}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{product.descripcion}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Precio:</span>
                  <span className="font-bold text-green-600">{product.precio.toLocaleString('es-PY')} Gs</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Stock:</span>
                  <span className={`font-bold ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {product.stock} unidades
                  </span>
                </div>
              </div>
              
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
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No tienes productos</h3>
          <p className="text-gray-600">Agrega productos de tu negocio para mostrar en tu tienda</p>
        </div>
      )}

      {/* Modal Formulario */}
      {(showForm || editingProduct) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input name="nombre" defaultValue={editingProduct?.nombre} placeholder="Nombre del producto" className="w-full p-3 border rounded-lg" required />
              <textarea name="descripcion" defaultValue={editingProduct?.descripcion} placeholder="Descripción" className="w-full p-3 border rounded-lg" />
              
              <input 
                name="categoria" 
                defaultValue={editingProduct?.categoria}
                placeholder="Categoría (ej: Muebles, Electrónicos)" 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                list="categories-list"
                required 
              />
              {categories && categories.length > 0 && (
                <datalist id="categories-list">
                  {categories.map((cat: string) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              )}
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Foto del producto</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleImageChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {(imagePreview || editingProduct?.imagen_url) && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Vista previa:</p>
                    <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
                      <img 
                        src={imagePreview || (editingProduct?.imagen_url ? `http://localhost:3000${editingProduct.imagen_url}` : '')} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg border shadow-md"
                      />
                    </div>
                  </div>
                )}
                {uploadImage.isLoading && (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Subiendo imagen...</span>
                  </div>
                )}
              </div>
              
              <input name="precio" type="number" defaultValue={editingProduct?.precio} placeholder="Precio (Gs)" className="w-full p-3 border rounded-lg" required />
              <input name="stock" type="number" defaultValue={editingProduct?.stock} placeholder="Stock disponible" className="w-full p-3 border rounded-lg" required />
              
              <div className="flex space-x-3">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg">
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
    </div>
  );
};

export default ClientProductManager;