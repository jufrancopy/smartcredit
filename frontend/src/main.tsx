import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import CollectorDashboard from './components/CollectorDashboard'
import CreateLoanForm from './components/CreateLoanForm'
import CreateUserForm from './components/CreateUserForm'
import ClientPaymentView from './components/ClientPaymentView'
import LoginForm from './components/LoginForm'
import AdminLoginForm from './components/AdminLoginForm'

import './index.css'

const queryClient = new QueryClient()

function App() {
  const [view, setView] = useState(() => {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole === 'deudor') {
      return 'clientPayments';
    }
    if (storedRole === 'cobrador') {
      return 'dashboard';
    }
    return 'login';
  }); // 'dashboard', 'createLoan', 'createClient', 'clientPayments', 'login', or 'adminLogin'
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userId, setUserId] = useState<number | null>(() => {
    const storedUserId = localStorage.getItem('userId');
    return storedUserId ? parseInt(storedUserId, 10) : null;
  });
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('userRole'));
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('userName'));

  const handleLoginSuccess = (newToken: string, newUserId: number, newUserRole: string, newUserName: string) => {
    setToken(newToken);
    setUserId(newUserId);
    setUserRole(newUserRole);
    setUserName(newUserName);
    localStorage.setItem('token', newToken);
    localStorage.setItem('userId', newUserId.toString());
    localStorage.setItem('userRole', newUserRole);
    localStorage.setItem('userName', newUserName);
    setView('clientPayments'); // Redirect to client payments after login
  };

  const handleLogout = () => {
    setToken(null);
    setUserId(null);
    setUserRole(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    setView('login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm p-4 mb-4">
        <div className="max-w-4xl mx-auto flex justify-between space-x-4">
          {token && userRole ? (
            <>
              {(userRole === 'cobrador' || userRole === 'admin') && (
                <button
                  onClick={() => setView('dashboard')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${view === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  Panel del Cobrador
                </button>
              )}
              {userRole === 'admin' && (
                <button
                  onClick={() => setView('createLoan')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${view === 'createLoan' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  Crear Préstamo
                </button>
              )}
              {userRole === 'admin' && (
                <button
                  onClick={() => setView('createClient')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${view === 'createClient' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  Crear Cliente
                </button>
              )}
              {userRole === 'deudor' && (
                <button
                  onClick={() => setView('clientPayments')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${view === 'clientPayments' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  Pagos de Clientes
                </button>
              )}
            </>
          ) : (
            <div className="flex justify-center items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-800">AhorraConmigo</h1>
              {view === 'login' && (
                <button
                  onClick={() => setView('adminLogin')}
                  className="px-4 py-2 rounded-md text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  Acceso Administrador
                </button>
              )}
              {view === 'adminLogin' && (
                <button
                  onClick={() => setView('login')}
                  className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Acceso Usuarios/Cobradores
                </button>
              )}
            </div>
          )}
          {token && (
            <button
              onClick={handleLogout}
              className="ml-auto px-4 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Cerrar Sesión
            </button>
          )}
        </div>
      </nav>
      <main>
        {token ? (
          <>
            {view === 'dashboard' && <CollectorDashboard />}
            {view === 'createLoan' && <CreateLoanForm />}
            {view === 'createClient' && <CreateUserForm />}
            {view === 'clientPayments' && userId && <ClientPaymentView userId={userId} />}
          </>
        ) : (
          view === 'adminLogin' ? (
            <AdminLoginForm onLoginSuccess={handleLoginSuccess} />
          ) : (
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          )
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster />
    </QueryClientProvider>
  </React.StrictMode>,
)
