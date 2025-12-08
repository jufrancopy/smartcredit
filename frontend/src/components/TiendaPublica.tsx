import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const TiendaPublica: React.FC = () => {
  const { clienteSlug } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientStore = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/investments/tienda/${clienteSlug}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (clienteSlug) {
      fetchClientStore();
    }
  }, [clienteSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Tienda no encontrada</h1>
          <p className="text-gray-600">Esta tienda no existe o no está disponible</p>
        </div>
      </div>
    );
  }

  const { client, products } = data;
  const template = client.tienda_template || 'clasica';

  const templates = {
    clasica: {
      bg: 'bg-gradient-to-br from-purple-100 to-pink-200',
      title: 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent',
      badge: 'bg-purple-100 text-purple-800',
      button: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      accent: 'text-purple-600'
    },
    moderna: {
      bg: 'bg-gradient-to-br from-blue-100 to-indigo-200',
      title: 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent',
      badge: 'bg-blue-100 text-blue-800',
      button: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600',
      accent: 'text-blue-600'
    },
    natural: {
      bg: 'bg-gradient-to-br from-green-100 to-emerald-200',
      title: 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent',
      badge: 'bg-green-100 text-green-800',
      button: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
      accent: 'text-green-600'
    }
  };

  const currentTemplate = templates[template] || templates.clasica;

  return (
    <div className={`min-h-screen ${currentTemplate.bg}`}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className={`text-4xl font-bold ${currentTemplate.title} mb-2`}>
            {client.tienda_nombre || `Tienda de ${client.nombre} ${client.apellido}`}
          </h1>
          <p className="text-gray-600 text-lg">Productos frescos y de calidad</p>
          
          {/* WhatsApp Contact */}
          <div className="mt-6">
            <a
              href={`https://wa.me/${client.whatsapp.startsWith('595') ? client.whatsapp : '595' + client.whatsapp}?text=${encodeURIComponent(`Hola! Vi tu tienda online "${client.tienda_nombre || `Tienda de ${client.nombre} ${client.apellido}`}" y me interesa conocer más sobre tus productos disponibles.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              📱 Contactar por WhatsApp
            </a>
          </div>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product: any) => (
              <div key={product.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden">
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 truncate">
                      {product.nombre.length > 18 ? product.nombre.substring(0, 18) + '...' : product.nombre}
                    </h3>
                    <span className={`${currentTemplate.badge} text-xs font-semibold px-3 py-1 rounded-full`}>
                      {product.categoria}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 h-10 overflow-hidden">
                    {product.descripcion && product.descripcion.length > 70 
                      ? product.descripcion.substring(0, 70) + '...' 
                      : product.descripcion}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">
                        {product.precio_cliente.toLocaleString('es-PY')} Gs
                      </span>
                      <span className="text-sm text-gray-500">
                        {product.cantidad_disponible} {product.unidad}s disponibles
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {product.cantidad_por_unidad} por {product.unidad}
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <a
                      href={`https://wa.me/${client.whatsapp.startsWith('595') ? client.whatsapp : '595' + client.whatsapp}?text=${encodeURIComponent(`Hola! Vi tu tienda online y me interesa:

📦 *${product.nombre}*
💰 Precio: ${product.precio_cliente.toLocaleString('es-PY')} Gs
📝 ${product.descripcion}

¿Está disponible? ¿Cuándo podríamos coordinar?`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full ${currentTemplate.button} text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 text-center block`}
                    >
                      💬 Consultar por WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Sin productos disponibles</h3>
            <p className="text-gray-600">Esta tienda no tiene productos en stock actualmente</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 py-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Tienda online powered by <span className={`font-semibold ${currentTemplate.accent}`}>SmartCredit</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TiendaPublica;