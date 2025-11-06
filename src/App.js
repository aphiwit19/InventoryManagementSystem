import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import UsersPage from './pages/admin/UsersPage';
import ProductsPage from './pages/admin/ProductsPage';
import EditProductPage from './pages/admin/EditProductPage';
import InventoryHistoryPage from './pages/admin/InventoryHistoryPage';

function HomeRouter() {
  const { profile } = useAuth();
  if (!profile) return null;
  if (profile.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
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
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<ProductsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="addproduct" element={<AdminDashboard />} />
            <Route path="products/:id/edit" element={<EditProductPage />} />
            <Route path="products/:id/history" element={<InventoryHistoryPage />} />
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
