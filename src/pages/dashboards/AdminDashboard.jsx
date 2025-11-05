import { useAuth } from '../../auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 24 }}>
      <h2>Admin Dashboard</h2>
      <p>Welcome, {profile?.displayName || user?.email}</p>
      <div style={{ display: 'flex', gap: 12, margin: '12px 0' }}>
        <Link to="/admin/users">Manage Users</Link>
        <button onClick={() => signOut(auth)}>Logout</button>
      </div>
    </div>
  );
}


