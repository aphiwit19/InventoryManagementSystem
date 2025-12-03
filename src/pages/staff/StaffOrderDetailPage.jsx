import { useLocation, useNavigate, useParams } from 'react-router-dom';

export default function StaffOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state && location.state.order;

  if (!order) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: 24 }}>
          <p>ไม่พบข้อมูลคำสั่งเบิก</p>
          <button
            type="button"
            onClick={() => navigate('/staff/orders')}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: '1px solid #ddd',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            กลับไปหน้าติดตามคำสั่งเบิก
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

  const deliveryMethod = (order.deliveryMethod || 'shipping') === 'pickup' ? 'รับเอง' : 'จัดส่ง';

  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => navigate('/staff/orders')}
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid #ddd',
            background: '#fff',
            cursor: 'pointer',
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          ← กลับไปหน้าติดตามคำสั่งเบิก
        </button>

        <div
          style={{
            background: '#fff',
            borderRadius: 18,
            padding: '18px 22px',
            marginBottom: 16,
            boxShadow: '0 8px 20px rgba(15,23,42,0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: '#6B7280', letterSpacing: '0.08em' }}>STAFF WITHDRAWAL DETAIL</div>
            <h1 style={{ margin: '4px 0', fontSize: 20 }}>คำสั่งเบิก #{order.trackingNumber || id}</h1>
            <div style={{ fontSize: 13, color: '#6B7280' }}>วันที่เบิก: {dateText}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#6B7280' }}>ราคารวม</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>฿{totalText}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.1fr', gap: 16, alignItems: 'flex-start' }}>
          {/* Left: Info & items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
              <h2 style={{ margin: '0 0 10px', fontSize: 16 }}>ข้อมูลผู้เบิก</h2>
              <div style={{ fontSize: 14, color: '#111827' }}>{order.requestedBy || '-'}</div>
              {order.note && (
                <div style={{ marginTop: 6, fontSize: 13, color: '#4B5563', whiteSpace: 'pre-wrap' }}>
                  หมายเหตุ: {order.note}
                </div>
              )}
            </div>

            <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
              <h2 style={{ margin: '0 0 10px', fontSize: 16 }}>สินค้าในคำสั่งเบิก</h2>
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
          </div>

          {/* Right: Shipping info */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 16 }}>ข้อมูลการจัดส่ง</h2>
            <div style={{ fontSize: 13, color: '#374151' }}>วิธีรับ: {deliveryMethod}</div>
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
            {order.shippingCarrier && (
              <div style={{ fontSize: 13, color: '#374151', marginTop: 8 }}>
                ขนส่ง: {order.shippingCarrier}
              </div>
            )}
            {order.trackingNumber && (
              <div style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>
                Tracking: <span style={{ fontFamily: 'monospace' }}>{order.trackingNumber}</span>
              </div>
            )}
            <div style={{ fontSize: 13, color: '#374151', marginTop: 8 }}>
              สถานะ: {order.shippingStatus || 'รอดำเนินการ'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
