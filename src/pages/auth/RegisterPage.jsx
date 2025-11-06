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
  const [showPassword, setShowPassword] = useState(false);
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        backgroundColor: '#fff',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        padding: '40px',
        animation: 'fadeIn 0.5s ease-in'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '70px',
            height: '70px',
            margin: '0 auto 20px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            color: '#fff',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
          }}>
            ✨
          </div>
          <h1 style={{
            margin: '0 0 10px 0',
            fontSize: '28px',
            fontWeight: '700',
            color: '#333',
            letterSpacing: '-0.5px'
          }}>
            สร้างบัญชีใหม่
          </h1>
          <p style={{
            margin: 0,
            color: '#666',
            fontSize: '14px'
          }}>
            สมัครสมาชิกเพื่อเริ่มใช้งาน
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
                fontSize: '14px',
                fontWeight: '600',
                color: '#333'
              }}>
                ชื่อ-นามสกุล
              </label>
              <input
                type="text"
                placeholder="กรอกชื่อ-นามสกุลของคุณ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: `2px solid ${name && name.trim().length === 0 ? '#f44336' : '#e0e0e0'}`,
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = name && name.trim().length === 0 ? '#f44336' : '#e0e0e0'}
              />
              {name && name.trim().length > 0 && (
                <span style={{
                  display: 'block',
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#4CAF50'
                }}>✓ ถูกต้อง</span>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333'
              }}>
                อีเมล
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  placeholder="กรอกอีเมลของคุณ"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '15px',
                    border: `2px solid ${email && !isValidEmail(email.trim()) ? '#f44336' : '#e0e0e0'}`,
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = email && !isValidEmail(email.trim()) ? '#f44336' : '#e0e0e0'}
                />
                {email && isValidEmail(email.trim()) && (
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#4CAF50',
                    fontSize: '20px'
                  }}>✓</span>
                )}
              </div>
              {email && !isValidEmail(email.trim()) && (
                <p style={{
                  margin: '8px 0 0 0',
                  fontSize: '12px',
                  color: '#f44336'
                }}>
                  กรุณากรอกอีเมลให้ถูกต้อง
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333'
              }}>
                รหัสผ่าน
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 45px 14px 16px',
                    fontSize: '15px',
                    border: `2px solid ${password && password.length < 6 ? '#f44336' : '#e0e0e0'}`,
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = password && password.length < 6 ? '#f44336' : '#e0e0e0'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#666',
                    padding: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {password && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginBottom: '4px'
                  }}>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <div
                        key={num}
                        style={{
                          flex: 1,
                          height: '4px',
                          borderRadius: '2px',
                          backgroundColor: password.length >= num ? (
                            password.length >= 6 ? '#4CAF50' : '#FFC107'
                          ) : '#e0e0e0',
                          transition: 'background-color 0.3s ease'
                        }}
                      />
                    ))}
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: password.length >= 6 ? '#4CAF50' : '#f44336'
                  }}>
                    {password.length >= 6 ? '✓ รหัสผ่านแข็งแรง' : `ต้องการอีก ${6 - password.length} ตัวอักษร`}
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#ffebee',
                border: '1px solid #f44336',
                borderRadius: '8px',
                color: '#c62828',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
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
                padding: '16px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#fff',
                background: canSubmit && !loading
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : '#ccc',
                border: 'none',
                borderRadius: '12px',
                cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                boxShadow: canSubmit && !loading
                  ? '0 4px 15px rgba(102, 126, 234, 0.4)'
                  : 'none',
                marginTop: '10px'
              }}
              onMouseEnter={(e) => {
                if (canSubmit && !loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (canSubmit && !loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #fff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block'
                  }}></span>
                  กำลังสร้างบัญชี...
                </span>
              ) : (
                'สร้างบัญชี'
              )}
            </button>

            {/* Login Link */}
            <div style={{
              textAlign: 'center',
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid #e0e0e0'
            }}>
              <p style={{
                margin: 0,
                color: '#666',
                fontSize: '14px'
              }}>
                มีบัญชีอยู่แล้ว?{' '}
                <Link
                  to="/login"
                  style={{
                    color: '#667eea',
                    textDecoration: 'none',
                    fontWeight: '600',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#764ba2'}
                  onMouseLeave={(e) => e.target.style.color = '#667eea'}
                >
                  เข้าสู่ระบบ
                </Link>
              </p>
            </div>
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
