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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
      alignItems: 'stretch',
      justifyContent: 'center',
      background: '#f6f6f8',
      padding: 0
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#fff',
        borderRadius: 0,
        overflow: 'hidden',
        boxShadow: 'none',
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
          minHeight: '100vh'
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
                width: '72px',
                height: '72px',
                background: 'white',
                borderRadius: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <img src="/Inventory Hub .png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{
                fontFamily: 'Kanit, sans-serif',
                fontSize: '2.6rem',
                fontWeight: '900',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                color: 'white'
              }}>
                INVENTORY PRO
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 2, maxWidth: 560 }}>
            <h2
              style={{
                margin: '0 0 12px',
                fontFamily: 'Inter, Kanit, sans-serif',
                fontSize: 44,
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1.08,
                color: '#ffffff'
              }}
            >
              {t('auth.login_marketing_headline')}
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: 16,
                lineHeight: 1.75,
                color: 'rgba(219,234,254,0.92)',
                maxWidth: 520
              }}
            >
              {t('auth.login_marketing_description')}
            </p>

            <div
              style={{
                marginTop: 22,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(191,219,254,0.92)',
                flexWrap: 'wrap'
              }}
            >
              <span>{t('auth.login_marketing_security')}</span>
              <span style={{ width: 4, height: 4, borderRadius: 999, background: 'rgba(96,165,250,0.9)' }} />
              <span>{t('auth.login_marketing_multilanguage')}</span>
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 2, fontSize: 12, color: 'rgba(191,219,254,0.85)' }}>
            {t('auth.copyright', { year: new Date().getFullYear() })}
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 40
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img src="/Inventory Hub .png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{
                fontFamily: 'Inter, Kanit, sans-serif',
                fontSize: 38,
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                color: '#0d121b'
              }}>
                Inventory Pro
              </div>
            </div>

            <LanguageSwitcher />
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              margin: '0 0 10px',
              fontFamily: 'Inter, Kanit, sans-serif',
              fontSize: 32,
              fontWeight: 900,
              color: '#0F172A',
              letterSpacing: '-0.03em',
              lineHeight: 1.2
            }}>
              {t('auth.welcome_back_title')}
            </h1>
            <p style={{
              margin: 0,
              color: '#4c669a',
              fontSize: 15,
              lineHeight: 1.6
            }}>
              {t('auth.welcome_back_subtitle')}
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
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    placeholder={t('auth.email_placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '13px 44px 13px 16px',
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
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#4c669a', fontSize: 18 }}>
                    ✉️
                  </div>
                </div>
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
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.password_placeholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '13px 44px 13px 16px',
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
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: '#4c669a',
                      fontSize: 16,
                      padding: 8,
                      borderRadius: 10,
                      lineHeight: 1
                    }}
                    aria-label="toggle password visibility"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} htmlFor="remember">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#4c669a' }}>{t('auth.remember_me')}</span>
                </label>
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
