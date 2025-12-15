import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthContext';
import { getWithdrawalsByUser } from '../../services';

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
      <div style={{
        minHeight: '100vh',
        background: '#f8f9fc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: 16, color: '#64748B' }}>
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8f9fc',
        padding: '32px 24px'
      }}>
        <div style={{
          maxWidth: 600,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 16,
          padding: 32,
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 16, color: '#64748B', marginBottom: 16 }}>
            {t('order.notFound') || 'ไม่พบคำสั่งซื้อ'}
          </p>
          <button
            onClick={() => navigate('/staff/orders')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t('common.back') || 'กลับ'}
          </button>
        </div>
      </div>
    );
  }

  const items = order.items || [];
  const total = order.total || 0;
  const orderNumber = order.orderNumber || `#ORD-${id.slice(0, 8).toUpperCase()}`;
  const date = new Date(
    order.withdrawDate?.seconds
      ? order.withdrawDate.seconds * 1000
      : order.withdrawDate
  );
  const dateStr = date.toLocaleDateString('th-TH');

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fc',
      padding: '32px 24px'
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Main Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '32px',
          boxShadow: '0 4px 20px rgba(15,23,42,0.08)'
        }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{
              fontSize: 12,
              color: '#3B82F6',
              fontWeight: 600,
              letterSpacing: '0.1em',
              marginBottom: 12,
              textTransform: 'uppercase'
            }}>
              ORDER DETAIL
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 16
            }}>
              <div>
                <h1 style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#2563EB',
                  fontFamily: 'Kanit, sans-serif'
                }}>
                  คำสั่งซื้อ {orderNumber}
                </h1>
                <div style={{
                  fontSize: 14,
                  color: '#64748B',
                  marginTop: 6
                }}>
                  วันที่สั่งซื้อ: {dateStr}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: 13,
                  color: '#64748B',
                  marginBottom: 4
                }}>
                  ยอดรวม
                </div>
                <div style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: '#0F172A',
                  fontFamily: 'Kanit, sans-serif'
                }}>
                  ฿{total.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
            marginBottom: 24
          }}>
            {/* ข้อมูลผู้สั่งซื้อ */}
            <div style={{
              background: '#EFF6FF',
              borderRadius: 16,
              padding: '20px',
              border: '1px solid #DBEAFE'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20
                }}>
                  👤
                </div>
                <span style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#1E40AF',
                  fontFamily: 'Kanit, sans-serif'
                }}>
                  ข้อมูลผู้สั่งซื้อ
                </span>
              </div>
              <div style={{
                fontSize: 15,
                color: '#0F172A',
                fontWeight: 600,
                marginBottom: 8
              }}>
                {order.requestedBy || 'ลูกค้า คนที่ 1'}
              </div>
              <div style={{
                fontSize: 14,
                color: '#475569',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap'
              }}>
                {order.requestedAddress || '126 ถนนประชาชื่น แขวงบางซื่อ เขตบางซื่อ กรุงเทพฯ 10140'}
              </div>
            </div>

            {/* สินค้าที่สั่งซื้อ */}
            <div style={{
              background: '#ECFDF5',
              borderRadius: 16,
              padding: '20px',
              border: '1px solid #D1FAE5'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20
                }}>
                  🛒
                </div>
                <span style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#047857',
                  fontFamily: 'Kanit, sans-serif'
                }}>
                  สินค้าที่สั่งซื้อ
                </span>
              </div>
              {items.length === 0 ? (
                <div style={{ fontSize: 14, color: '#64748B' }}>
                  ไม่มีสินค้า
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {items.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: '#0F172A'
                        }}>
                          {item.productName || 'สินค้า'}
                        </div>
                        <div style={{
                          fontSize: 13,
                          color: '#64748B'
                        }}>
                          จำนวน: {item.quantity || 1} ชิ้น
                        </div>
                      </div>
                      <div style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#10B981'
                      }}>
                        ฿{(item.subtotal || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ข้อมูลการจัดส่ง */}
          <div style={{
            background: '#FEF3C7',
            borderRadius: 16,
            padding: '20px',
            border: '1px solid #FDE68A',
            marginBottom: 24
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20
              }}>
                🚚
              </div>
              <span style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#92400E',
                fontFamily: 'Kanit, sans-serif'
              }}>
                ข้อมูลการจัดส่ง
              </span>
            </div>
            <div style={{ fontSize: 14, color: '#78350F', lineHeight: 1.6 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>วิธีจัดส่ง:</strong> {order.deliveryMethod === 'pickup' ? 'รับเองที่ร้าน' : 'จัดส่ง'}
              </div>
              {order.receivedBy && (
                <div style={{ marginBottom: 8 }}>
                  <strong>ผู้รับ:</strong> {order.receivedBy}
                </div>
              )}
              {order.receivedAddress && (
                <div>
                  <strong>ที่อยู่จัดส่ง:</strong><br />
                  {order.receivedAddress}
                </div>
              )}
            </div>
          </div>

          {/* สถานะการจัดส่ง */}
          <div style={{
            background: '#F5F3FF',
            borderRadius: 16,
            padding: '20px',
            border: '1px solid #E9D5FF'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#8B5CF6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20
              }}>
                📋
              </div>
              <span style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#6B21A8',
                fontFamily: 'Kanit, sans-serif'
              }}>
                สถานะการจัดส่ง
              </span>
            </div>

            {/* Info Banner */}
            <div style={{
              background: '#DBEAFE',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 16,
              fontSize: 13,
              color: '#1E40AF',
              lineHeight: 1.5
            }}>
              อัตตาสถานะการจัดส่งของคุณได้ที่นี่ หากมีข้อสงสัยกรุณาติดต่อเจ้าหน้าที่
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 16
            }}>
              <div>
                <div style={{
                  fontSize: 13,
                  color: '#64748B',
                  marginBottom: 6
                }}>
                  ขนส่ง
                </div>
                <div style={{
                  padding: '10px 14px',
                  background: '#F8FAFC',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  fontSize: 14,
                  color: '#0F172A'
                }}>
                  {order.shippingCarrier || '-'}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: 13,
                  color: '#64748B',
                  marginBottom: 6
                }}>
                  เลขติดตาม
                </div>
                <div style={{
                  padding: '10px 14px',
                  background: '#F8FAFC',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  fontSize: 14,
                  color: '#0F172A',
                  fontFamily: 'monospace'
                }}>
                  {order.trackingNumber || '-'}
                </div>
              </div>
            </div>

            <div>
              <div style={{
                fontSize: 13,
                color: '#64748B',
                marginBottom: 6
              }}>
                สถานะปัจจุบัน
              </div>
              <div style={{
                padding: '12px 16px',
                background: '#FEF3C7',
                borderRadius: 10,
                border: '1px solid #FDE68A',
                fontSize: 15,
                fontWeight: 600,
                color: '#92400E',
                textAlign: 'center'
              }}>
                {order.shippingStatus || 'รอดำเนินการ'}
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <button
              onClick={() => navigate('/staff/orders')}
              style={{
                padding: '14px 40px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Kanit, sans-serif',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              ← กลับไปหน้าคำสั่งซื้อทั้งหมด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
