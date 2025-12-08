import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function CustomerOrderSuccessPage() {
  const { t } = useTranslation();
  return (
    <div style={{ padding: '40px 20px', background: '#f0f4ff', minHeight: '100vh' }}>
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 24,
          padding: '40px 32px',
          boxShadow: '0 14px 40px rgba(0,0,0,0.12)',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: '#e8f5e9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}
        >
          <span style={{ fontSize: 40 }}>✅</span>
        </div>
        <h2 style={{ margin: '0 0 12px', fontSize: 24, color: '#111827' }}>{t('message.order_success_title')}</h2>
        <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: 15 }}>
          {t('message.order_success_message')}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link
            to="/customer/orders"
            style={{
              padding: '10px 24px',
              borderRadius: 999,
              border: '1px solid #2563EB',
              color: '#2563EB',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            {t('message.view_orders')}
          </Link>

          <Link
            to="/customer"
            style={{
              padding: '10px 24px',
              borderRadius: 999,
              background: 'linear-gradient(90deg,#2563EB,#1D4ED8)',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
              boxShadow: '0 4px 12px rgba(37,99,235,0.35)'
            }}
          >
            {t('cart.continue_shopping')}
          </Link>
        </div>
      </div>
    </div>
  );
}
