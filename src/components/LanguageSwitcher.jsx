import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher({ style = {}, variant = 'default' }) {
  const { i18n } = useTranslation();

  const handleChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const baseStyle = {
    padding: '8px 12px',
    borderRadius: 8,
    border: '2px solid #e2e8f0',
    fontSize: 13,
    fontWeight: 500,
    backgroundColor: '#fff',
    color: '#1e40af',
    cursor: 'pointer',
    outline: 'none',
    ...style
  };

  const navStyle = {
    padding: '8px 14px',
    borderRadius: 999,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    cursor: 'pointer',
    outline: 'none',
    ...style
  };

  const currentStyle = variant === 'nav' ? navStyle : baseStyle;

  return (
    <select
      value={i18n.language?.split('-')[0] || 'th'}
      onChange={handleChange}
      style={currentStyle}
    >
      <option value="th">🇹🇭 ไทย</option>
      <option value="en">🇺🇸 EN</option>
    </select>
  );
}
