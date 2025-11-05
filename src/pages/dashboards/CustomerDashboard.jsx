import { useAuth } from '../../auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

export default function CustomerDashboard() {
  const { user, profile } = useAuth();
  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 24 }}>
      <h2>Customer Dashboard</h2>
      <p>Welcome, {profile?.displayName || user?.email}</p>
      <button onClick={() => signOut(auth)}>Logout</button>
    </div>
  );
}


