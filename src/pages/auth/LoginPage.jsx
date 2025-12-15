import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import styles from './LoginPage.module.css';

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
    <div className={styles.container}>
      {/* Left Panel - Visual & Branding (Hidden on mobile) */}
      <div className={styles.leftPanel}>
        {/* Background Image */}
        <img
          src="/login.jpg"
          alt="Warehouse background"
          className={styles.backgroundImage}
        />
        {/* Gradient Overlay */}
        <div className={styles.gradientOverlay} />
        {/* Branding Content */}
        <div className={styles.brandingContent}>
          <div className={styles.brandingIcon}>
            <span className={`material-symbols-outlined ${styles.brandingIconSymbol}`}>inventory_2</span>
          </div>
          <h2 className={styles.brandingTitle}>
            {t('auth.login_marketing_headline')}
          </h2>
          <p className={styles.brandingDescription}>
            {t('auth.login_marketing_description')}
          </p>
          <div className={styles.brandingFeatures}>
            <div className={styles.featureItem}>
              <span className={`material-symbols-outlined ${styles.featureIcon}`}>verified_user</span>
              <span>{t('auth.login_marketing_security')}</span>
            </div>
            <div className={styles.featureDot} />
            <div className={styles.featureItem}>
              <span className={`material-symbols-outlined ${styles.featureIcon}`}>language</span>
              <span>{t('auth.login_marketing_multilanguage')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>
          {/* Header with Logo & Language */}
          <div className={styles.header}>
            <div className={styles.logoContainer}>
              <img 
                src="/Inventory Hub .png" 
                alt="Logo" 
                className={styles.logoImage}
              />
              <span className={styles.logoText}>Inventory Pro</span>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Page Heading */}
          <div className={styles.pageHeading}>
            <h1 className={styles.pageTitle}>{t('auth.welcome_back_title')}</h1>
            <p className={styles.pageSubtitle}>{t('auth.welcome_back_subtitle')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className={styles.form}>
            {/* Email Field */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="email">
                {t('auth.email')}
              </label>
              <div className={styles.inputWrapper}>
                <input
                  className={styles.input}
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('auth.email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className={styles.inputIcon}>
                  <span className="material-symbols-outlined">mail</span>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="password">
                {t('auth.password')}
              </label>
              <div className={styles.inputWrapper}>
                <input
                  className={styles.input}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className={styles.passwordToggle}
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="toggle password visibility"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className={styles.metaRow}>
              <div className={styles.rememberMe}>
                <input
                  className={styles.checkbox}
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className={styles.rememberLabel} htmlFor="remember">
                  {t('auth.remember_me')}
                </label>
              </div>
              <button type="button" className={styles.forgotPassword}>
                {t('auth.forgot_password') || 'Forgot Password?'}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              className={styles.submitButton}
              type="submit"
              disabled={!canSubmit || loading}
            >
              <span className={styles.submitButtonText}>
                {loading ? t('auth.logging_in') : t('auth.login')}
              </span>
            </button>

            {/* Register Link */}
            <div className={styles.registerSection}>
              <p className={styles.registerText}>
                {t('auth.no_account')}
                <Link className={styles.registerLink} to="/register">
                  {t('auth.register')}
                </Link>
              </p>
            </div>
          </form>

          {/* Footer */}
          <div className={styles.footer}>
            <p className={styles.footerText}>
              {t('auth.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
