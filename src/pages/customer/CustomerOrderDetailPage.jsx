import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../auth/AuthContext';
import styles from './CustomerOrderDetailPage.module.css';

export default function CustomerOrderDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if order was passed via location.state
  const orderFromState = location.state?.order;

  useEffect(() => {
    const loadOrder = async () => {
      // If order was passed via state, use it directly
      if (orderFromState) {
        setOrder(orderFromState);
        setLoading(false);
        return;
      }

      if (!id || !user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'users', user.uid, 'orders', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error('Error loading order:', err);
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [id, orderFromState, user?.uid]);

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

  const formatDateShort = (dateValue) => {
    if (!dateValue) return '-';
    let date;
    if (dateValue.seconds) {
      date = new Date(dateValue.seconds * 1000);
    } else {
      date = new Date(dateValue);
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'shipped':
      case 'กำลังดำเนินการส่ง':
        return styles.statusShipped;
      case 'delivered':
      case 'ส่งสำเร็จ':
        return styles.statusDelivered;
      case 'cancelled':
      case 'ยกเลิก':
        return styles.statusCancelled;
      case 'processing':
        return styles.statusProcessing;
      default:
        return styles.statusPending;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'shipped':
      case 'กำลังดำเนินการส่ง':
        return t('order.status_shipped');
      case 'delivered':
      case 'ส่งสำเร็จ':
        return t('order.status_delivered');
      case 'cancelled':
      case 'ยกเลิก':
        return t('order.status_cancelled');
      case 'processing':
        return t('order.status_processing');
      default:
        return t('order.status_pending');
    }
  };

  const getStepProgress = (status) => {
    switch (status) {
      case 'delivered':
      case 'ส่งสำเร็จ':
        return 100;
      case 'shipped':
      case 'กำลังดำเนินการส่ง':
        return 75;
      case 'processing':
        return 50;
      default:
        return 25;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>{t('withdraw.order_not_found')}</p>
          <button
            className={styles.emptyStateButton}
            onClick={() => navigate('/customer/orders')}
          >
            {t('order.back_to_orders')}
          </button>
        </div>
      </div>
    );
  }

  const items = order.items || [];
  const subtotal = order.subtotal || order.total || 0;
  const total = order.total || 0;
  const status = order.shippingStatus || 'pending';
  const stepProgress = getStepProgress(status);

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInfo}>
          <div className={styles.pageTitleRow}>
            <h1 className={styles.pageTitle}>
              Order #{order.id?.slice(-8).toUpperCase() || 'N/A'}
            </h1>
            <span className={`${styles.statusBadge} ${getStatusBadgeClass(status)}`}>
              {getStatusText(status)}
            </span>
          </div>
          <p className={styles.pageSubtitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>calendar_today</span>
            {t('order.placed_on')} {formatDate(order.withdrawDate || order.createdAt)}
          </p>
        </div>
              </div>

      {/* Order Status Stepper */}
      <div className={styles.stepperCard}>
        <div className={styles.stepperContainer}>
          <div className={styles.stepperLine}></div>
          <div className={styles.stepperLineProgress} style={{ width: `${stepProgress}%` }}></div>
          
          {/* Step 1: Order Placed */}
          <div className={styles.step}>
            <div className={`${styles.stepIcon} ${styles.stepIconCompleted}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>check</span>
            </div>
            <div className={styles.stepInfo}>
              <p className={styles.stepTitle}>{t('order.order_placed')}</p>
              <p className={styles.stepDate}>{formatDateShort(order.withdrawDate || order.createdAt)}</p>
            </div>
          </div>

          {/* Step 2: Processing */}
          <div className={`${styles.step} ${stepProgress < 50 ? styles.stepInactive : ''}`}>
            <div className={`${styles.stepIcon} ${stepProgress >= 50 ? styles.stepIconCurrent : styles.stepIconPending}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>inventory_2</span>
            </div>
            <div className={styles.stepInfo}>
              <p className={`${styles.stepTitle} ${stepProgress >= 50 ? styles.stepTitleCurrent : ''}`}>
                {t('order.status_processing')}
              </p>
              <p className={styles.stepDate}>{stepProgress >= 50 ? formatDateShort(order.processedAt) : t('order.status_pending')}</p>
            </div>
          </div>

          {/* Step 3: Shipped */}
          <div className={`${styles.step} ${stepProgress < 75 ? styles.stepInactive : ''}`}>
            <div className={`${styles.stepIcon} ${stepProgress >= 75 ? styles.stepIconCompleted : styles.stepIconPending}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>local_shipping</span>
            </div>
            <div className={styles.stepInfo}>
              <p className={styles.stepTitle}>{t('order.status_shipped')}</p>
              <p className={styles.stepDate}>{stepProgress >= 75 ? formatDateShort(order.shippedAt) : t('order.status_pending')}</p>
            </div>
          </div>

                  </div>
      </div>

      {/* Content Grid */}
      <div className={styles.contentGrid}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Order Items */}
          <div className={`${styles.card} ${styles.orderItemsCard}`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                {t('order.order_items')}
                <span className={styles.cardTitleCount}>({items.length} {t('common.items')})</span>
              </h3>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className={styles.tableHeadCell}>{t('product.product')}</th>
                    <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>{t('common.price')}</th>
                    <th className={`${styles.tableHeadCell} ${styles.tableHeadCellCenter}`}>{t('common.quantity')}</th>
                    <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>{t('common.total')}</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {items.map((item, idx) => (
                    <tr key={idx} className={styles.tableRow}>
                      <td className={styles.tableCell}>
                        <div className={styles.productInfo}>
                          <span className={styles.productName}>{item.productName || '-'}</span>
                          <span className={styles.productSku}>
                            {item.variantSize && `Size: ${item.variantSize}`}
                            {item.variantSize && item.variantColor && ' | '}
                            {item.variantColor && `Color: ${item.variantColor}`}
                          </span>
                        </div>
                      </td>
                      <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                        <span className={styles.priceText}>฿{(item.price || 0).toLocaleString()}</span>
                      </td>
                      <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
                        <span className={styles.priceText}>{item.quantity || 0}</span>
                      </td>
                      <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                        <span className={styles.totalText}>฿{(item.subtotal || 0).toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Section */}
          {order.notes && (
            <div className={`${styles.card} ${styles.notesCard}`}>
              <h3 className={styles.notesTitle}>{t('order.order_note')}</h3>
              <div className={styles.noteItem}>
                <div className={styles.noteIcon}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>edit_note</span>
                </div>
                <div className={styles.noteContent}>
                  <p className={styles.noteLabel}>{t('order.customer_request')}</p>
                  <p className={styles.noteText}>"{order.notes}"</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* Order Summary */}
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <h3 className={styles.summaryTitle}>{t('order.order_summary')}</h3>
            </div>
            <div className={styles.summaryBody}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>{t('order.product_total')}</span>
                <span className={styles.summaryValue}>฿{subtotal.toLocaleString()}</span>
              </div>
              <div className={styles.summaryDivider}></div>
              <div className={styles.summaryTotal}>
                <span className={styles.summaryTotalLabel}>{t('common.total')}</span>
                <span className={styles.summaryTotalValue}>฿{total.toLocaleString()}</span>
              </div>
            </div>
                      </div>

          {/* Customer Info */}
          <div className={styles.customerCard}>
            <div className={styles.customerBody}>
              <div className={styles.customerHeader}>
                <div className={styles.customerAvatar}>
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div className={styles.customerInfo}>
                  <h4 className={styles.customerName}>{order.requestedBy || user?.displayName || '-'}</h4>
                  <p className={styles.customerSince}>Customer</p>
                </div>
              </div>
              <div className={styles.customerDivider}></div>
              
              {/* Shipping Address */}
              <div className={styles.addressSection}>
                <h5 className={styles.addressLabel}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>local_shipping</span>
                  {t('order.shipping_address')}
                </h5>
                <p className={styles.addressText}>
                  {order.requestedAddress || '-'}
                </p>
              </div>

              {/* Phone */}
              {order.phone && (
                <div className={styles.addressSection}>
                  <h5 className={styles.addressLabel}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>phone</span>
                    {t('common.phone')}
                  </h5>
                  <p className={styles.addressText}>{order.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className={styles.paymentCard}>
            <h5 className={styles.paymentLabel}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>credit_card</span>
              {t('payment.payment_info')}
            </h5>
            <div className={styles.paymentMethod}>
              <div className={styles.paymentIcon}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>account_balance</span>
              </div>
              <div className={styles.paymentInfo}>
                <p className={styles.paymentName}>{order.paymentMethod === 'bank_transfer_qr' ? 'Bank Transfer' : (order.paymentMethod || 'Bank Transfer')}</p>
                <p className={styles.paymentExpiry}>{order.paymentAccount?.bankName || '-'}</p>
              </div>
            </div>
            <div className={styles.paymentStatus}>
              <span className={styles.paymentStatusLabel}>{t('order.payment_status')}</span>
              <div className={styles.paymentStatusValue}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>check_circle</span>
                <span>{t('order.paid')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className={styles.backButtonWrapper}>
        <button className={styles.backButton} onClick={() => navigate('/customer/orders')}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>arrow_back</span>
          {t('order.back_to_orders')}
        </button>
      </div>
    </div>
  );
}
