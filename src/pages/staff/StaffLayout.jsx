import React, { useEffect, useState } from 'react';

import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { getCart } from '../../services';

const StaffLayout = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Load staff cart count and listen for updates
  useEffect(() => {
    if (!user?.uid) {
      setCartCount(0);
      return;
    }

    const loadCartCount = async () => {
      try {
        const cartItems = await getCart(user.uid, 'staff');
        const total = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        setCartCount(total);
      } catch (err) {
        console.warn('load staff cart failed:', err);
      }
    };

    loadCartCount();

    const handler = () => {
      loadCartCount();
    };

    window.addEventListener('staff-cart-updated', handler);
    return () => {
      window.removeEventListener('staff-cart-updated', handler);
    };
  }, [user?.uid]);

  // Menu items with icons
  const menuItems = [
    { path: '/staff', icon: '/cubes.png', labelKey: 'product.product_list', exact: true, isImage: true },
    { path: '/staff/withdraw', icon: '/cash-machine.png', labelKey: 'withdraw.withdraw_request', isImage: true },
    { path: '/staff/orders', icon: '/tracking.png', labelKey: 'order.track_status', isImage: true },
    { path: '/staff/profile', icon: '/people.png', labelKey: 'common.profile', isImage: true },
  ];

  const isActiveLink = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Top Info Bar */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '0.4rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#64748B',
          }}
        >
          <span>
            📍 {t('staff.system_name') || t('customer.system_name') || 'ระบบจัดการคลังสินค้าออนไลน์'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main Header with Search & Icons */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '0.9rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
          }}
        >
          {/* Left: Greeting */}
          <div>
            <div
              style={{
                fontFamily: "'Kanit', sans-serif",
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '0.15rem',
              }}
            >
              <span>{profile?.displayName || 'Staff'}</span>
              <span style={{ fontSize: '1.5rem' }}>👋</span>
            </div>
          </div>

          {/* Center: Big Search */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 920,
                background: '#F1F5F9',
                borderRadius: 999,
                border: '2px solid #E2E8F0',
                padding: '0.6rem 1.4rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
              }}
            >
              <input
                type="text"
                placeholder={t('common.search_placeholder') || 'ค้นหาสินค้า...'}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '1.05rem',
                  background: 'transparent',
                  color: '#0F172A',
                }}
              />
              <span style={{ fontSize: '1.3rem', color: '#64748B' }}>🔍</span>
            </div>
          </div>

          {/* Right: Icons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            {/* Cart/Withdraw */}
            <button
              type="button"
              onClick={() => navigate('/staff/withdraw')}
              style={{
                width: 70,
                height: 70,
                borderRadius: 20,
                border: 'none',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(148, 163, 184, 0.25)',
                color: '#0F172A',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <span style={{ fontSize: '1.8rem' }}>🛒</span>
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: '#EF4444',
                    color: '#fff',
                    borderRadius: 999,
                    minWidth: 18,
                    height: 18,
                    padding: '0 4px',
                    fontSize: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
            {/* Profile */}
            <button
              type="button"
              onClick={() => navigate('/staff/profile')}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <img
                src="/people.png"
                alt="Profile"
                style={{ width: 36, height: 36, objectFit: 'contain' }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav
        style={{
          background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
          boxShadow: '0 4px 16px rgba(30, 64, 175, 0.4)',
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '0 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {menuItems.map((item) => {
              const isActive = isActiveLink(item.path, item.exact);
              const baseStyle = {
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.85rem 1.3rem',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                color: '#ffffff',
                borderBottom: isActive
                  ? '3px solid rgba(15,23,42,0.95)'
                  : '3px solid transparent',
              };

              return (
                <Link key={item.path} to={item.path} style={baseStyle}>
                  <span>{t(item.labelKey)}</span>
                  {item.badge > 0 && item.path === '/staff/withdraw' && (
                    <span
                      style={{
                        marginLeft: 6,
                        backgroundColor: '#EF4444',
                        color: '#fff',
                        borderRadius: 999,
                        minWidth: 18,
                        height: 18,
                        padding: '0 4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            {/* Logout as nav item */}
            <button
              type="button"
              onClick={() => signOut(auth)}
              style={{
                marginLeft: '0.75rem',
                padding: '0.7rem 0',
                borderRadius: 0,
                border: 'none',
                background: 'transparent',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                color: '#FFFFFF',
              }}
            >
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '1.5rem 2rem 2.5rem',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default StaffLayout;