import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const isValidEmail = (val) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(val);
  const canSubmit = name.trim().length > 0 && isValidEmail(email.trim()) && password.length >= 6;

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      // Create profile with default role customer
      await setDoc(doc(db, 'users', cred.user.uid), {
        role: 'customer',
        email: email.trim(),
        displayName: name.trim() || null,
        createdAt: serverTimestamp(),
      }, { merge: true });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Register failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 24 }}>
      <h2>Register (Customer)</h2>
      <form onSubmit={handleRegister}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="text" placeholder="Full name" value={name} onChange={(e)=>setName(e.target.value)} />
          <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input type="password" placeholder="Password (min 6)" value={password} onChange={(e)=>setPassword(e.target.value)} />
          {error && <div style={{ color: 'tomato', fontSize: 14 }}>{error}</div>}
          <button type="submit" disabled={!canSubmit || loading}>{loading ? '...' : 'Create account'}</button>
        </div>
      </form>
      <p style={{ marginTop: 16 }}>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}


