import React from 'react';
import { FaUserShield, FaEnvelope, FaPhone } from 'react-icons/fa';

interface Collector {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
}

interface CollectorListProps {
  collectors: Collector[];
}

const CollectorList: React.FC<CollectorListProps> = ({ collectors }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-700 mb-4">Listado de Cobradores</h2>
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
            {collectors.map((collector) => (
              <tr key={collector.id} className="border-b">
                <td className="p-3 flex items-center">
                  <FaUserShield className="mr-2 text-gray-400" /> {collector.nombre}
                </td>
                <td className="p-3">
                  <FaEnvelope className="mr-2 text-gray-400 inline" /> {collector.email}
                </td>
                <td className="p-3">
                  <FaPhone className="mr-2 text-gray-400 inline" /> {collector.telefono || 'No disponible'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CollectorList;
