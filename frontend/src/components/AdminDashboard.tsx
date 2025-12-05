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
          <button
            onClick={() => setIsUserModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-6 rounded-xl flex items-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <FaPlusCircle className="mr-2 text-lg" /> Crear Usuario
          </button>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl mr-4">
                    <FaChartLine className="text-white text-xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Préstamos por Mes</h2>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar dataKey="prestamos" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0.7}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-3 rounded-xl mr-4">
                    <FaRegChartBar className="text-white text-xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Estado de Préstamos</h2>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={loanStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} fill="#8884d8" label>
                      {loanStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-3 rounded-xl mr-4">
                  <FaFileInvoiceDollar className="text-white text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Pagos Recientes</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <th className="p-4 font-semibold text-gray-700 rounded-tl-xl">Cliente</th>
                      <th className="p-4 font-semibold text-gray-700">Monto</th>
                      <th className="p-4 font-semibold text-gray-700">Fecha</th>
                      <th className="p-4 font-semibold text-gray-700 rounded-tr-xl">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((payment: any, index: number) => (
                      <tr key={payment.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${index === recentPayments.length - 1 ? 'border-b-0' : ''}`}>
                        <td className="p-4 font-medium text-gray-800">{payment.installment.loan.user.nombre}</td>
                        <td className="p-4 font-bold text-emerald-600">${payment.monto.toLocaleString()}</td>
                        <td className="p-4 text-gray-600">{new Date(payment.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            payment.confirmado 
                              ? 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300' 
                              : 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border border-amber-300'
                          }`}>
                            {payment.confirmado ? '✅ Confirmado' : '⏳ Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              refetch();
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
