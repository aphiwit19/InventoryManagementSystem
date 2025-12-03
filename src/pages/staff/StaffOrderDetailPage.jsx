import { useLocation, useNavigate, useParams } from 'react-router-dom';

export default function StaffOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state && location.state.order;

  if (!order) {
    return (
      <div style={{ 
        padding: 32, 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e0f2fe 100%)',
      }}>
        <div style={{ 
          maxWidth: 600, 
          margin: '0 auto', 
          background: '#fff', 
          borderRadius: 20, 
          padding: 32,
          boxShadow: '0 10px 40px rgba(30,64,175,0.1)',
        }}>
          <p style={{ fontSize: 16, color: '#374151', marginBottom: 16 }}>ไม่พบข้อมูลคำสั่งเบิก</p>
          <button
            type="button"
            onClick={() => navigate('/staff/orders')}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
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
  const status = order.shippingStatus || 'รอดำเนินการ';

  return (
    <div style={{ 
      padding: '32px 24px', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e0f2fe 100%)',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Main Card */}
        <div
          style={{
            background: '#fff',
            borderRadius: 24,
            padding: '28px 32px 32px',
            boxShadow: '0 10px 40px rgba(30,64,175,0.12)',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ 
              fontSize: 12, 
              color: '#3b82f6', 
              fontWeight: 600,
              letterSpacing: '0.1em',
              marginBottom: 8,
            }}>
              ORDER DETAIL
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 16,
            }}>
              <div>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: 24, 
                  fontWeight: 700, 
                  color: '#1e40af',
                }}>
                  คำสั่งเบิก #{order.id?.slice(0, 20) || id}
                </h1>
                <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                  วันที่เบิก: {dateText}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>ยอดรวม</div>
                <div style={{ 
                  fontSize: 32, 
                  fontWeight: 700, 
                  color: '#0ea5e9',
                }}>
                  ฿{totalText}
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 20,
            marginBottom: 24,
          }}>
            {/* ข้อมูลผู้เบิก */}
            <div style={{ 
              background: '#eff6ff', 
              borderRadius: 16, 
              padding: '18px 20px',
              border: '1px solid #dbeafe',
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 10, 
                marginBottom: 14,
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}>
                  👤
                </div>
                <span style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  color: '#1e40af',
                }}>
                  ข้อมูลผู้เบิก
                </span>
              </div>
              <div style={{ fontSize: 15, color: '#111827', fontWeight: 500 }}>
                {order.requestedBy || '-'}
              </div>
              {order.phone && (
                <div style={{ fontSize: 14, color: '#4b5563', marginTop: 6 }}>
                  โทร: {order.phone}
                </div>
              )}
              {order.note && (
                <div style={{ 
                  fontSize: 13, 
                  color: '#6b7280', 
                  marginTop: 8,
                  whiteSpace: 'pre-wrap',
                  background: '#fff',
                  padding: '10px 12px',
                  borderRadius: 8,
                }}>
                  หมายเหตุ: {order.note}
                </div>
              )}
            </div>

            {/* สินค้าในคำสั่งเบิก */}
            <div style={{ 
              background: '#eff6ff', 
              borderRadius: 16, 
              padding: '18px 20px',
              border: '1px solid #dbeafe',
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 10, 
                marginBottom: 14,
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}>
                  📦
                </div>
                <span style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  color: '#1e40af',
                }}>
                  สินค้าในคำสั่งเบิก
                </span>
              </div>
              {items.length === 0 ? (
                <div style={{ fontSize: 14, color: '#6b7280' }}>ไม่มีสินค้า</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: idx === items.length - 1 ? 'none' : '1px solid #dbeafe',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                          {it.productName || '-'}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          จำนวน {it.quantity || 0} ชิ้น
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#0ea5e9' }}>
                          ฿{(it.subtotal || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>
                          ฿{(it.price || 0).toLocaleString()} / ชิ้น
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ข้อมูลการจัดส่ง */}
          <div style={{ 
            background: '#fff', 
            borderRadius: 16, 
            padding: '20px 24px',
            border: '1px solid #e5e7eb',
            marginBottom: 24,
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 10, 
              marginBottom: 16,
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}>
                🚚
              </div>
              <span style={{ 
                fontSize: 16, 
                fontWeight: 600, 
                color: '#1e40af',
              }}>
                ข้อมูลการจัดส่ง
              </span>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>วิธีรับ:</div>
                <div style={{ fontSize: 15, color: '#111827', fontWeight: 500 }}>{deliveryMethod}</div>
              </div>
              {order.receivedBy && (
                <div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>ผู้รับ:</div>
                  <div style={{ fontSize: 15, color: '#111827', fontWeight: 500 }}>{order.receivedBy}</div>
                </div>
              )}
              {order.receivedAddress && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>ที่อยู่รับของ:</div>
                  <div style={{ fontSize: 14, color: '#374151', whiteSpace: 'pre-wrap' }}>{order.receivedAddress}</div>
                </div>
              )}
            </div>
          </div>

          {/* สถานะการจัดส่ง */}
          <div style={{ 
            background: '#fff', 
            borderRadius: 16, 
            padding: '20px 24px',
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 10, 
              marginBottom: 16,
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}>
                📋
              </div>
              <span style={{ 
                fontSize: 16, 
                fontWeight: 600, 
                color: '#1e40af',
              }}>
                สถานะการจัดส่ง
              </span>
            </div>

            {/* Info Banner */}
            <div style={{
              background: '#fef3c7',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 20,
              fontSize: 13,
              color: '#92400e',
            }}>
              สำหรับคำสั่งจัดส่งแบบจัดส่ง ให้เลือกสถานะเป็น "ส่งของแล้ว" เมื่อผู้รับสินค้าของหรือ
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 16,
              marginBottom: 20,
            }}>
              <div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>ขนส่ง</div>
                <div style={{
                  padding: '12px 16px',
                  background: '#f9fafb',
                  borderRadius: 10,
                  border: '1px solid #e5e7eb',
                  fontSize: 14,
                  color: '#374151',
                }}>
                  {order.shippingCarrier || '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>เลขติดตาม</div>
                <div style={{
                  padding: '12px 16px',
                  background: '#f9fafb',
                  borderRadius: 10,
                  border: '1px solid #e5e7eb',
                  fontSize: 14,
                  color: '#374151',
                  fontFamily: 'monospace',
                }}>
                  {order.trackingNumber || '-'}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>สถานะปัจจุบัน</div>
              <div style={{
                padding: '12px 16px',
                background: status === 'ส่งสำเร็จ' || status === 'รับของแล้ว' 
                  ? '#d1fae5' 
                  : status === 'กำลังดำเนินการส่ง' 
                    ? '#dbeafe' 
                    : '#f3f4f6',
                borderRadius: 10,
                border: `1px solid ${
                  status === 'ส่งสำเร็จ' || status === 'รับของแล้ว'
                    ? '#6ee7b7'
                    : status === 'กำลังดำเนินการส่ง'
                      ? '#93c5fd'
                      : '#e5e7eb'
                }`,
                fontSize: 14,
                fontWeight: 600,
                color: status === 'ส่งสำเร็จ' || status === 'รับของแล้ว'
                  ? '#047857'
                  : status === 'กำลังดำเนินการส่ง'
                    ? '#1d4ed8'
                    : '#374151',
              }}>
                {status}
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/staff/orders')}
              style={{
                padding: '14px 32px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 15,
                boxShadow: '0 4px 14px rgba(107,114,128,0.3)',
              }}
            >
              ← กลับไปหน้าติดตามคำสั่งเบิก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
