import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const isValidEmail = (val) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(val);
  const canSubmit = isValidEmail(email.trim()) && password.length >= 6;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
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
      background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #60A5FA 100%)',
      padding: '20px'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        maxWidth: '1200px',
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        animation: 'slideUp 0.6s ease-out',
        position: 'relative'
      }}>
        {/* Left Panel - Image Background */}
        <div style={{
          backgroundImage: 'url(/login.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          minHeight: '600px'
        }}>
          {/* Overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.85) 0%, rgba(59, 130, 246, 0.75) 50%, rgba(96, 165, 250, 0.65) 100%)',
            zIndex: 1
          }} />
          
          {/* Logo Section */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'white',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <img src="/Inventory Hub .png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{
                fontFamily: 'Kanit, sans-serif',
                fontSize: '1.2rem',
                fontWeight: '700',
                color: 'white'
              }}>
                INVENTORY HUB
              </div>
            </div>
          </div>

          {/* Welcome Section */}
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
            <h1 style={{
              fontFamily: 'Kanit, sans-serif',
              fontSize: '3rem',
              fontWeight: '800',
              color: 'white',
              lineHeight: 1.2,
              margin: 0
            }}>
              Welcome
            </h1>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div style={{
          padding: '4rem',
          background: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* Language Switcher */}
          <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
            <LanguageSwitcher />
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontFamily: 'Kanit, sans-serif',
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#0F172A',
              margin: '0 0 0.5rem 0'
            }}>
              {t('auth.login_title')}
            </h2>
            <p style={{
              color: '#64748B',
              fontSize: '0.95rem',
              margin: 0
            }}>
              {t('auth.login_subtitle')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Email Input */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {t('auth.email')} *
                </label>
                <input
                  type="email"
                  placeholder={t('auth.email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    fontSize: '15px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontWeight: '500',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Password Input */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {t('auth.password')} *
                </label>
                <input
                  type="password"
                  placeholder={t('auth.password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    fontSize: '15px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontWeight: '500',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!canSubmit || loading}
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  fontSize: '17px',
                  fontWeight: '600',
                  fontFamily: 'Kanit, sans-serif',
                  color: '#fff',
                  background: '#1e40af',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  marginTop: '16px',
                  letterSpacing: '0.01em',
                  opacity: canSubmit && !loading ? 1 : 0.6
                }}
                onMouseEnter={(e) => {
                  if (canSubmit && !loading) {
                    e.target.style.background = '#1e3a8a';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (canSubmit && !loading) {
                    e.target.style.background = '#1e40af';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }
                }}
              >
                {loading ? t('auth.logging_in') : t('auth.login')}
              </button>

              {/* Register Link */}
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <p style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: '1rem' }}>
                  {t('auth.no_account')}
                </p>
                <Link
                  to="/register"
                  style={{
                    display: 'inline-block',
                    padding: '13px 24px',
                    fontSize: '15px',
                    fontWeight: '600',
                    fontFamily: 'Kanit, sans-serif',
                    color: '#3b82f6',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center',
                    textDecoration: 'none',
                    letterSpacing: '0.01em'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f8fafc';
                    e.target.style.borderColor = '#94a3b8';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#ffffff';
                    e.target.style.borderColor = '#cbd5e1';
                  }}
                >
                  {t('auth.register')}
                </Link>
              </div>
            </div>
          </form>
        </div>

        {/* CSS Animation */}
        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @media (max-width: 768px) {
            div[style*="gridTemplateColumns"] {
              grid-template-columns: 1fr !important;
              max-width: 450px !important;
            }
            div[style*="backgroundImage"] {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
