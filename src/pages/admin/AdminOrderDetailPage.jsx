import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  getProductById,
  listSerialItemsByOrder,
  reserveSerialItemsForOrder,
  updateWithdrawalShipping,
} from '../../services';
import { useTranslation } from 'react-i18next';
import styles from './AdminOrderDetailPage.module.css';

const carriers = ['EMS', 'Thailand Post', 'Kerry', 'J&T', 'Flash'];
const statuses = ['รอดำเนินการ', 'กำลังดำเนินการส่ง', 'ส่งสำเร็จ'];
const pickupStatuses = ['รอดำเนินการ', 'รับของแล้ว'];

export default function AdminOrderDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialOrder = location.state && location.state.order;

  const [order] = useState(initialOrder || null);
  const [form, setForm] = useState({
    shippingCarrier: initialOrder?.shippingCarrier || '',
    trackingNumber: initialOrder?.trackingNumber || '',
    shippingStatus: initialOrder?.shippingStatus || 'รอดำเนินการ',
  });
  const [paymentStatus] = useState(initialOrder?.paymentStatus || 'pending'); // pending | confirmed | rejected
  const [saving, setSaving] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const [productsById, setProductsById] = useState({});
  const [serialInputs, setSerialInputs] = useState({});
  const [serialAssignedByProductId, setSerialAssignedByProductId] = useState({});
  const [serialBusyByProductId, setSerialBusyByProductId] = useState({});

  const isStaffOrder = (initialOrder?.createdSource || '') === 'staff';
  const isPickup = (order?.deliveryMethod || 'shipping') === 'pickup';
  const statusOptions = isPickup ? pickupStatuses : statuses;

  const getStatusLabel = (statusValue) => {
    switch (statusValue) {
      case 'รอดำเนินการ':
        return t('order.status_pending');
      case 'กำลังดำเนินการส่ง':
        return t('order.status_shipping');
      case 'ส่งสำเร็จ':
        return t('order.status_shipped');
      case 'รับของแล้ว':
        return t('order.status_picked_up');
      default:
        return statusValue;
    }
  };

  useEffect(() => {
    if (!initialOrder) {
      navigate('/admin/orders');
    }
  }, [initialOrder, navigate]);

  const items = useMemo(() => order?.items || [], [order]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!order) return;
      const ids = Array.from(new Set((order.items || []).map((it) => it.productId).filter(Boolean)));
      if (ids.length === 0) return;

      try {
        const pairs = await Promise.all(
          ids.map(async (pid) => {
            try {
              const p = await getProductById(pid);
              return [pid, p];
            } catch (e) {
              console.error('Error loading product for order item:', pid, e);
              return [pid, null];
            }
          })
        );
        setProductsById((prev) => {
          const next = { ...prev };
          for (const [pid, p] of pairs) next[pid] = p;
          return next;
        });
      } catch (e) {
        console.error('Error loading products for order:', e);
      }
    };

    loadProducts();
  }, [order]);

  useEffect(() => {
    const loadAssignedSerials = async () => {
      if (!order) return;
      if (!order.items || order.items.length === 0) return;

      const productIds = Array.from(new Set(order.items.map((it) => it.productId).filter(Boolean)));
      if (productIds.length === 0) return;

      try {
        const pairs = await Promise.all(
          productIds.map(async (pid) => {
            try {
              const rows = await listSerialItemsByOrder(pid, id);
              return [pid, rows];
            } catch (e) {
              console.error('Error loading assigned serials:', pid, e);
              return [pid, []];
            }
          })
        );

        setSerialAssignedByProductId((prev) => {
          const next = { ...prev };
          for (const [pid, rows] of pairs) next[pid] = rows;
          return next;
        });
      } catch (e) {
        console.error('Error loading assigned serials for order:', e);
      }
    };

    loadAssignedSerials();
  }, [order, id]);

  const handleBack = () => {
    // พยายามย้อนกลับหน้าก่อน ถ้าไม่มีให้กลับไป /admin/orders
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/admin/orders');
    }
  };

  const canSave = () => {
    if (!order) return false;
    return !!form.shippingStatus && !!paymentStatus;
  };

  const handleSave = async () => {
    if (!order || !canSave()) return;
    setSaving(true);
    try {
      console.log('Saving order:', { id, form, createdByUid: order.createdByUid, deliveryMethod: order.deliveryMethod });
      await updateWithdrawalShipping(id, {
        shippingCarrier: form.shippingCarrier,
        trackingNumber: form.trackingNumber.trim(),
        shippingStatus: form.shippingStatus,
        paymentStatus,
      }, order.createdByUid);
      console.log('Order saved successfully');
      // หลังบันทึก พยายามย้อนกลับไปหน้าที่มาแบบเดียวกับปุ่มย้อนกลับ
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        const src = order.createdSource === 'staff' ? 'staff' : 'customer';
        navigate(`/admin/orders?source=${src}`);
      }
    } catch (error) {
      console.error('Error saving order:', error);
      setPopupMessage(t('order.save_failed', { message: error.message || '' }));
    } finally {
      setSaving(false);
    }
  };

  if (!order) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.state}>
            <p>{t('order.no_orders_found')}</p>
            <button type="button" className={styles.backBtn} onClick={handleBack}>
              {t('order.back_to_orders')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalText = typeof order.total === 'number'
    ? order.total.toLocaleString()
    : (parseFloat(order.total || 0) || 0).toLocaleString();
  const dateText = new Date(
    order.withdrawDate?.seconds
      ? order.withdrawDate.seconds * 1000
      : order.withdrawDate
  ).toLocaleDateString((i18n.language?.split('-')[0] || 'th') === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const headerLabel = isStaffOrder
    ? (t('order.staff_orders') || 'คำสั่งเบิกพนักงาน')
    : (t('order.customer_orders') || (t('order.orders') || 'คำสั่งซื้อ'));

  const requestedByLabel = isStaffOrder
    ? (t('withdraw.requested_by') || 'ผู้ขอเบิก')
    : (t('order.customer_info') || 'ข้อมูลผู้สั่งซื้อ');

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Header Card */}
        <div className={styles.headerCard}>
          <div>
            <div className={styles.headerKicker}>
              {isStaffOrder ? (t('withdraw.withdraw_history') || 'ประวัติการเบิก') : t('order.order_detail')}
            </div>
            <h1 className={styles.headerTitle}>
              {isStaffOrder ? (t('withdraw.withdraw_id') || 'รหัสการเบิก') : t('order.order_id')} #{id}
            </h1>
            <div className={styles.headerMeta}>
              {(t('withdraw.withdraw_date') || t('order.order_date') || t('common.date'))}: {dateText}
            </div>
            <div className={styles.headerSub}>{headerLabel}</div>
          </div>
          <div className={styles.totalWrap}>
            <div className={styles.totalLabel}>{t('common.total')}</div>
            <div className={styles.totalValue}>฿{totalText}</div>
          </div>
        </div>

        {/* Two Cards Row: ข้อมูลผู้ขอเบิก/ผู้สั่งซื้อ + สินค้าในคำสั่งซื้อ */}
        <div className={styles.gridTwo}>
          {/* ข้อมูลผู้ขอเบิก/ผู้สั่งซื้อ */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person</span>
              </div>
              <h2 className={styles.cardTitle}>{requestedByLabel}</h2>
            </div>
            <div className={styles.kvList}>
              <div className={styles.kvRow}>
                <span className={styles.kvKey}>{isStaffOrder ? (t('withdraw.requested_by') || 'ผู้ขอเบิก') : (t('common.name') || 'ชื่อ')}</span>
                <span className={styles.kvValue}>{order.requestedBy || '-'}</span>
              </div>
              {order.requestedAddress && (
                <div className={styles.kvRow}>
                  <span className={styles.kvKey}>{t('common.address') || 'ที่อยู่'}</span>
                  <span className={styles.kvValue} style={{ whiteSpace: 'pre-wrap', textAlign: 'right' }}>{order.requestedAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* สินค้าในคำสั่งซื้อ */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>inventory_2</span>
              </div>
              <h2 className={styles.cardTitle}>{t('order.order_items')}</h2>
            </div>
            {items.length === 0 ? (
              <div style={{ fontSize: 14, color: '#9ca3af' }}>{t('order.no_items')}</div>
            ) : (
              <div className={styles.itemsList}>
                {items.map((it, idx) => (
                  <div key={idx} className={styles.itemRow}>
                    <div>
                      <div className={styles.itemName}>{it.productName || '-'}</div>
                      <div className={styles.itemSub}>{t('common.quantity')} {it.quantity || 0} {t('common.piece')}</div>
                    </div>
                    <div className={styles.itemPrice}>
                      <div className={styles.itemTotal}>฿{(it.subtotal || 0).toLocaleString()}</div>
                      <div className={styles.itemUnit}>฿{(it.price || 0).toLocaleString()} / {t('common.piece')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Serial assignment (Admin-only serialized electronics) */}
        {items.some((it) => {
          const pid = it.productId;
          const p = pid ? productsById[pid] : null;
          return p && p.categoryId === 'electronics' && (p.inventoryMode || 'bulk') === 'serialized';
        }) && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>qr_code_scanner</span>
              </div>
              <h2 className={styles.cardTitle}>{t('order.serial_assignment') || 'Assign Serials'}</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {items.map((it, idx) => {
                const pid = it.productId;
                if (!pid) return null;
                const p = productsById[pid];
                if (!p) return null;
                const isSerializedElectronics = p.categoryId === 'electronics' && (p.inventoryMode || 'bulk') === 'serialized';
                if (!isSerializedElectronics) return null;

                const requiredQty = parseInt(it.quantity || 0);
                const assigned = serialAssignedByProductId[pid] || [];
                const inputText = serialInputs[pid] || '';

                return (
                  <div key={`${pid}_${idx}`} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.productName || p.productName || '-'}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                          {t('common.quantity')} {requiredQty} {t('common.piece')} · {t('order.serial_assigned') || 'Assigned'}: {assigned.length}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12, marginTop: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                          {t('order.serial_input') || 'Paste serials (one per line)'}
                        </label>
                        <textarea
                          value={inputText}
                          onChange={(e) => setSerialInputs((prev) => ({ ...prev, [pid]: e.target.value }))}
                          rows={5}
                          placeholder={t('product.serial_import_placeholder')}
                          style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1', resize: 'vertical' }}
                        />
                        <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className={styles.backBtn}
                            style={{ width: 'auto', padding: '0.45rem 0.75rem' }}
                            onClick={() => setSerialInputs((prev) => ({ ...prev, [pid]: '' }))}
                            disabled={!!serialBusyByProductId[pid]}
                          >
                            {t('common.clear')}
                          </button>
                          <button
                            type="button"
                            className={styles.saveBtn}
                            style={{ width: 'auto', padding: '0.45rem 0.75rem' }}
                            disabled={!!serialBusyByProductId[pid]}
                            onClick={async () => {
                              try {
                                const serials = String(serialInputs[pid] || '')
                                  .split(/\r?\n/)
                                  .map((s) => String(s || '').trim())
                                  .filter(Boolean);

                                if (requiredQty > 0 && serials.length !== requiredQty) {
                                  setPopupMessage(t('order.serial_count_mismatch', { required: requiredQty, got: serials.length }));
                                  return;
                                }

                                setSerialBusyByProductId((prev) => ({ ...prev, [pid]: true }));
                                await reserveSerialItemsForOrder(pid, id, serials);
                                const rows = await listSerialItemsByOrder(pid, id);
                                setSerialAssignedByProductId((prev) => ({ ...prev, [pid]: rows }));
                                setSerialInputs((prev) => ({ ...prev, [pid]: '' }));
                              } catch (e) {
                                console.error('Error reserving serials:', e);
                                setPopupMessage(t('order.serial_assign_failed', { message: e.message || '' }));
                              } finally {
                                setSerialBusyByProductId((prev) => ({ ...prev, [pid]: false }));
                              }
                            }}
                          >
                            {t('order.assign_serials') || 'Assign'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                          {t('order.assigned_serials') || 'Assigned serials'}
                        </label>
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, minHeight: 120, background: '#f8fafc' }}>
                          {assigned.length === 0 ? (
                            <div style={{ fontSize: 13, color: '#94a3b8' }}>{t('order.no_assigned_serials') || 'No serials assigned yet'}</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {assigned.map((s) => (
                                <div key={s.id} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: '#0f172a' }}>
                                  {s.serial || s.id}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ข้อมูลการจัดส่ง/รับเอง Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>local_shipping</span>
            </div>
            <h2 className={styles.cardTitle}>
              {isStaffOrder ? (t('order.shipping_info') || 'ข้อมูลการจัดส่ง') : t('order.shipping_info')}
            </h2>
          </div>
          <div className={styles.kvList}>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>{t('order.delivery_method') || 'วิธีรับสินค้า'}:</span>
              <span className={styles.kvValue}>{(order.deliveryMethod || 'shipping') === 'pickup' ? t('order.pickup') : t('order.shipping')}</span>
            </div>
            {order.receivedBy && (
              <div className={styles.kvRow}>
                <span className={styles.kvKey}>{t('order.receiver')}:</span>
                <span className={styles.kvValue}>{order.receivedBy}</span>
              </div>
            )}
            {order.note && (
              <div className={styles.kvRow}>
                <span className={styles.kvKey}>{t('order.order_note')}:</span>
                <span className={styles.kvValue}>{order.note}</span>
              </div>
            )}
          </div>
        </div>

        {/* ซ่อนการชำระเงินสำหรับใบเบิกพนักงาน */}
        {!isStaffOrder && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>payments</span>
              </div>
              <h2 className={styles.cardTitle}>{t('payment.payment')}</h2>
            </div>

            {/* Payment info + slip */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16, marginBottom: 14 }}>
              <div
                style={{
                  background: 'linear-gradient(135deg,#eff6ff,#e0f2fe)',
                  borderRadius: 14,
                  padding: 14,
                  border: '1px solid #bfdbfe',
                  boxShadow: '0 4px 14px rgba(59,130,246,0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e3a8a' }}>{t('payment.customer_transfer_account')}</div>
                  {order.paymentAccount?.bankName && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: 'rgba(59,130,246,0.12)',
                        color: '#1d4ed8',
                        fontWeight: 600,
                      }}
                    >
                      {order.paymentAccount.bankName}
                    </span>
                  )}
                </div>
                {order.paymentAccount ? (
                  <>
                    <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>{order.paymentAccount.accountName || '-'}</div>
                    <div style={{ fontSize: 13, color: '#0f172a', marginTop: 4 }}>{t('payment.account_number')}: {order.paymentAccount.accountNumber || '-'}</div>
                    {order.paymentAccount.note && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#475569',
                          marginTop: 8,
                          padding: '8px 10px',
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.8)',
                        }}
                      >
                        {order.paymentAccount.note}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>{t('payment.no_account_info')}</div>
                )}
              </div>

              <div
                style={{
                  background: '#f9fafb',
                  borderRadius: 12,
                  padding: 12,
                  border: '1px solid #e5e7eb',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 8 }}>{t('order.payment_slip')}</div>
                {order.paymentSlipUrl ? (
                  <a
                    href={order.paymentSlipUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-block', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}
                  >
                    <img
                      src={order.paymentSlipUrl}
                      alt={t('order.payment_slip')}
                      style={{ maxWidth: 180, maxHeight: 220, objectFit: 'cover', display: 'block' }}
                    />
                  </a>
                ) : (
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>{t('payment.no_slip')}</div>
                )}
              </div>
            </div>

            {/* Payment status controls removed as requested */}
          </div>
        )}

        {/* สถานะการจัดส่ง Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>sync_alt</span>
            </div>
            <h2 className={styles.cardTitle}>{t('order.shipping_status')}</h2>
          </div>
          
          <div className={styles.banner}>
            {isPickup
              ? t('order.pickup_instruction')
              : t('order.shipping_instruction')}
          </div>

          {/* แสดงช่องขนส่งและ Tracking เฉพาะเมื่อเป็นแบบจัดส่ง */}
          {!isPickup && (
            <div className={styles.formGrid}>
              <div>
                <label className={styles.fieldLabel}>{t('order.carrier')}</label>
                <select
                  value={form.shippingCarrier}
                  onChange={(e) => setForm((f) => ({ ...f, shippingCarrier: e.target.value }))}
                  className={styles.select}
                >
                  <option value="">{t('order.select_carrier')}</option>
                  {carriers.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={styles.fieldLabel}>{t('order.tracking_number')}</label>
                <input
                  value={form.trackingNumber}
                  onChange={(e) => setForm((f) => ({ ...f, trackingNumber: e.target.value }))}
                  placeholder={t('order.tracking_placeholder')}
                  className={styles.input}
                />
              </div>
            </div>
          )}

          <div className={styles.fullWidth} style={{ marginBottom: 20 }}>
            <select
              value={form.shippingStatus}
              onChange={(e) => setForm((f) => ({ ...f, shippingStatus: e.target.value }))}
              className={styles.select}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {getStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !canSave()}
            className={styles.saveBtn}
          >
            {saving ? t('message.saving') : t('order.save_shipping')}
          </button>
        </div>
      </div>

      {popupMessage && (
        <div
          onClick={() => setPopupMessage('')}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '28rem',
              background: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{t('common.notice')}</div>
              <button
                type="button"
                onClick={() => setPopupMessage('')}
                style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '1rem 1.25rem', color: '#0f172a' }}>{popupMessage}</div>
            <div style={{ padding: '0 1.25rem 1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setPopupMessage('')}
                className={styles.saveBtn}
                style={{ width: 'auto', padding: '0.5rem 1rem' }}
              >
                {t('common.ok')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
