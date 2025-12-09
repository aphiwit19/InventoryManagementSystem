import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const AdminLayout = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const currentOrdersSource = params.get('source') || 'customer';

  const isActiveLink = (path) => {
    if (path === '/admin/products') {
      return location.pathname === '/admin/products' || location.pathname.startsWith('/admin/products/');
    }
    return location.pathname === path;
  };

  const isOrdersActive = (source) => {
    return location.pathname === '/admin/orders' && currentOrdersSource === source;
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: '🏠', labelKey: 'common.dashboard' },
    { path: '/admin/products', icon: '/cubes.png', labelKey: 'admin.products', isImage: true },
    { path: '/admin/orders?source=customer', icon: '/shopping-basket.png', labelKey: 'order.customer_orders', isOrderSource: 'customer', isImage: true },
    { path: '/admin/orders?source=staff', icon: '/cash-machine.png', labelKey: 'order.staff_orders', isOrderSource: 'staff', isImage: true },
    { path: '/admin/inventory_history', icon: '📊', labelKey: 'admin.inventory_history' },
    { path: '/admin/payment-account', icon: '💳', labelKey: 'admin.payment_settings' },
    { path: '/admin/alerts', icon: '🔔', labelKey: 'admin.low_stock_alert' },
    { path: '/admin/users', icon: '👥', labelKey: 'user.user_management' },
    { path: '/admin/profile', icon: '/people.png', labelKey: 'common.profile', isImage: true },
  ];

  const getLinkStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.2rem',
    textDecoration: 'none',
    color: isActive ? '#FFFFFF' : '#374151',
    borderRadius: '12px',
    transition: 'all 0.25s ease',
    fontSize: '1rem',
    fontWeight: 500,
    background: isActive
      ? 'linear-gradient(135deg, #2D9CDB 0%, #56CCF2 100%)'
      : 'transparent',
    boxShadow: isActive
      ? '0 6px 20px rgba(45, 156, 219, 0.4), 0 3px 10px rgba(86, 204, 242, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
      : 'none',
    transform: isActive ? 'translateY(-1px)' : 'none',
    border: isActive ? 'none' : '1px solid rgba(148, 163, 184, 0.2)',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(180deg, #EEF2FF 0%, #E0F2FE 45%, #F9FAFB 100%)' }}>
      <div
        style={{
          width: '280px',
          background: 'linear-gradient(180deg, #EEF2FF 0%, #E0F2FE 45%, #F9FAFB 100%)',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 18px rgba(15, 23, 42, 0.18)',
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
              overflow: 'hidden',
              background: 'white',
              padding: '3px',
            }}
          >
            <img src="/Inventory Hub .png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Kanit', sans-serif",
                fontSize: '1.4rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #0EA5E9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '1px',
              }}
            >
              INVENTORY
            </div>
            <div style={{ fontFamily: "'Kanit', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#64748B', letterSpacing: '3px', marginTop: '-2px' }}>
              HUB
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
          <div style={{ marginBottom: '0.8rem' }}>
            <LanguageSwitcher style={{ width: '100%' }} />
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {menuItems.map((item) => {
              const isActive = item.isOrderSource ? isOrdersActive(item.isOrderSource) : isActiveLink(item.path.split('?')[0]);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={getLinkStyle(isActive)}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(45, 156, 219, 0.1)';
                      e.currentTarget.style.color = '#2D9CDB';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.12)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#374151';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.3rem', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.isImage ? <img src={item.icon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} /> : item.icon}
                  </span>
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div style={{ padding: '0.8rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', borderRadius: '12px', padding: '0.8rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.7rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 3px 10px rgba(59, 130, 246, 0.3)', border: '2px solid white', flexShrink: 0 }}>
                👤
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: "'Kanit', sans-serif", fontSize: '0.9rem', fontWeight: 600, color: '#1F2937' }}>{profile?.displayName || 'Admin'}</div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{t('user.role_admin')}</div>
              </div>
            </div>
            <button
              onClick={() => signOut(auth)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                width: '100%',
                padding: '0.55rem 0.9rem',
                background: '#FFFFFF',
                border: '1px solid rgba(148, 163, 184, 0.5)',
                borderRadius: '999px',
                color: '#2563EB',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.85rem',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2563EB';
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.color = '#2563EB';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.12)';
              }}
            >
              <img src="/shutdown.png" alt="Logout" style={{ width: 16, height: 16, objectFit: 'contain' }} />
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', padding: '2rem', boxSizing: 'border-box' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;