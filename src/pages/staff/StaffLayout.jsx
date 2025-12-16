import React, { useEffect, useState } from 'react';

import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { getCart } from '../../services';
import styles from './StaffLayout.module.css';

const StaffLayout = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

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

  const userPhotoUrl = profile?.photoURL || user?.photoURL || '';

  return (
    <div className={styles.app}>
      {/* Top Info Bar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoIcon}>
            <img src="/Inventory Hub .png" alt="Inventory Hub" width={32} height={32} />
          </div>
          <div>
            <div className={styles.logoTitle}>Inventory Hub</div>
            <div className={styles.logoSubtitle}>Staff Portal</div>
          </div>
        </div>

        <div className={styles.sidebarBody}>
          {/* Navigation Bar */}
          <nav className={styles.nav}>
            {menuItems.map((item) => {
              const isActive = isActiveLink(item.path, item.exact);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                >
                  <span className={styles.navIcon}>
                    {item.isImage ? (
                      <img src={item.icon} alt="" width={20} height={20} />
                    ) : (
                      <span className="material-symbols-outlined">grid_view</span>
                    )}
                  </span>
                  <span className={styles.navLabel}>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.userCard}>
              <div
                className={styles.avatar}
                style={userPhotoUrl ? { backgroundImage: `url(${userPhotoUrl})` } : undefined}
              ></div>
              <div className={styles.userMeta}>
                <span className={styles.userName}>{profile?.displayName || 'Staff'}</span>
                <span className={styles.userEmail}>{profile?.email || user?.email || ''}</span>
              </div>
            </div>

            <button type="button" className={styles.logoutButton} onClick={() => signOut(auth)}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Header with Search & Icons */}
      <main className={styles.main}>
        <header className={styles.topHeader}>
          <button type="button" className={styles.mobileMenuButton}>
            <span className="material-symbols-outlined">menu</span>
          </button>

          <div className={styles.searchWrap}>
            <div className={styles.searchBox}>
              <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search_placeholder') || 'Search SKU, Name, or Category (ค้นหาสินค้า)...'}
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.rightActions}>
            <LanguageSwitcher />
            <button type="button" className={styles.cartButton} onClick={() => navigate('/staff/withdraw')}>
              <span className="material-symbols-outlined">shopping_cart</span>
              {cartCount > 0 && (
                <span className={styles.cartBadge}>{cartCount > 99 ? '99+' : cartCount}</span>
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className={styles.content}>
          <Outlet context={{ searchQuery }} />
        </div>
      </main>
    </div>
  );
};

export default StaffLayout;