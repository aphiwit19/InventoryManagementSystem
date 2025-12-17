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
            {t('withdraw.order_not_found')}
          </p>
        </div>
      </div>
    );
  }

  const items = order.items || [];
  const total = order.total || 0;
  const orderNumber = order.orderNumber || `#${id.slice(0, 8).toUpperCase()}`;

  const safeStatus = order.shippingStatus || order.status || 'pending';
  const statusText = String(safeStatus);

  const handleCopyTracking = async () => {
    const text = String(order.trackingNumber || '').trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const toDateMs = (w) => {
    if (!w) return 0;
    if (w.seconds) return w.seconds * 1000;
    const ms = new Date(w).getTime();
    return Number.isFinite(ms) ? ms : 0;
  };
  const dateMs = toDateMs(order.withdrawDate);
  const dateStr = dateMs ? new Date(dateMs).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : '-';

  const deliveryMethod = order.deliveryMethod || 'shipping';
  const deliveryText = deliveryMethod === 'pickup' ? t('order.pickup') : t('order.shipping');

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{orderNumber}</h1>
              <div className={styles.statusPill}>
                <span className={styles.pulseDot} />
                <span className={styles.statusText}>{statusText}</span>
              </div>
            </div>

            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calendar_today</span>
                <span>{dateStr}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.leftCol}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={styles.cardIcon}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>inventory_2</span>
                  </div>
                  <div>
                    <div className={styles.cardTitle}>{t('withdraw.items_in_order') || t('order.order_items') || 'Order Items'}</div>
                    <div className={styles.cardSubTitle}>{t('withdraw.withdraw_order') || 'Withdrawal request details'}</div>
                  </div>
                </div>
                <span className={styles.countPill}>{items.length} {t('common.items') || 'Items'}</span>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th} style={{ width: '58%' }}>{t('product.product') || 'Product'}</th>
                      <th className={`${styles.th} ${styles.tdRight}`}>{t('common.price') || 'Price'}</th>
                      <th className={`${styles.th} ${styles.tdCenter}`}>{t('common.quantity') || 'Qty'}</th>
                      <th className={`${styles.th} ${styles.tdRight}`}>{t('common.total') || 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tbody}>
                    {items.map((it, idx) => {
                      const thumbStyle = it.image ? { backgroundImage: `url('${it.image}')` } : undefined;
                      const subtotal = (it.subtotal ?? ((it.price || 0) * (it.quantity || 0))) || 0;
                      const skuText = it.sku || it.productId || '-';
                      return (
                        <tr key={`${it.productId || idx}-${idx}`} className={styles.trHover}>
                          <td className={styles.td}>
                            <div className={styles.itemCell}>
                              <div className={styles.thumb} style={thumbStyle} />
                              <div>
                                <div className={styles.itemName}>{it.productName || '-'}</div>
                                <div className={styles.itemSub}>SKU: <span className={styles.mono}>{skuText}</span></div>
                              </div>
                            </div>
                          </td>
                          <td className={`${styles.td} ${styles.tdRight}`}>฿{Number(it.price || 0).toLocaleString()}</td>
                          <td className={`${styles.td} ${styles.tdCenter}`}>
                            <span className={styles.qtyChip}>{Number(it.quantity || 0).toLocaleString()}</span>
                          </td>
                          <td className={`${styles.td} ${styles.tdRight} ${styles.tdStrong}`}>฿{Number(subtotal || 0).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.summary}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>{t('common.total')}</span>
                  <span className={styles.summaryTotal}>฿{Number(total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={`${styles.cardIcon} ${styles.cardIconAmber}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>sticky_note_2</span>
                  </div>
                  <div>
                    <div className={styles.cardTitle}>{t('order.order_note') || 'Order Notes'}</div>
                    <div className={styles.cardSubTitle}>{t('common.optional') || 'Optional'}</div>
                  </div>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.noteContent}>
                  {order.note ? order.note : (t('common.no_data') || '-')}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.rightCol}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={`${styles.cardIcon} ${styles.cardIconPurple}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person</span>
                  </div>
                  <div>
                    <div className={styles.cardTitle}>{t('withdraw.requester_info') || t('withdraw.requested_by') || 'Receiver'}</div>
                    <div className={styles.cardSubTitle}>{t('common.details') || 'Contact information'}</div>
                  </div>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <div className={styles.avatarCircle}>
                    {String(order.requestedBy || 'S').trim().slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className={styles.infoName}>{order.requestedBy || '-'}</div>
                    <div className={styles.infoSub}>ID: <span className={styles.mono}>{id.slice(0, 8).toUpperCase()}</span></div>
                  </div>
                </div>
                <div className={styles.infoList}>
                  <div className={styles.infoItem}>
                    <div className={styles.infoIconBox}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
                    </div>
                    <span className={styles.infoText}>{order.receivedBy || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={`${styles.cardIcon} ${styles.cardIconGreen}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>local_shipping</span>
                  </div>
                  <div>
                    <div className={styles.cardTitle}>{t('order.shipping_info') || 'Delivery'}</div>
                    <div className={styles.cardSubTitle}>{t('order.shipping_instruction') || t('order.pickup_instruction') || 'Shipping information'}</div>
                  </div>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.methodBox}>
                  <div className={styles.methodLeft}>
                    <div className={styles.methodIcon}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>package_2</span>
                    </div>
                    <div>
                      <div className={styles.methodLabel}>{t('order.delivery_method') || 'Method'}</div>
                      <div className={styles.methodValue}>{deliveryText}</div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#22c55e' }}>check_circle</span>
                </div>

                <div className={styles.block}>
                  <div className={styles.blockLabel}>{t('order.tracking_number') || 'Tracking Number'}</div>
                  <div className={styles.trackingRow}>
                    <div className={styles.trackingCode}>
                      <code className={styles.mono}>{order.trackingNumber || '-'}</code>
                    </div>
                    <button type="button" className={styles.copyBtn} onClick={handleCopyTracking} disabled={!order.trackingNumber}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_copy</span>
                    </button>
                  </div>
                </div>

                {deliveryMethod === 'shipping' && (
                  <div className={styles.block}>
                    <div className={styles.blockLabel}>{t('order.shipping_address') || 'Shipping Address'}</div>
                    <div className={styles.addressRow}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#94a3b8' }}>location_on</span>
                      <div className={styles.addressText}>{order.receivedAddress || order.requestedAddress || '-'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
