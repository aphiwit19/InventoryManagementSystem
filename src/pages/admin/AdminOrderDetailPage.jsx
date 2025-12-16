import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { updateWithdrawalShipping } from '../../services';
import { useTranslation } from 'react-i18next';
import styles from './AdminOrderDetailPage.module.css';

const carriers = ['EMS', 'Thailand Post', 'Kerry', 'J&T', 'Flash'];
const statuses = ['รอดำเนินการ', 'กำลังดำเนินการส่ง', 'ส่งสำเร็จ'];
const pickupStatuses = ['รอดำเนินการ', 'รับของแล้ว'];

export default function AdminOrderDetailPage() {
  const { t } = useTranslation();
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

  const isStaffOrder = (initialOrder?.createdSource || '') === 'staff';
  const isPickup = (order?.deliveryMethod || 'shipping') === 'pickup';
  const statusOptions = isPickup ? pickupStatuses : statuses;

  useEffect(() => {
    if (!initialOrder) {
      navigate('/admin/orders');
    }
  }, [initialOrder, navigate]);

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
      alert('เกิดข้อผิดพลาด: ' + error.message);
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

  const items = order.items || [];
  const totalText = typeof order.total === 'number'
    ? order.total.toLocaleString()
    : (parseFloat(order.total || 0) || 0).toLocaleString();
  const dateText = new Date(
    order.withdrawDate?.seconds
      ? order.withdrawDate.seconds * 1000
      : order.withdrawDate
  ).toLocaleDateString('th-TH');

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
              {isStaffOrder ? (t('withdraw.withdraw_history') || 'ประวัติการเบิก') : 'ORDER DETAIL'}
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
                      alt="สลิปการชำระเงิน"
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
                  {s}
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
    </div>
  );
}
