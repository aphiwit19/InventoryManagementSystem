import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher({ style = {}, variant = 'default' }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.split('-')[0] || 'th';

  const toggleLanguage = () => {
    const newLang = currentLang === 'th' ? 'en' : 'th';
    i18n.changeLanguage(newLang);
  };

  // Button style for sidebar
  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    borderRadius: 12,
    border: '2px solid #e2e8f0',
    fontSize: 14,
    fontWeight: 600,
    backgroundColor: '#fff',
    color: '#1e40af',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(30,64,175,0.08)',
    ...style
  };

  // Button style for navbar
  const navStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    borderRadius: 999,
    border: '2px solid rgba(255,255,255,0.3)',
    fontSize: 13,
    fontWeight: 600,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
    color: '#fff',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(4px)',
    ...style
  };

  const currentStyle = variant === 'nav' ? navStyle : baseStyle;

  return (
    <button
      onClick={toggleLanguage}
      style={currentStyle}
      onMouseEnter={(e) => {
        e.target.style.transform = 'scale(1.02)';
        if (variant === 'nav') {
          e.target.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 100%)';
        } else {
          e.target.style.boxShadow = '0 4px 12px rgba(30,64,175,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'scale(1)';
        if (variant === 'nav') {
          e.target.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)';
        } else {
          e.target.style.boxShadow = '0 2px 8px rgba(30,64,175,0.08)';
        }
      }}
    >
      <span style={{ fontSize: 18 }}>{currentLang === 'th' ? '🇹🇭' : '🇺🇸'}</span>
      <span>{currentLang === 'th' ? 'TH' : 'EN'}</span>
      <span style={{ 
        fontSize: 10, 
        opacity: 0.7,
        marginLeft: 2
      }}>
        ▼
      </span>
    </button>
  );
}
