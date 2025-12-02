import React, { useState } from 'react';
import { FaFileInvoiceDollar, FaPlusCircle } from 'react-icons/fa';
import Modal from './Modal';
import CreateLoanForm from './CreateLoanForm';

interface Loan {
  id: number;
  monto_principal: number;
  interes_total_percent: number;
  estado: string;
  user: {
    nombre: string;
  };
}

interface LoanListProps {
  loans: Loan[];
}

const LoanList: React.FC<LoanListProps> = ({ loans }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-700">Listado de Préstamos</h2>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-md transition-transform transform hover:scale-105"
        >
          <FaPlusCircle className="mr-2" /> Crear Nuevo Préstamo
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3">Cliente</th>
              <th className="p-3">Monto</th>
              <th className="p-3">Interés</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id} className="border-b">
                <td className="p-3">{loan.user.nombre}</td>
                <td className="p-3 font-semibold">${loan.monto_principal.toLocaleString()}</td>
                <td className="p-3">{loan.interes_total_percent}%</td>
                <td className="p-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    loan.estado === 'activo' ? 'bg-yellow-200 text-yellow-800' :
                    loan.estado === 'pagado' ? 'bg-green-200 text-green-800' :
                    'bg-red-200 text-red-800'
                  }`}>
                    {loan.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Crear Nuevo Préstamo">
        <CreateLoanForm onSuccess={handleCloseModal} />
      </Modal>
    </div>
  );
};

export default LoanList;
