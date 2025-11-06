import { useAuth } from '../../auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

export default function StaffDashboard() {
  const { user, profile } = useAuth();
  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 24 }}>
      <h2>Staff Dashboard</h2>
      <p>Hello, {profile?.displayName || user?.email}</p>
      <button onClick={() => signOut(auth)}>Logout</button>
    </div>
  );
}

