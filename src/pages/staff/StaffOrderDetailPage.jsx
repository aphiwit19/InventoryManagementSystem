import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthContext';
import { getWithdrawalsByUser } from '../../services';
import styles from './StaffOrderDetailPage.module.css';

export default function StaffOrderDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id || !user?.uid) return;
      setLoading(true);
      try {
        const orders = await getWithdrawalsByUser(user.uid);
        const foundOrder = orders.find(o => o.id === id);
        setOrder(foundOrder || null);
      } catch (error) {
        console.error('Failed to load order:', error);
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [id, user?.uid]);

  if (loading) {
    return (
      <div className={styles.stateWrap}>
        <div className={styles.stateCard}>
          <p className={styles.stateText}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.stateWrap}>
        <div className={styles.stateCard}>
          <p className={styles.stateText}>
            {t('withdraw.order_not_found') || t('order.notFound') || 'ไม่พบคำสั่งซื้อ'}
          </p>
          <button type="button" className={styles.btn} onClick={() => navigate('/staff/orders')}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            {t('common.back') || 'กลับ'}
          </button>
        </div>
      </div>
    );
  }

  const items = order.items || [];
  const total = order.total || 0;
  const orderNumber = order.orderNumber || `#${id.slice(0, 8).toUpperCase()}`;

  const toDateMs = (w) => {
    if (!w) return 0;
    if (w.seconds) return w.seconds * 1000;
    const ms = new Date(w).getTime();
    return Number.isFinite(ms) ? ms : 0;
  };
  const dateMs = toDateMs(order.withdrawDate);
  const dateStr = dateMs ? new Date(dateMs).toLocaleDateString('th-TH') : '-';
  const timeStr = dateMs
    ? new Date(dateMs).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    : '';

  const deliveryMethod = order.deliveryMethod || 'shipping';
  const deliveryText = deliveryMethod === 'pickup' ? (t('order.pickup') || 'รับเอง') : (t('order.shipping') || 'จัดส่ง');

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <a
            href="#"
            className={styles.breadcrumbLink}
            onClick={(e) => {
              e.preventDefault();
              navigate('/staff/orders');
            }}
          >
            {t('order.orders') || 'Orders'}
          </a>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            chevron_right
          </span>
          <span className={styles.breadcrumbCurrent}>{orderNumber}</span>
        </nav>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{orderNumber}</h1>
            </div>
            <div className={styles.subTitle}>
              {t('withdraw.withdraw_date') || t('common.date') || 'Date'}: {dateStr}{timeStr ? ` ${timeStr}` : ''}
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => navigate(`/staff/orders/${id}`)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>local_shipping</span>
              {t('order.shipping') || 'Ship Order'}
            </button>
          </div>
        </div>

        <div className={styles.grid}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  {t('order.order_items') || 'Order Items'} <span style={{ fontWeight: 600, color: '#64748b' }}>({items.length})</span>
                </h3>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th} style={{ width: '50%' }}>{t('product.product') || 'Product'}</th>
                      <th className={`${styles.th} ${styles.tdRight}`}>{t('common.price') || 'Price'}</th>
                      <th className={styles.th} style={{ textAlign: 'center' }}>{t('common.quantity') || 'Qty'}</th>
                      <th className={`${styles.th} ${styles.tdRight}`}>{t('common.total') || 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => {
                      const thumbStyle = it.image ? { backgroundImage: `url('${it.image}')` } : undefined;
                      const subtotal = (it.subtotal ?? ((it.price || 0) * (it.quantity || 0))) || 0;
                      const skuText = it.sku || it.productId || '-';
                      return (
                        <tr key={`${it.productId || idx}-${idx}`}>
                          <td className={styles.td}>
                            <div className={styles.itemCell}>
                              <div className={styles.thumb} style={thumbStyle} />
                              <div>
                                <div className={styles.itemName}>{it.productName || '-'}</div>
                                <div className={styles.itemSub}>SKU: {skuText}</div>
                              </div>
                            </div>
                          </td>
                          <td className={`${styles.td} ${styles.tdRight}`}>฿{Number(it.price || 0).toLocaleString()}</td>
                          <td className={styles.td} style={{ textAlign: 'center' }}>{Number(it.quantity || 0).toLocaleString()}</td>
                          <td className={`${styles.td} ${styles.tdRight}`}>฿{Number(subtotal || 0).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className={styles.summary}>
                <div className={styles.summaryRow}>
                  <span>{t('common.total') || 'Total'}</span>
                  <span className={styles.summaryTotal}>฿{Number(total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{t('order.order_note') || 'Order Notes'}</h3>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.noteBox}>
                  <textarea
                    className={styles.noteArea}
                    placeholder={t('order.order_note') || 'Notes'}
                    value={order.note || ''}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{t('order.customer_info') || t('withdraw.requested_by') || 'Customer'}</h3>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.kv}>
                  <div className={styles.k}>{t('withdraw.requested_by') || 'Requested by'}</div>
                  <div className={styles.v}>{order.requestedBy || '-'}</div>
                </div>
                <div style={{ height: 12 }} />
                <div className={styles.kv}>
                  <div className={styles.k}>{t('order.receiver') || 'Receiver'}</div>
                  <div className={styles.v}>{order.receivedBy || '-'}</div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{t('order.shipping_info') || 'Delivery'}</h3>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.kv}>
                  <div className={styles.k}>{t('order.delivery_method') || 'Delivery method'}</div>
                  <div className={styles.v}>{deliveryText}</div>
                </div>
                <div style={{ height: 12 }} />
                <div className={styles.kv}>
                  <div className={styles.k}>{t('order.tracking') || t('order.tracking_number') || 'Tracking'}</div>
                  <div className={styles.v} style={{ fontFamily: 'monospace' }}>{order.trackingNumber || '-'}</div>
                </div>
                {deliveryMethod === 'shipping' && (
                  <>
                    <div style={{ height: 12 }} />
                    <div className={styles.kv}>
                      <div className={styles.k}>{t('order.shipping_address') || 'Shipping Address'}</div>
                      <div className={styles.v}>{order.receivedAddress || order.requestedAddress || '-'}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
