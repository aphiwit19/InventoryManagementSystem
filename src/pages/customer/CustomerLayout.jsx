import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../auth/AuthContext';
import { getCart, migrateLocalStorageCart } from '../../services';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const CustomerLayout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) {
      setCartCount(0);
      return;
    }

    const loadCart = async () => {
      try {
        const legacyKey = 'customerCart';
        const perUserKey = `customerCart_${user.uid}`;
        await migrateLocalStorageCart(user.uid, legacyKey, 'customer');
        await migrateLocalStorageCart(user.uid, perUserKey, 'customer');

        const cartItems = await getCart(user.uid, 'customer');
        const totalItems = cartItems.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        );
        setCartCount(totalItems);
      } catch (err) {
        console.warn('load customer cart failed:', err);
      }
    };

    loadCart();

    const handler = () => {
      loadCart();
    };

    window.addEventListener('customer-cart-updated', handler);
    return () => {
      window.removeEventListener('customer-cart-updated', handler);
    };
  }, [user?.uid]);

  // Menu items with icons
  const menuItems = [
    { path: '/customer', icon: '/cubes.png', labelKey: 'product.product_list', exact: true, isImage: true },
    { path: '/customer/withdraw', icon: '/shopping-basket.png', labelKey: 'cart.cart', badge: cartCount, isImage: true },
    { path: '/customer/orders', icon: '/tracking.png', labelKey: 'order.track_status', isImage: true },
    { path: '/customer/profile', icon: '/people.png', labelKey: 'common.profile', isImage: true },
  ];

  const isActiveLink = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Style สำหรับ Link ที่ active - InventoryPro Style
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
    position: 'relative',
  });

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
            📍 {t('customer.system_name') || 'ระบบจัดการคลังสินค้าออนไลน์'}
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '0.15rem',
              }}
            >
              <span>{profile?.displayName || t('customer.default_name') || 'ลูกค้า คนที่1'}</span>
              <span style={{ fontSize: '1.8rem' }}>👋</span>
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
                placeholder={t('common.search_placeholder') || 'common.search_placeholder'}
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
            {/* Cart */}
            <button
              type="button"
              onClick={() => navigate('/customer/withdraw')}
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
                    color: '#ffffff',
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
              onClick={() => navigate('/customer/profile')}
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
                  {item.badge > 0 && item.path === '/customer/withdraw' && (
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
}

export default CustomerLayout;
