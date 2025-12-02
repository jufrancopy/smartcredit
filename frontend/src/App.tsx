import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';

import Layout from './components/Layout';
import LoginForm from './components/LoginForm';
import CollectorDashboard from './components/CollectorDashboard';
import AdminDashboard from './components/AdminDashboard';
import ClientPaymentView from './components/ClientPaymentView';
import CreateLoanForm from './components/CreateLoanForm';
import CreateClientForm from './components/CreateClientForm';
import CreateUserForm from './components/CreateUserForm';
import AdminLoginForm from './components/AdminLoginForm';

interface DecodedToken {
  userId: number;
  role: string;
  nombre: string;
  exp: number;
}

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Componente para manejar la redirección basada en el rol para la ruta raíz
  const HomeRedirect: React.FC = () => {
    useEffect(() => {
      if (userRole) {
        switch (userRole) {
          case 'admin':
            navigate('/admin-dashboard', { replace: true });
            break;
          case 'cobrador':
            navigate('/collector-dashboard', { replace: true });
            break;
          case 'deudor':
            navigate('/client-payments', { replace: true });
            break;
          default:
            navigate('/login', { replace: true });
            break;
        }
      } else {
        navigate('/login', { replace: true });
      }
    }, [userRole, navigate]);
    return null;
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(storedToken);
        if (decodedToken.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setUserRole(decodedToken.role.toLowerCase());
          setUserName(decodedToken.nombre);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Token inválido:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const getUserId = () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decoded = jwtDecode<{ userId: number; role: string; nombre: string }>(storedToken);
        return decoded.userId;
      } catch {
        return 0;
      }
    }
    return 0;
  };

  const handleLogin = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    const decodedToken = jwtDecode<DecodedToken>(newToken);
    const roleLowerCase = decodedToken.role.toLowerCase();
    setUserRole(roleLowerCase);
    setUserName(decodedToken.nombre);

    switch (roleLowerCase) {
      case 'admin':
        navigate('/admin-dashboard', { replace: true });
        break;
      case 'cobrador':
        navigate('/collector-dashboard', { replace: true });
        break;
      case 'deudor':
        navigate('/client-payments', { replace: true });
        break;
      default:
        navigate('/login', { replace: true });
        break;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUserRole(null);
    setUserName(null);
    navigate('/login');
  };
  
  const ProtectedRoute: React.FC<{ allowedRoles: string[] }> = ({ allowedRoles }) => {
    const location = useLocation();

    if (!token || !userRole) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }

    return <Outlet />;
  };

  if (loading) {
    return <div>Cargando...</div>; // O un componente de spinner más elegante
  }

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<LoginForm onLoginSuccess={handleLogin} />} />
        <Route path="/admin-login" element={<AdminLoginForm onLoginSuccess={handleLogin} />} />
        <Route path="/" element={<HomeRedirect />} />
          
        <Route 
          element={
            <Layout userRole={userRole} userName={userName} handleLogout={handleLogout}>
              <Outlet />
            </Layout>
          }
        >
          <Route element={<ProtectedRoute allowedRoles={['admin', 'cobrador']} />}>
            <Route path="/collector-dashboard" element={<CollectorDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/create-loan" element={<CreateLoanForm />} />
            <Route path="/create-client" element={<CreateClientForm />} />

          </Route>

          <Route element={<ProtectedRoute allowedRoles={['deudor']} />}>
            <Route 
              path="/client-payments" 
              element={<ClientPaymentView userId={getUserId()} />} 
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

export default App;