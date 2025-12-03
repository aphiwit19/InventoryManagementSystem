import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { updateWithdrawalShipping } from '../../services';

const carriers = ['EMS', 'ไปรษณีย์ไทย', 'Kerry', 'J&T', 'Flash'];
const statuses = ['รอดำเนินการ', 'กำลังดำเนินการส่ง', 'ส่งสำเร็จ'];
const pickupStatuses = ['รอดำเนินการ', 'รับของแล้ว'];

export default function AdminOrderDetailPage() {
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
  const [saving, setSaving] = useState(false);

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
    if (isPickup) return !!form.shippingStatus;
    return !!(form.shippingCarrier && form.trackingNumber && form.shippingStatus);
  };

  const handleSave = async () => {
    if (!order || !canSave()) return;
    setSaving(true);
    try {
      await updateWithdrawalShipping(id, {
        shippingCarrier: form.shippingCarrier,
        trackingNumber: form.trackingNumber.trim(),
        shippingStatus: form.shippingStatus,
      }, order.createdByUid);
      // หลังบันทึก พยายามย้อนกลับไปหน้าที่มาแบบเดียวกับปุ่มย้อนกลับ
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        const src = order.createdSource === 'staff' ? 'staff' : 'customer';
        navigate(`/admin/orders?source=${src}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!order) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: 24 }}>
          <p>ไม่พบข้อมูลคำสั่งซื้อ</p>
          <button type="button" onClick={handleBack} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>
            กลับไปหน้าคำสั่งซื้อ
          </button>
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

  return (
    <div style={{ padding: '32px 24px', background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)', minHeight: '100vh', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <button
          type="button"
          onClick={handleBack}
          style={{
            padding: '10px 20px',
            borderRadius: 999,
            border: 'none',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: '#fff',
            cursor: 'pointer',
            marginBottom: 16,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
          }}
        >
          ← กลับไปหน้ารายการคำสั่งซื้อ
        </button>

        <div
          style={{
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: 18,
            padding: '20px 24px',
            marginBottom: 20,
            boxShadow: '0 10px 40px rgba(15,23,42,0.12), 0 4px 16px rgba(37,99,235,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid rgba(255,255,255,0.9)',
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: '#3b82f6', letterSpacing: '0.08em', fontWeight: 500 }}>ORDER DETAIL</div>
            <h1 style={{ margin: '4px 0', fontSize: 22, color: '#1e40af', fontWeight: 700 }}>คำสั่งซื้อ #{order.trackingNumber || id}</h1>
            <div style={{ fontSize: 13, color: '#64748b' }}>วันที่สั่งซื้อ: {dateText}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>ยอดรวม</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1e40af' }}>฿{totalText}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'flex-start' }}>
          {/* Left: Order info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', borderRadius: 18, padding: '18px 20px', boxShadow: '0 8px 32px rgba(15,23,42,0.1)', border: '1px solid rgba(255,255,255,0.9)' }}>
              <h2 style={{ margin: '0 0 12px', fontSize: 16, color: '#1e40af', fontWeight: 600 }}>ข้อมูลผู้สั่งซื้อ</h2>
              <div style={{ fontSize: 14, color: '#111827' }}>{order.requestedBy || '-'}</div>
              {order.requestedAddress && (
                <div style={{ marginTop: 6, fontSize: 13, color: '#4B5563', whiteSpace: 'pre-wrap' }}>
                  {order.requestedAddress}
                </div>
              )}
            </div>

            <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', borderRadius: 18, padding: '18px 20px', boxShadow: '0 8px 32px rgba(15,23,42,0.1)', border: '1px solid rgba(255,255,255,0.9)' }}>
              <h2 style={{ margin: '0 0 12px', fontSize: 16, color: '#1e40af', fontWeight: 600 }}>สินค้าในคำสั่งซื้อ</h2>
              {items.length === 0 ? (
                <div style={{ fontSize: 13, color: '#6B7280' }}>ไม่มีสินค้า</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 13,
                        padding: '6px 0',
                        borderBottom: idx === items.length - 1 ? 'none' : '1px solid #F3F4F6',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>{it.productName || '-'}</div>
                        <div style={{ color: '#6B7280' }}>จำนวน {it.quantity || 0} ชิ้น</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#111827' }}>฿{(it.subtotal || 0).toLocaleString()}</div>
                        <div style={{ color: '#9CA3AF', fontSize: 12 }}>฿{(it.price || 0).toLocaleString()} / ชิ้น</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', borderRadius: 18, padding: '18px 20px', boxShadow: '0 8px 32px rgba(15,23,42,0.1)', border: '1px solid rgba(255,255,255,0.9)' }}>
              <h2 style={{ margin: '0 0 12px', fontSize: 16, color: '#1e40af', fontWeight: 600 }}>ข้อมูลการจัดส่ง</h2>
              <div style={{ fontSize: 13, color: '#374151' }}>
                วิธีรับ: {(order.deliveryMethod || 'shipping') === 'pickup' ? 'รับเอง' : 'จัดส่ง'}
              </div>
              {order.receivedBy && (
                <div style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>
                  ผู้รับ: {order.receivedBy}
                </div>
              )}
              {order.receivedAddress && (
                <div style={{ fontSize: 13, color: '#4B5563', marginTop: 4, whiteSpace: 'pre-wrap' }}>
                  ที่อยู่รับของ: {order.receivedAddress}
                </div>
              )}
              {order.note && (
                <div style={{ fontSize: 13, color: '#4B5563', marginTop: 6, whiteSpace: 'pre-wrap' }}>
                  หมายเหตุ: {order.note}
                </div>
              )}
            </div>
          </div>

          {/* Right: Shipping edit */}
          <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', borderRadius: 18, padding: '18px 20px', boxShadow: '0 8px 32px rgba(15,23,42,0.1)', border: '1px solid rgba(255,255,255,0.9)', position: 'sticky', top: 24 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16, color: '#1e40af', fontWeight: 600 }}>จัดการการจัดส่ง</h2>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>
              {isPickup
                ? 'สำหรับคำสั่งแบบรับเอง ให้เลือกสถานะเป็น "รับของแล้ว" เมื่อผู้รับมารับของจริง'
                : 'สำหรับคำสั่งแบบจัดส่ง ต้องเลือกขนส่ง กรอกเลข Tracking และสถานะให้ครบก่อนบันทึก'}
            </div>

            {!isPickup && (
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 4 }}>ขนส่ง</label>
                <select
                  value={form.shippingCarrier}
                  onChange={(e) => setForm((f) => ({ ...f, shippingCarrier: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    fontSize: 13,
                  }}
                >
                  <option value="">เลือกผู้ให้บริการ</option>
                  {carriers.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!isPickup && (
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 4 }}>เลขติดตาม</label>
                <input
                  value={form.trackingNumber}
                  onChange={(e) => setForm((f) => ({ ...f, trackingNumber: e.target.value }))}
                  placeholder="เช่น EX123456789TH"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    fontSize: 13,
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 4 }}>สถานะการจัดส่ง</label>
              <select
                value={form.shippingStatus}
                onChange={(e) => setForm((f) => ({ ...f, shippingStatus: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #D1D5DB',
                  fontSize: 13,
                }}
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
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                background: saving || !canSave() ? '#9CA3AF' : '#2563EB',
                color: '#fff',
                cursor: saving || !canSave() ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกการจัดส่ง'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
