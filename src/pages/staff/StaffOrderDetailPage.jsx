import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function StaffOrderDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state && location.state.order;

  if (!order) {
    return (
      <div style={{ 
        padding: 32, 
        minHeight: '100vh',
        background: 'radial-gradient(circle at top left, #4567b7 0%, #6495ed 40%, #87ceeb 80%)',
      }}>
        <div style={{ 
          maxWidth: 600, 
          margin: '0 auto', 
          background: '#fff', 
          borderRadius: 20, 
          padding: 32,
          boxShadow: '0 10px 40px rgba(30,64,175,0.1)',
        }}>
          <p style={{ fontSize: 16, color: '#374151', marginBottom: 16 }}>{t('withdraw.order_not_found')}</p>
          <button
            type="button"
            onClick={() => navigate('/staff/orders')}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {t('withdraw.back_to_orders')}
          </button>
        </div>
      </div>
    );
  }

  const items = order.items || [];
  const totalText = typeof order.total === 'number'
    ? order.total.toLocaleString()
    : (parseFloat(order.total || 0) || 0).toLocaleString();
  const dateLocale = i18n.language?.startsWith('en') ? 'en-US' : 'th-TH';
  const dateText = new Date(
    order.withdrawDate?.seconds
      ? order.withdrawDate.seconds * 1000
      : order.withdrawDate
  ).toLocaleDateString(dateLocale);

  const deliveryMethod = (order.deliveryMethod || 'shipping') === 'pickup' ? t('order.pickup') : t('order.shipping');
  const status = order.shippingStatus || 'รอดำเนินการ';

  return (
    <div style={{ 
      padding: '32px 24px', 
      minHeight: '100vh',
      background: 'radial-gradient(circle at top left, #4567b7 0%, #6495ed 40%, #87ceeb 80%)',
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
              {t('order.order_detail').toUpperCase()}
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
                  {t('withdraw.withdraw_order')} #{order.id?.slice(0, 20) || id}
                </h1>
                <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                  {t('withdraw.withdraw_date')}: {dateText}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{t('order.order_total')}</div>
                <div style={{ 
                  fontSize: 32, 
                  fontWeight: 700, 
                  color: '#111827',
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
                  {t('withdraw.requester_info')}
                </span>
              </div>
              <div style={{ fontSize: 15, color: '#111827', fontWeight: 500 }}>
                {order.requestedBy || '-'}
              </div>
              {order.phone && (
                <div style={{ fontSize: 14, color: '#4b5563', marginTop: 6 }}>
                  {t('common.phone')}: {order.phone}
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
                  {t('order.order_note')}: {order.note}
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
                  {t('withdraw.items_in_order')}
                </span>
              </div>
              {items.length === 0 ? (
                <div style={{ fontSize: 14, color: '#6b7280' }}>{t('order.no_items')}</div>
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
                          {t('common.quantity')} {it.quantity || 0} {t('common.piece')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#0ea5e9' }}>
                          ฿{(it.subtotal || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>
                          ฿{(it.price || 0).toLocaleString()} / {t('common.piece')}
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
                {t('order.shipping_info')}
              </span>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{t('order.delivery_method')}:</div>
                <div style={{ fontSize: 15, color: '#111827', fontWeight: 500 }}>{deliveryMethod}</div>
              </div>
              {order.receivedBy && (
                <div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{t('order.receiver')}:</div>
                  <div style={{ fontSize: 15, color: '#111827', fontWeight: 500 }}>{order.receivedBy}</div>
                </div>
              )}
              {order.receivedAddress && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{t('withdraw.receive_address')}:</div>
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
                {t('order.shipping_status')}
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
              {t('withdraw.shipping_instruction')}
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 16,
              marginBottom: 20,
            }}>
              <div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{t('order.carrier')}</div>
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
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{t('order.tracking_number')}</div>
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
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{t('withdraw.current_status')}</div>
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
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 15,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              }}
            >
              ← {t('withdraw.back_to_orders')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
