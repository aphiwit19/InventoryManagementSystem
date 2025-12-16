import { useMemo, useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { auth } from '../../firebase';
import styles from './ForgotPasswordPage.module.css';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isValidEmail = (val) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(val);
  const canSubmit = useMemo(() => isValidEmail(email.trim()), [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess(t('auth.reset_email_sent'));
    } catch (err) {
      setError(err?.message || t('auth.reset_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Panel */}
      <div className={styles.leftPanel}>
        <img
          src="/login.jpg"
          alt="Warehouse background"
          className={styles.backgroundImage}
        />
        <div className={styles.gradientOverlay} />
        <div className={styles.brandingContent}>
          <div className={styles.brandingIcon}>
            <span className={`material-symbols-outlined ${styles.brandingIconSymbol}`}>lock_reset</span>
          </div>
          <h2 className={styles.brandingTitle}>{t('auth.forgot_password_title')}</h2>
          <p className={styles.brandingDescription}>{t('auth.forgot_password_description')}</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>
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

          <div className={styles.pageHeading}>
            <h1 className={styles.pageTitle}>{t('auth.forgot_password_title')}</h1>
            <p className={styles.pageSubtitle}>{t('auth.forgot_password_subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
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

            {error && <div className={styles.errorMessage}>{error}</div>}
            {success && <div className={styles.successMessage}>{success}</div>}

            <button
              className={styles.submitButton}
              type="submit"
              disabled={!canSubmit || loading}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {loading ? 'hourglass_top' : 'send'}
              </span>
              {loading ? t('auth.sending_reset') : t('auth.send_reset_link')}
            </button>

            <div className={styles.helperRow}>
              <Link to="/login" className={styles.backLink}>
                {t('auth.back_to_login')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
