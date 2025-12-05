import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaPlusCircle, FaEdit, FaTrash } from 'react-icons/fa';
import { useUpdateUser, useDeleteUser } from '../queries';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from './Modal';
import CreateClientForm from './CreateClientForm';

interface Client {
  id: number;
  nombre: string;
  apellido?: string;
  email: string;
  whatsapp?: string;
  telefono: string | null;
  tienda_slug?: string;
  tienda_nombre?: string;
  tienda_activa?: boolean;
}

interface ClientListProps {
  clients: Client[];
}

const ClientList: React.FC<ClientListProps> = ({ clients }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState({ nombre: '', apellido: '', email: '', whatsapp: '' });
  const queryClient = useQueryClient();

  const updateUser = useUpdateUser({
    onSuccess: () => {
      toast.success('Cliente actualizado exitosamente');
      setEditingClient(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
  
  const deleteUser = useDeleteUser({
    onSuccess: () => {
      toast.success('Cliente eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  
  const handleEditClick = (client: Client) => {
    setEditingClient(client);
    setEditForm({
      nombre: client.nombre,
      apellido: client.apellido || '',
      email: client.email || '',
      whatsapp: client.whatsapp || ''
    });
  };
  
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      const formData = new FormData();
      formData.append('nombre', editForm.nombre);
      formData.append('apellido', editForm.apellido);
      formData.append('email', editForm.email);
      formData.append('whatsapp', editForm.whatsapp);
      
      updateUser.mutate({ id: editingClient.id, formData });
    }
  };
  
  const handleDeleteClick = (client: Client) => {
    if (confirm(`¿Estás seguro de eliminar a ${client.nombre}?`)) {
      deleteUser.mutate(client.id);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-700">Listado de Clientes</h2>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-md transition-transform transform hover:scale-105"
        >
          <FaPlusCircle className="mr-2" /> Crear Nuevo Cliente
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3">Nombre</th>
              <th className="p-3">Email</th>
              <th className="p-3">WhatsApp</th>
              <th className="p-3">Tienda</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b">
                <td className="p-3 flex items-center">
                  <FaUser className="mr-2 text-gray-400" /> {client.nombre} {client.apellido}
                </td>
                <td className="p-3">
                  <FaEnvelope className="mr-2 text-gray-400 inline" /> {client.email}
                </td>
                <td className="p-3">
                  <FaPhone className="mr-2 text-gray-400 inline" /> {client.whatsapp || 'No disponible'}
                </td>
                <td className="p-3">
                  {client.tienda_activa ? (
                    <div className="flex items-center gap-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                        🏪 Activa
                      </span>
                      <a
                        href={`/tienda/${client.tienda_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                      >
                        🔗 Ver
                      </a>
                    </div>
                  ) : (
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      Sin tienda
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditClick(client)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition-colors"
                      title="Editar cliente"
                    >
                      <FaEdit className="text-sm" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(client)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded transition-colors"
                      title="Eliminar cliente"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Crear Nuevo Cliente">
        <CreateClientForm onSuccess={handleCloseModal} />
      </Modal>
      
      {/* Modal de Edición */}
      {editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Editar Cliente</h3>
              <button onClick={() => setEditingClient(null)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input
                  type="text"
                  value={editForm.apellido}
                  onChange={(e) => setEditForm({...editForm, apellido: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={editForm.whatsapp}
                  onChange={(e) => setEditForm({...editForm, whatsapp: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="595981123456"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={updateUser.isLoading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {updateUser.isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600"
                >
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

export default ClientList;
