import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function ProtectedRoute({ allow = [] }) {
  const { user, profile, loading } = useAuth();

  if (loading) return null; // could render a spinner
  if (!user) return <Navigate to="/login" replace />;
  if (allow.length > 0 && (!profile || !allow.includes(profile.role))) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}


