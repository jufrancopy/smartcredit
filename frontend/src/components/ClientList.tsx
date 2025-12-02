import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaPlusCircle } from 'react-icons/fa';
import Modal from './Modal';
import CreateClientForm from './CreateClientForm';

interface Client {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
}

interface ClientListProps {
  clients: Client[];
}

const ClientList: React.FC<ClientListProps> = ({ clients }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

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
              <th className="p-3">Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b">
                <td className="p-3 flex items-center">
                  <FaUser className="mr-2 text-gray-400" /> {client.nombre}
                </td>
                <td className="p-3">
                  <FaEnvelope className="mr-2 text-gray-400 inline" /> {client.email}
                </td>
                <td className="p-3">
                  <FaPhone className="mr-2 text-gray-400 inline" /> {client.telefono || 'No disponible'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Crear Nuevo Cliente">
        <CreateClientForm onSuccess={handleCloseModal} />
      </Modal>
    </div>
  );
};

export default ClientList;
