import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../../firebase';
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        backgroundColor: '#fff',
        borderRadius: '24px',
        boxShadow: '0 25px 80px rgba(15, 23, 42, 0.15), 0 10px 40px rgba(37, 99, 235, 0.1)',
        padding: '48px 40px',
        animation: 'fadeIn 0.5s ease-in'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <img 
            src="/Inventory Hub .png" 
            alt="Inventory Hub" 
            style={{
              width: '200px',
              height: 'auto',
              margin: '0 auto 20px',
              display: 'block'
            }}
          />
          <h1 style={{
            margin: '0 0 12px 0',
            fontSize: '32px',
            fontWeight: '700',
            color: '#1e40af',
            letterSpacing: '-0.5px'
          }}>
            ลงทะเบียน
          </h1>
          <p style={{
            margin: 0,
            color: '#64748b',
            fontSize: '15px'
          }}>
            สร้างบัญชีใหม่เพื่อเริ่มต้นใช้งานระบบ
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Name Input */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '500',
                color: '#64748b'
              }}>
                ชื่อ-นามสกุล *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#3b82f6',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="กรอกชื่อ-นามสกุล"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 50px',
                    fontSize: '15px',
                    border: 'none',
                    borderRadius: '14px',
                    outline: 'none',
                    background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
                    color: '#1e293b',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)'
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15), inset 0 2px 4px rgba(0,0,0,0.04)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.04)';
                  }}
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '500',
                color: '#64748b'
              }}>
                อีเมล *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#3b82f6',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 50px',
                    fontSize: '15px',
                    border: 'none',
                    borderRadius: '14px',
                    outline: 'none',
                    background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
                    color: '#1e293b',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)'
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15), inset 0 2px 4px rgba(0,0,0,0.04)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.04)';
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '500',
                color: '#64748b'
              }}>
                รหัสผ่าน *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#3b82f6',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  type="password"
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 50px',
                    fontSize: '15px',
                    border: 'none',
                    borderRadius: '14px',
                    outline: 'none',
                    background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
                    color: '#1e293b',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)'
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15), inset 0 2px 4px rgba(0,0,0,0.04)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.04)';
                  }}
                />
              </div>
              {password && password.length < 6 && (
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#ef4444' }}>
                  ต้องการอีก {6 - password.length} ตัวอักษร
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: '14px 18px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                color: '#dc2626',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit || loading}
              style={{
                width: '100%',
                padding: '18px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#fff',
                background: canSubmit && !loading
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1e40af 100%)'
                  : '#cbd5e1',
                border: 'none',
                borderRadius: '14px',
                cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                boxShadow: canSubmit && !loading
                  ? '0 8px 24px rgba(37, 99, 235, 0.35)'
                  : 'none',
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                if (canSubmit && !loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 32px rgba(37, 99, 235, 0.45)';
                }
              }}
              onMouseLeave={(e) => {
                if (canSubmit && !loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.35)';
                }
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid #fff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block'
                  }}></span>
                  กำลังสร้างบัญชี...
                </>
              ) : (
                <>
                  ลงทะเบียน
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </>
              )}
            </button>

            {/* Login Link */}
            <Link
              to="/login"
              style={{
                display: 'block',
                width: '100%',
                padding: '16px',
                fontSize: '15px',
                fontWeight: '500',
                color: '#3b82f6',
                background: '#fff',
                border: '2px solid #e2e8f0',
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                textDecoration: 'none',
                marginTop: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.background = '#eff6ff';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.background = '#fff';
              }}
            >
              มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
            </Link>
          </div>
        </form>

        {/* CSS Animation */}
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
