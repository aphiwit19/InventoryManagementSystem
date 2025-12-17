import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { getWithdrawalsByUser } from '../../services';
import styles from './CustomerOrderSuccessPage.module.css';

export default function CustomerOrderSuccessPage() {
  // eslint-disable-next-line no-unused-vars
  const { t } = useTranslation();
  const { user } = useAuth();
  const [latestOrder, setLatestOrder] = useState(null);
  const [, setLoading] = useState(true);
  const [showItems, setShowItems] = useState(false);

  useEffect(() => {
    const loadLatest = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const list = await getWithdrawalsByUser(user.uid);
        if (!Array.isArray(list) || list.length === 0) {
          setLatestOrder(null);
        } else {
          const sorted = [...list].sort((a, b) => {
            const toDate = (w) => {
              if (!w) return 0;
              if (w.seconds) return w.seconds * 1000;
              return new Date(w).getTime() || 0;
            };
            return toDate(b.withdrawDate) - toDate(a.withdrawDate);
          });
          setLatestOrder(sorted[0]);
        }
      } catch (e) {
        console.error('load latest order failed:', e);
        setLatestOrder(null);
      } finally {
        setLoading(false);
      }
    };
    loadLatest();
  }, [user?.uid]);

  const orderId = latestOrder?.orderNumber || latestOrder?.id?.slice(-8).toUpperCase() || 'XXXX';
  const items = latestOrder?.items || [];
  const itemsCount = items.length;
  const totalAmount = latestOrder?.total ?? 0;

  const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    let date;
    if (dateValue.seconds) {
      date = new Date(dateValue.seconds * 1000);
    } else {
      date = new Date(dateValue);
    }
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.container}>
      {/* Background Gradient */}
      <div className={styles.backgroundGradient}></div>

      {/* Success Card */}
      <div className={styles.successCard}>
        {/* Top Bar */}
        <div className={styles.topBar}></div>

        <div className={styles.cardContent}>
          {/* Success Icon */}
          <div className={styles.successIconWrapper}>
            <span className={`material-symbols-outlined ${styles.successIcon}`}>check_circle</span>
          </div>

          {/* Heading */}
          <h1 className={styles.heading}>{t('message.order_success_title')}</h1>
          <p className={styles.subtitle}>
            {t('message.order_success_message')}
          </p>

          {/* Order Details Box */}
          <div className={styles.orderDetailsBox}>
            <div className={styles.orderDetailsHeader}>
              <div className={styles.orderNumberSection}>
                <p className={styles.orderLabel}>{t('order.order_id')}</p>
                <p className={styles.orderNumber}>#{orderId}</p>
              </div>
              <div className={styles.orderDateSection}>
                <p className={styles.orderLabel}>{t('order.placed_on')}</p>
                <p className={styles.orderDate}>{formatDate(latestOrder?.withdrawDate)}</p>
              </div>
            </div>

            {/* Order Summary Accordion */}
            <div className={styles.accordionWrapper}>
              <details open={showItems} onToggle={(e) => setShowItems(e.target.open)}>
                <summary className={styles.accordionSummary}>
                  <span className={styles.accordionTitle}>
                    <span className={`material-symbols-outlined ${styles.accordionIcon}`}>shopping_bag</span>
                    {t('order.order_summary')} ({itemsCount} {t('common.items')})
                  </span>
                  <span className={styles.accordionArrow}>
                    <span className="material-symbols-outlined">expand_more</span>
                  </span>
                </summary>
                <div className={styles.accordionContent}>
                  <ul className={styles.itemsList}>
                    {items.map((item, idx) => (
                      <li key={idx} className={styles.itemRow}>
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{item.productName || 'Product'}</span>
                        </div>
                        <span className={styles.itemQty}>x {item.quantity || 1}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.totalRow}>
                    <span>{t('common.total')}</span>
                    <span>฿{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </details>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <Link to={`/customer/orders/${latestOrder?.id || ''}`} className={styles.primaryButton}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>visibility</span>
              {t('order.view_detail')}
            </Link>
            <Link to="/customer" className={styles.secondaryButton}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>arrow_back</span>
              {t('message.back_to_shop')}
            </Link>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <p className={styles.helpText}>
        {t('message.need_help')} <Link to="/customer" className={styles.helpLink}>{t('message.contact_support')}</Link>
      </p>
    </div>
  );
}
