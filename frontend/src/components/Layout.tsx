import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  userRole: string | null;
  userName: string | null;
  handleLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ userRole, userName, handleLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm p-4 mb-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-800">AhorraConmigo</h1>
          {userRole && (
            <div className="flex-grow flex items-center space-x-4">
              {(userRole === 'COBRADOR' || userRole === 'ADMIN') && (
                <button
                  onClick={() => navigate('/collector-dashboard')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${location.pathname === '/collector-dashboard' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  Panel del Cobrador
                </button>
              )}
              {userRole === 'ADMIN' && (
                <>
                  <button
                    onClick={() => navigate('/create-loan')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${location.pathname === '/create-loan' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                  >
                    Crear Préstamo
                  </button>
                  <button
                    onClick={() => navigate('/create-client')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${location.pathname === '/create-client' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                  >
                    Crear Cliente
                  </button>
                </>
              )}
              {userRole === 'DEUDOR' && (
                <button
                  onClick={() => navigate('/client-payments')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${location.pathname === '/client-payments' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  Mis Pagos
                </button>
              )}
            </div>
          )}
          {userName && <span className="text-gray-600">Hola, {userName}</span>}
          <button
            onClick={handleLogout}
            className="ml-auto px-4 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
