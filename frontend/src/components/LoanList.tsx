import React, { useState } from 'react';
import { FaFileInvoiceDollar, FaPlusCircle } from 'react-icons/fa';
import Modal from './Modal';
import CreateLoanForm from './CreateLoanForm';
import { useCheckRenewalEligibility } from '../queries';
import toast from 'react-hot-toast';

interface Loan {
  id: number;
  monto_principal: number;
  interes_total_percent: number;
  total_a_devolver: number;
  estado: string;
  user: {
    id: number;
    nombre: string;
  };
  installments?: Array<{
    monto_pagado: number;
  }>;
}

interface LoanListProps {
  loans: Loan[];
  onOpenRenewal?: (clientData: any) => void;
}

const LoanList: React.FC<LoanListProps> = ({ loans, onOpenRenewal }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkingRenewal, setCheckingRenewal] = useState<number | null>(null);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleCheckRenewal = async (loan: Loan) => {
    if (!onOpenRenewal) return;
    
    setCheckingRenewal(loan.id);
    try {
      // Verificación local primero
      const totalPaid = loan.installments?.reduce((sum, inst) => sum + inst.monto_pagado, 0) || 0;
      const paymentPercentage = totalPaid / loan.total_a_devolver;
      
      console.log('Verificación local:', {
        totalPaid,
        totalADevolver: loan.total_a_devolver,
        percentage: (paymentPercentage * 100).toFixed(1) + '%'
      });
      
      const response = await fetch(`/api/loan-renewal/check-eligibility/${loan.user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al verificar elegibilidad');
      }
      
      const eligibilityData = await response.json();
      
      console.log('Respuesta del servidor:', eligibilityData);
      
      if (eligibilityData.eligible) {
        onOpenRenewal({
          id: loan.user.id,
          name: eligibilityData.clientName,
          eligibilityData
        });
      } else {
        toast.error(`Cliente no elegible. Pagado: ${(paymentPercentage * 100).toFixed(1)}% (necesita 90%)`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al verificar elegibilidad');
    } finally {
      setCheckingRenewal(null);
    }
  };

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
              <th className="p-3">Acciones</th>
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
                <td className="p-3">
                  {loan.estado === 'activo' && onOpenRenewal && (
                    <button
                      onClick={() => handleCheckRenewal(loan)}
                      disabled={checkingRenewal === loan.id}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-lg text-sm hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 disabled:opacity-50"
                    >
                      {checkingRenewal === loan.id ? (
                        <div className="flex items-center">
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                          Verificando...
                        </div>
                      ) : (
                        '🔄 Renovar'
                      )}
                    </button>
                  )}
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
