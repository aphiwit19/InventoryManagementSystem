import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import StaffDashboard from './pages/dashboards/StaffDashboard';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';
import UsersPage from './pages/admin/UsersPage';

function HomeRouter() {
  const { profile } = useAuth();
  if (!profile) return null;
  if (profile.role === 'admin') return <Navigate to="/admin" replace />;
  if (profile.role === 'staff') return <Navigate to="/staff" replace />;
  return <Navigate to="/customer" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProtectedRoute allow={['admin','staff','customer']} />}> 
            <Route index element={<HomeRouter />} />
          </Route>

          <Route path="/admin" element={<ProtectedRoute allow={['admin']} />}> 
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UsersPage />} />
          </Route>

          <Route path="/staff" element={<ProtectedRoute allow={['staff']} />}> 
            <Route index element={<StaffDashboard />} />
          </Route>

          <Route path="/customer" element={<ProtectedRoute allow={['customer']} />}> 
            <Route index element={<CustomerDashboard />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
