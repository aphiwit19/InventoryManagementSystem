import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../auth/AuthContext';
import { getCart, migrateLocalStorageCart } from '../../services';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import styles from './CustomerLayout.module.css';

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


  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {/* Logo */}
          <Link to="/customer" className={styles.logo}>
            <img 
              src="/Inventory Hub .png" 
              alt="Logo" 
              className={styles.logoImage}
            />
            <h2 className={styles.logoText}>InventoryPro</h2>
          </Link>
          
          {/* Search */}
          <div className={styles.searchContainer}>
            <div className={styles.searchWrapper}>
              <div className={styles.searchIcon}>
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                className={styles.searchInput}
                type="text"
                placeholder={t('search') || 'Search by SKU, Name or Category...'}
              />
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Language Switcher */}
          <LanguageSwitcher />
          
          {/* Notifications */}
          <button className={styles.notificationButton} type="button">
            <span className="material-symbols-outlined">notifications</span>
            <span className={styles.notificationDot} />
          </button>
          
          {/* Cart */}
          <button 
            className={styles.cartButton} 
            type="button"
            onClick={() => navigate('/customer/withdraw')}
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {cartCount > 0 && (
              <span className={styles.cartBadge}>
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
          
          {/* Profile */}
          <button 
            className={styles.profileButton} 
            type="button"
            onClick={() => navigate('/customer/profile')}
          >
            <div 
              className={styles.profileAvatar}
              style={{ 
                backgroundImage: profile?.photoURL 
                  ? `url('${profile.photoURL}')` 
                  : 'none' 
              }}
            />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className={styles.mainLayout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarContent}>
            <h3 className={styles.sidebarTitle}>CATEGORIES</h3>
            <nav className={styles.sidebarNav}>
              {menuItems.map((item) => {
                const isActive = isActiveLink(item.path, item.exact);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                  >
                    <span className={`material-symbols-outlined ${styles.navIcon}`}>
                      {item.path === '/customer' && 'category'}
                      {item.path === '/customer/withdraw' && 'shopping_cart'}
                      {item.path === '/customer/orders' && 'local_shipping'}
                      {item.path === '/customer/profile' && 'person'}
                    </span>
                    <span className={styles.navText}>{t(item.labelKey)}</span>
                    {item.badge > 0 && item.path === '/customer/withdraw' && (
                      <span className={styles.cartBadge} style={{ position: 'static', border: 'none' }}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              
              {/* Logout */}
              <button
                type="button"
                onClick={() => signOut(auth)}
                className={styles.logoutButton}
              >
                <span className="material-symbols-outlined">logout</span>
                <span>{t('common.logout')}</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default CustomerLayout;
