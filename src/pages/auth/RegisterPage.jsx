import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function RegisterPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const isValidEmail = (val) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(val);
  const canSubmit = name.trim().length > 0
    && isValidEmail(email.trim())
    && password.length >= 6
    && confirmPassword.length > 0
    && confirmPassword === password
    && agreeTerms;

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
          justifyContent: 'flex-start',
          gap: '28px',
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

          <div style={{ position: 'relative', zIndex: 2, maxWidth: 560, marginTop: 16 }}>
            <h2
              style={{
                margin: '0 0 14px',
                fontFamily: 'Inter, Kanit, sans-serif',
                fontSize: 44,
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1.08,
                color: '#ffffff'
              }}
            >
              {t('auth.register_marketing_headline')}
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
              {t('auth.register_marketing_description')}
            </p>

            <div
              style={{
                marginTop: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(191,219,254,0.92)',
                flexWrap: 'wrap'
              }}
            >
              <span>{t('auth.register_marketing_verified_security')}</span>
              <span style={{ width: 4, height: 4, borderRadius: 999, background: 'rgba(96,165,250,0.9)' }} />
              <span>{t('auth.register_marketing_multilanguage')}</span>
            </div>

            <div style={{
              marginTop: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', gap: 0, color: '#fbbf24', fontSize: 14, lineHeight: 1 }}>
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(219,234,254,0.92)' }}>{t('auth.register_marketing_trusted')}</span>
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 2, fontSize: 12, color: 'rgba(191,219,254,0.85)', marginTop: 'auto' }}>
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
          {/* Language Switcher */}
          <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
            <LanguageSwitcher />
          </div>

          <div className="register-mobileLogo" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1.5rem',
            color: '#0F172A'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'white',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '1px solid #e2e8f0'
            }}>
              <img src="/Inventory Hub .png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{
              fontFamily: 'Kanit, sans-serif',
              fontSize: '2.4rem',
              fontWeight: '900',
              letterSpacing: '-0.02em',
              lineHeight: 1
            }}>
              Inventory Pro
            </div>
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
              {t('auth.create_account_title')}
            </h1>
            <h2 style={{
              fontFamily: 'Kanit, sans-serif',
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#0F172A',
              margin: '0 0 0.5rem 0'
            }}>
              {t('auth.register_title')}
            </h2>
            <p style={{
              color: '#64748B',
              fontSize: '0.95rem',
              margin: 0
            }}>
              {t('auth.register_subtitle')}
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
                  fontWeight: '600',
                  color: '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {t('auth.full_name')} *
                </label>
                <input
                  type="text"
                  placeholder={t('auth.name_placeholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.password_hint')}
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
                {password && password.length < 6 && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#ef4444' }}>
                    {t('auth.password_too_short', { count: 6 - password.length })}
                  </p>
                )}
              </div>

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
                  {t('auth.confirm_password') || 'Confirm Password'} *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t('auth.confirm_password_placeholder') || 'Re-enter your password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    onClick={() => setShowConfirmPassword((v) => !v)}
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
                    aria-label="toggle confirm password visibility"
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#ef4444' }}>
                    {t('auth.password_not_match') || 'Passwords do not match'}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{ width: 16, height: 16, marginTop: 3, accentColor: '#135bec' }}
                />
                <span style={{ fontSize: 12, color: '#4c669a', lineHeight: 1.5 }}>
                  {t('auth.agree_terms_prefix') || 'I agree to the'}{' '}
                  <a href="#" style={{ color: '#135bec', fontWeight: 600, textDecoration: 'none' }}>
                    {t('auth.terms') || 'Terms of Service'}
                  </a>
                  {' '}{t('auth.and') || 'and'}{' '}
                  <a href="#" style={{ color: '#135bec', fontWeight: 600, textDecoration: 'none' }}>
                    {t('auth.privacy') || 'Privacy Policy'}
                  </a>
                  .
                </span>
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
                {loading ? t('auth.registering') : t('auth.register')}
              </button>

              {/* Login Link */}
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <p style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: '1rem' }}>
                  {t('auth.have_account')}
                </p>
                <Link
                  to="/login"
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
                  {t('auth.login')}
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
          .register-mobileLogo {
            display: flex;
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
