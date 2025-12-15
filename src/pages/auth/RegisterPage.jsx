import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import styles from './RegisterPage.module.css';

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
    <div className={styles.container}>
      {/* Left Panel - Visual & Branding (Hidden on mobile) */}
      <div className={styles.leftPanel}>
        {/* Background decoration */}
        <div className={styles.backgroundImage} style={{ backgroundImage: 'url(/login.jpg)' }} />
        <div className={styles.gradientOverlay} />
        
        {/* Branding content */}
        <div className={styles.brandingContent}>
          <div className={styles.brandingLogo}>
            <img 
              src="/Inventory Hub .png" 
              alt="Logo" 
              className={styles.brandingLogoImage}
            />
            <span className={styles.brandingLogoText}>Inventory Pro</span>
          </div>
          <h2 className={styles.brandingTitle}>
            {t('auth.register_marketing_headline')}
          </h2>
          <p className={styles.brandingDescription}>
            {t('auth.register_marketing_description')}
          </p>
          
        </div>
        
        <div className={styles.leftFooter}>
          {t('auth.copyright', { year: new Date().getFullYear() })}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className={styles.rightPanel}>
        {/* Language Switcher */}
        <div className={styles.languageSwitcher}>
          <LanguageSwitcher />
        </div>

        {/* Mobile Logo */}
        <div className={styles.mobileLogo}>
          <img 
            src="/Inventory Hub .png" 
            alt="Logo" 
            className={styles.mobileLogoImage}
          />
          <span className={styles.mobileLogoText}>Inventory Pro</span>
        </div>

        {/* Form Container */}
        <div className={styles.formContainer}>
          {/* Page Heading */}
          <div className={styles.pageHeading}>
            <h1 className={styles.pageTitle}>{t('auth.create_account_title')}</h1>
            <p className={styles.pageSubtitle}>{t('auth.register_subtitle')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className={styles.form}>
            {/* Name Field */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="name">
                {t('auth.full_name')}
              </label>
              <input
                className={styles.input}
                id="name"
                name="name"
                type="text"
                placeholder={t('auth.name_placeholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Email Field */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="email">
                {t('auth.email')}
              </label>
              <input
                className={styles.input}
                id="email"
                name="email"
                type="email"
                placeholder={t('auth.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="password">
                {t('auth.password')}
              </label>
              <div className={styles.inputWrapper}>
                <input
                  className={`${styles.input} ${styles.inputWithIcon}`}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.password_hint')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className={styles.passwordToggle}
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="toggle password visibility"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
              {password && password.length < 6 && (
                <p className={styles.validationMessage}>
                  {t('auth.password_too_short', { count: 6 - password.length })}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="confirmPassword">
                {t('auth.confirm_password') || 'Confirm Password'}
              </label>
              <div className={styles.inputWrapper}>
                <input
                  className={`${styles.input} ${styles.inputWithIcon}`}
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('auth.confirm_password_placeholder') || 'Re-enter your password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  className={styles.passwordToggle}
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label="toggle confirm password visibility"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showConfirmPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className={styles.validationMessage}>
                  {t('auth.password_not_match') || 'Passwords do not match'}
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className={styles.termsGroup}>
              <input
                className={styles.checkbox}
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <label htmlFor="terms" className={styles.termsText}>
                {t('auth.agree_terms_prefix') || 'I agree to the'}{' '}
                <a href="#" className={styles.termsLink}>
                  {t('auth.terms') || 'Terms of Service'}
                </a>
                {' '}{t('auth.and') || 'and'}{' '}
                <a href="#" className={styles.termsLink}>
                  {t('auth.privacy') || 'Privacy Policy'}
                </a>
                .
              </label>
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
                {loading ? t('auth.registering') : t('auth.register')}
              </span>
            </button>

            {/* Login Link */}
            <div className={styles.loginSection}>
              <p className={styles.loginText}>
                {t('auth.have_account')}
                <Link className={styles.loginLink} to="/login">
                  {t('auth.login')}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
