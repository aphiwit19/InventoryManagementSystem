import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
    { path: '/admin/dashboard', icon: 'dashboard', labelKey: 'common.dashboard' },
    { path: '/admin/products', icon: 'inventory_2', labelKey: 'admin.products' },
    { path: '/admin/orders?source=customer', icon: 'shopping_cart', labelKey: 'order.customer_orders', isOrderSource: 'customer' },
    { path: '/admin/orders?source=staff', icon: 'point_of_sale', labelKey: 'order.staff_orders', isOrderSource: 'staff' },
    { path: '/admin/inventory_history', icon: 'history', labelKey: 'admin.inventory_history' },
    { path: '/admin/payment-account', icon: 'account_balance', labelKey: 'admin.payment_settings' },
    { path: '/admin/alerts', icon: 'warning', labelKey: 'admin.low_stock_alert' },
    { path: '/admin/users', icon: 'group', labelKey: 'user.user_management' },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className={styles.layoutContainer}>
      {/* Sidebar Navigation */}
      <aside className={styles.sidebar}>
        {/* Sidebar Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <img src="/Inventory Hub .png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div className={styles.sidebarBrand}>
            <h1 className={styles.sidebarTitle}>{t('admin.brand_title')}</h1>
            <p className={styles.sidebarSubtitle}>{t('admin.brand_subtitle')}</p>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className={styles.sidebarNav}>
          {menuItems.map((item, index) => {
            const isActive = item.isOrderSource 
              ? isOrdersActive(item.isOrderSource) 
              : isActiveLink(item.path.split('?')[0]);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                <span className={`material-symbols-outlined ${styles.navItemIcon}`}>
                  {item.icon}
                </span>
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
          
          <div className={styles.navDivider}></div>
          
          <Link to="/admin/profile" className={`${styles.navItem} ${isActiveLink('/admin/profile') ? styles.navItemActive : ''}`}>
            <span className={`material-symbols-outlined ${styles.navItemIcon}`}>person</span>
            <span>{t('common.profile')}</span>
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {(profile?.displayName || 'A').charAt(0).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <p className={styles.userName}>{profile?.displayName || t('admin.default_user_name')}</p>
              <p className={styles.userRole}>{profile?.email || 'admin@store.com'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Top Header */}
        <header className={styles.topHeader}>
          {/* Mobile Menu Button */}
          <div className={styles.mobileMenuButton}>
            <span className="material-symbols-outlined">menu</span>
            <h2 className={styles.mobileTitle}>{t('common.dashboard')}</h2>
          </div>

          {/* Header Actions */}
          <div className={styles.headerActions}>
            <LanguageSwitcher />
            <button className={styles.notificationButton} onClick={handleLogout} title={t('common.logout')}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>logout</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className={styles.scrollableContent}>
          <div className={styles.contentWrapper}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
