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
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header Card */}
        <div
          style={{
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: 18,
            padding: '16px 20px',
            marginBottom: 8,
            boxShadow: '0 10px 40px rgba(15,23,42,0.12), 0 4px 16px rgba(37,99,235,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid rgba(255,255,255,0.9)',
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: '#3b82f6', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 6 }}>ORDER DETAIL</div>
            <h1 style={{ margin: '0 0 6px', fontSize: 24, color: '#1e40af', fontWeight: 700 }}>คำสั่งซื้อ #{id}</h1>
            <div style={{ fontSize: 14, color: '#64748b' }}>วันที่สั่งซื้อ: {dateText}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>ยอดรวม</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#1e40af' }}>฿{totalText}</div>
          </div>
        </div>

        {/* Two Cards Row: ข้อมูลผู้สั่งซื้อ + สินค้าในคำสั่งซื้อ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
          {/* ข้อมูลผู้สั่งซื้อ */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              padding: '14px 18px',
              boxShadow: '0 4px 20px rgba(15,23,42,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 16,
                }}
              >
                👤
              </div>
              <h2 style={{ margin: 0, fontSize: 16, color: '#1e40af', fontWeight: 600 }}>ข้อมูลผู้สั่งซื้อ</h2>
            </div>
            <div style={{ fontSize: 15, color: '#111827', fontWeight: 500 }}>{order.requestedBy || '-'}</div>
            {order.requestedAddress && (
              <div style={{ marginTop: 8, fontSize: 14, color: '#6b7280', whiteSpace: 'pre-wrap' }}>
                {order.requestedAddress}
              </div>
            )}
          </div>

          {/* สินค้าในคำสั่งซื้อ */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              padding: '14px 18px',
              boxShadow: '0 4px 20px rgba(15,23,42,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 16,
                }}
              >
                📦
              </div>
              <h2 style={{ margin: 0, fontSize: 16, color: '#1e40af', fontWeight: 600 }}>สินค้าในคำสั่งซื้อ</h2>
            </div>
            {items.length === 0 ? (
              <div style={{ fontSize: 14, color: '#9ca3af' }}>ไม่มีสินค้า</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: '#111827' }}>{it.productName || '-'}</div>
                      <div style={{ fontSize: 13, color: '#9ca3af' }}>จำนวน {it.quantity || 0} ชิ้น</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#0ea5e9' }}>฿{(it.subtotal || 0).toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>฿{(it.price || 0).toLocaleString()} / ชิ้น</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ข้อมูลการจัดส่ง Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: '12px 18px',
            boxShadow: '0 4px 20px rgba(15,23,42,0.08)',
            marginBottom: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 16,
              }}
            >
              🚚
            </div>
            <h2 style={{ margin: 0, fontSize: 16, color: '#1e40af', fontWeight: 600 }}>ข้อมูลการจัดส่ง</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 14, color: '#6b7280' }}>วิธีรับ:</span>
              <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{(order.deliveryMethod || 'shipping') === 'pickup' ? 'รับเอง' : 'จัดส่ง'}</span>
            </div>
            {order.receivedBy && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 14, color: '#6b7280' }}>ผู้รับ:</span>
                <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{order.receivedBy}</span>
              </div>
            )}
            {order.note && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ fontSize: 14, color: '#6b7280' }}>หมายเหตุ:</span>
                <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{order.note}</span>
              </div>
            )}
          </div>
        </div>

        {/* สถานะการจัดส่ง Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: '20px 24px',
            boxShadow: '0 4px 20px rgba(15,23,42,0.08)',
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#374151', fontWeight: 600 }}>สถานะการจัดส่ง</h3>
          
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 16,
              fontSize: 13,
              color: '#92400e',
            }}
          >
            {isPickup
              ? 'สำหรับคำสั่งแบบรับเอง ให้เลือกสถานะเป็น "รับของแล้ว" เมื่อผู้รับมารับของจริง'
              : 'สำหรับคำสั่งจัดส่งแบบจัดส่ง ให้เลือกสถานะเป็น "ส่งของแล้ว" เมื่อผู้รับมารับของหรือ'}
          </div>

          {!isPickup && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 6, fontWeight: 500 }}>ขนส่ง</label>
                <select
                  value={form.shippingCarrier}
                  onChange={(e) => setForm((f) => ({ ...f, shippingCarrier: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
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
              <div>
                <label style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 6, fontWeight: 500 }}>เลขติดตาม</label>
                <input
                  value={form.trackingNumber}
                  onChange={(e) => setForm((f) => ({ ...f, trackingNumber: e.target.value }))}
                  placeholder="เช่น EX123456789TH"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <select
              value={form.shippingStatus}
              onChange={(e) => setForm((f) => ({ ...f, shippingStatus: e.target.value }))}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
                color: '#374151',
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
              padding: '16px 24px',
              borderRadius: 12,
              border: 'none',
              background: saving || !canSave()
                ? '#9ca3af'
                : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: '#fff',
              cursor: saving || !canSave() ? 'not-allowed' : 'pointer',
              fontSize: 16,
              fontWeight: 600,
              boxShadow: saving || !canSave() ? 'none' : '0 4px 14px rgba(59,130,246,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกการจัดส่ง'}
          </button>
        </div>
      </div>
    </div>
  );
}
