import React, { useState } from 'react';
import { useGetUsers, useGetLoans, useGetPayments } from '../queries';
import { Link } from 'react-router-dom';
import { FaUsers, FaMoneyBillWave, FaChartLine, FaRegChartBar, FaPlusCircle, FaFileInvoiceDollar, FaUserShield } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Toaster } from 'react-hot-toast';
import ClientList from './ClientList';
import CollectorList from './CollectorList';
import LoanList from './LoanList';
import LoanRenewal from './LoanRenewal';
import Modal from './Modal';
import CreateUserForm from './CreateUserForm';
import ProductManager from './ProductManager';
import ConsignmentManager from './ConsignmentManager';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    yellow: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
      <div className="flex items-center">
        <div className={`bg-gradient-to-br ${colorClasses[color]} text-white p-4 rounded-xl mr-4 shadow-lg`}>
          <div className="text-xl">{icon}</div>
        </div>
        <div>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [selectedClientForRenewal, setSelectedClientForRenewal] = useState<any>(null);
  const { data: usersData, isLoading: usersLoading, error: usersError } = useGetUsers();
  const { data: loansData, isLoading: loansLoading, error: loansError } = useGetLoans();
  const { data: paymentsData, isLoading: paymentsLoading, error: paymentsError } = useGetPayments();

  if (usersLoading || loansLoading || paymentsLoading) {
    return <div>Cargando...</div>;
  }

  if (usersError || loansError || paymentsError) {
    return <div>Error al cargar los datos</div>;
  }

  const clients = usersData?.filter((user: any) => user.role === 'deudor') || [];
  const collectors = usersData?.filter((user: any) => user.role === 'cobrador') || [];
  const totalClients = clients.length;

  const totalLoaned = loansData?.reduce((acc: number, loan: any) => acc + loan.monto_principal, 0) || 0;
  const totalToReturn = loansData?.reduce((acc: number, loan: any) => acc + loan.total_a_devolver, 0) || 0;
  
  const totalCollected = paymentsData?.reduce((acc: number, payment: any) => payment.confirmado ? acc + payment.monto : acc, 0) || 0;
  const outstandingBalance = totalToReturn - totalCollected;
  
  const activeLoans = loansData?.filter((loan: any) => loan.estado === 'activo').length || 0;
  const completedLoans = loansData?.filter((loan: any) => loan.estado === 'pagado').length || 0;
  
  const loanStatusData = [
    { name: 'Activos', value: activeLoans },
    { name: 'Pagados', value: completedLoans },
  ];

  const loansByMonth = (loansData || []).reduce((acc: { [key: string]: number }, loan: any) => {
    const month = new Date(loan.fechaInicio).toLocaleString('es-ES', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const monthlyChartData = Object.keys(loansByMonth).map(key => ({
    name: key,
    prestamos: loansByMonth[key],
  }));

  const recentPayments = paymentsData?.slice(0, 5) || [];

  const COLORS = ['#0088FE', '#00C49F'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Panel de Administración</h1>
            <p className="text-gray-600 text-lg">Gestiona tu plataforma de préstamos</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={async () => {
                try {
                  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/investments/fix-investment-prices`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  });
                  const result = await response.json();
                  alert(`Corrección completada: ${result.message}`);
                } catch (error) {
                  alert('Error al corregir precios');
                }
              }}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-6 rounded-xl flex items-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              🔧 Corregir Precios
            </button>
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-6 rounded-xl flex items-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <FaPlusCircle className="mr-2 text-lg" /> Crear Usuario
            </button>
          </div>
        </div>
      
        <div className="mb-10">
          <div className="bg-white rounded-2xl shadow-lg p-2">
            <nav className="flex space-x-2" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('summary')}
                className={`${
                  activeTab === 'summary'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                } flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300`}
              >
                📊 Resumen
              </button>
              <button
                onClick={() => setActiveTab('clients')}
                className={`${
                  activeTab === 'clients'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                } flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300`}
              >
                👥 Clientes
              </button>
              <button
                onClick={() => setActiveTab('collectors')}
                className={`${
                  activeTab === 'collectors'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                } flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300`}
              >
                🏦 Cobradores
              </button>
              <button
                onClick={() => setActiveTab('loans')}
                className={`${
                  activeTab === 'loans'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                } flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300`}
              >
                💰 Préstamos
              </button>
              <button
                onClick={() => setActiveTab('minitienda')}
                className={`${
                  activeTab === 'minitienda'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                } flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300`}
              >
                📦 Productos
              </button>
              <button
                onClick={() => setActiveTab('consignments')}
                className={`${
                  activeTab === 'consignments'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                } flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300`}
              >
                📋 Consignaciones
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'summary' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
              <StatCard icon={<FaUsers />} title="Total de Clientes" value={totalClients} color="blue" />
              <StatCard icon={<FaMoneyBillWave />} title="Capital Prestado" value={`$${totalLoaned.toLocaleString()}`} color="green" />
              <StatCard icon={<FaChartLine />} title="Total Recaudado" value={`$${totalCollected.toLocaleString()}`} color="yellow" />
              <StatCard icon={<FaRegChartBar />} title="Balance Pendiente" value={`$${outstandingBalance.toLocaleString()}`} color="red" />
            </div>

            {/* Resumen Ejecutivo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Flujo de Efectivo */}
              <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-3 rounded-2xl mr-4">
                      <span className="text-white text-2xl">💰</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">Flujo de Efectivo</h3>
                      <p className="text-gray-600">Análisis financiero en tiempo real</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
                      <span className="font-medium text-gray-700">Efectivo Prestado</span>
                    </div>
                    <span className="font-bold text-emerald-600 text-lg">${totalLoaned.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-2xl">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <span className="font-medium text-gray-700">Total Recaudado</span>
                    </div>
                    <span className="font-bold text-blue-600 text-lg">${totalCollected.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-amber-50 rounded-2xl">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-amber-500 rounded-full mr-3"></div>
                      <span className="font-medium text-gray-700">Por Cobrar</span>
                    </div>
                    <span className="font-bold text-amber-600 text-lg">${outstandingBalance.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800">Rentabilidad</span>
                      <span className="font-bold text-2xl text-purple-600">
                        {totalLoaned > 0 ? ((totalCollected / totalLoaned * 100) - 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estado de Cartera */}
              <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-2xl mr-4">
                      <span className="text-white text-2xl">📈</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">Estado de Cartera</h3>
                      <p className="text-gray-600">Distribución de préstamos</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-2xl">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                      <span className="font-medium text-gray-700">Préstamos Activos</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-green-600 text-lg">{activeLoans}</span>
                      <p className="text-sm text-gray-500">{totalClients > 0 ? ((activeLoans / (activeLoans + completedLoans)) * 100).toFixed(0) : 0}%</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-2xl">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                      <span className="font-medium text-gray-700">Préstamos Completados</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-blue-600 text-lg">{completedLoans}</span>
                      <p className="text-sm text-gray-500">{totalClients > 0 ? ((completedLoans / (activeLoans + completedLoans)) * 100).toFixed(0) : 0}%</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-500 rounded-full mr-3"></div>
                      <span className="font-medium text-gray-700">Total Clientes</span>
                    </div>
                    <span className="font-bold text-gray-600 text-lg">{totalClients}</span>
                  </div>
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800">Promedio por Cliente</span>
                      <span className="font-bold text-lg text-indigo-600">
                        ${totalClients > 0 ? (totalLoaned / totalClients).toLocaleString() : '0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actividad Reciente */}
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-2xl mr-4">
                    <span className="text-white text-2xl">💳</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">Actividad Reciente</h3>
                    <p className="text-gray-600">Transacciones y movimientos del día</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Hoy</p>
                  <p className="text-lg font-bold text-gray-800">{new Date().toLocaleDateString('es-ES')}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {recentPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-gray-400">💳</span>
                    </div>
                    <p className="text-gray-500 text-lg">No hay pagos recientes</p>
                  </div>
                ) : (
                  recentPayments.map((payment: any, index: number) => {
                    const loan = payment.installment?.loan;
                    const totalPaid = loan?.installments?.reduce((sum, inst) => sum + inst.monto_pagado, 0) || 0;
                    const paymentProgress = loan ? (totalPaid / loan.monto_principal * 100).toFixed(0) : '0';
                    
                    return (
                      <div key={payment.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {payment.installment.loan.user.nombre.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-lg">{payment.installment.loan.user.nombre}</h4>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="text-sm text-gray-500">
                                {new Date(payment.createdAt).toLocaleDateString('es-ES')}
                              </span>
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                                <span className="text-sm font-medium text-blue-600">{paymentProgress}% completado</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-bold text-2xl text-gray-800">${payment.monto.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">Guaraníes</p>
                          </div>
                          
                          <div className="flex items-center">
                            {payment.confirmado ? (
                              <div className="flex items-center bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                                <span className="text-sm font-semibold">Confirmado</span>
                              </div>
                            ) : (
                              <div className="flex items-center bg-amber-100 text-amber-700 px-3 py-2 rounded-xl">
                                <div className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></div>
                                <span className="text-sm font-semibold">Pendiente</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'clients' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl mr-4">
                <FaUsers className="text-white text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Gestión de Clientes</h2>
            </div>
            <ClientList clients={clients} />
          </div>
        )}
        
        {activeTab === 'collectors' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-3 rounded-xl mr-4">
                <FaUserShield className="text-white text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Gestión de Cobradores</h2>
            </div>
            <CollectorList collectors={collectors} />
          </div>
        )}
        
        {activeTab === 'loans' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-3 rounded-xl mr-4">
                <FaMoneyBillWave className="text-white text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Gestión de Préstamos</h2>
            </div>
            <LoanList 
              loans={loansData} 
              onOpenRenewal={(clientData) => {
                setSelectedClientForRenewal(clientData);
                setShowRenewalModal(true);
              }} 
            />
          </div>
        )}

        {activeTab === 'minitienda' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <ProductManager />
          </div>
        )}

        {activeTab === 'consignments' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <ConsignmentManager />
          </div>
        )}

        <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Crear Nuevo Usuario">
          <CreateUserForm onSuccess={() => setIsUserModalOpen(false)} />
        </Modal>

        {showRenewalModal && selectedClientForRenewal && (
          <LoanRenewal
            clientId={selectedClientForRenewal.id}
            clientName={selectedClientForRenewal.name}
            eligibilityData={selectedClientForRenewal.eligibilityData}
            onClose={() => {
              setShowRenewalModal(false);
              setSelectedClientForRenewal(null);
            }}
            onSuccess={() => {
              setShowRenewalModal(false);
              setSelectedClientForRenewal(null);
              // Refrescar todos los datos
              window.location.reload();
            }}
          />
        )}
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#363636',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff'
              }
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff'
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
