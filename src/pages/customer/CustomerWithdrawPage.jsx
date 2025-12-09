import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, removeFromCart } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';

export default function CustomerWithdrawPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientAddress: '',
  });

  useEffect(() => {
    const loadCart = async () => {
      if (!user) return;
      try {
        const cartData = await getCart(user.uid);
        setCart(cartData || []);
      } catch (error) {
        console.error('Error loading cart:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCart();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        recipientName: profile.displayName || profile.email || '',
        recipientAddress: profile.address || prev.recipientAddress || '',
      }));
    }
  }, [profile]);

  const handleQuantityChange = async (item, newQty) => {
    if (newQty < 1) return;
    try {
      await updateCartItem(user.uid, item.productId, newQty, item.variantSize, item.variantColor);
      window.dispatchEvent(new Event('customer-cart-updated'));
      setCart(prev => prev.map(c => {
        if (c.productId === item.productId && c.variantSize === item.variantSize && c.variantColor === item.variantColor) {
          return { ...c, quantity: newQty };
        }
        return c;
      }));
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleRemoveItem = async (item) => {
    try {
      await removeFromCart(user.uid, item.productId, item.variantSize, item.variantColor);
      setCart(prev => prev.filter(c => !(c.productId === item.productId && c.variantSize === item.variantSize && c.variantColor === item.variantColor)));
      window.dispatchEvent(new Event('customer-cart-updated'));
    } catch (error) {
      console.error('Error removing item:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('ไม่มีสินค้าในตะกร้า');
      return;
    }
    if (!formData.recipientName || !formData.recipientAddress) {
      alert('กรุณากรอกข้อมูลผู้รับให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    try {
      // ส่งต่อข้อมูลฟอร์มไปยังหน้าชำระเงิน โดยยังไม่สร้างคำสั่งซื้อทันที
      navigate('/customer/payment', {
        state: {
          shipping: {
            recipientName: formData.recipientName,
            recipientAddress: formData.recipientAddress,
          },
        },
      });
    } catch (error) {
      console.error('Error creating order:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F1F5F9',
        }}
      >
        <p style={{ color: '#64748b', fontSize: 15 }}>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F1F5F9',
        padding: '24px 24px 32px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Page Header */}
        <section
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '24px 28px',
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
            border: '1px solid #E2E8F0',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: 'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
              fontSize: 24,
              fontWeight: 700,
              color: '#2563EB',
            }}
          >
            {t('cart.my_cart')}
          </h1>
        </section>

        {cart.length === 0 ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              padding: '48px 24px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 12 }}>🛒</div>
            <h2
              style={{
                margin: '0 0 8px',
                fontFamily: 'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
                fontSize: 22,
                fontWeight: 700,
                color: '#0F172A',
              }}
            >
              {t('cart.cart_empty')}
            </h2>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 20 }}>
              {t('cart.cart_empty_hint') || 'ยังไม่มีสินค้าในตะกร้า เลือกสินค้าที่ต้องการได้จากหน้า Dashboard'}
            </p>
            <button
              onClick={() => navigate('/customer')}
              style={{
                padding: '12px 26px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(30,64,175,0.5)',
              }}
            >
              {t('cart.go_shopping')}
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 360px',
              gap: 24,
              alignItems: 'flex-start',
            }}
          >
            {/* Left: Cart Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cart.map((item, idx) => (
                <div
                  key={`${item.productId}-${item.variantSize}-${item.variantColor}-${idx}`}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 16,
                    padding: '18px 18px',
                    display: 'flex',
                    gap: 18,
                    alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      width: 110,
                      height: 110,
                      borderRadius: 12,
                      background: '#F8FAFC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.productName}
                        style={{ maxWidth: '92%', maxHeight: '92%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span style={{ fontSize: 32, color: '#9CA3AF' }}>📦</span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        margin: '0 0 6px',
                        fontFamily: 'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#0F172A',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.productName}
                    </h3>
                    {(item.variantSize || item.variantColor) && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                        {item.variantSize && (
                          <span
                            style={{
                              background: 'rgba(37,99,235,0.08)',
                              color: '#1D4ED8',
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 500,
                            }}
                          >
                            {t('product.size')}: {item.variantSize}
                          </span>
                        )}
                        {item.variantColor && (
                          <span
                            style={{
                              background: 'rgba(59,130,246,0.06)',
                              color: '#1D4ED8',
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 500,
                            }}
                          >
                            {t('product.color')}: {item.variantColor}
                          </span>
                        )}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
                      {t('common.unit')}: {item.unit || t('common.piece')}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      {/* Quantity */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: '#F1F5F9',
                          borderRadius: 999,
                          padding: '4px 8px',
                        }}
                      >
                        <button
                          onClick={() => handleQuantityChange(item, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            border: 'none',
                            background: item.quantity <= 1 ? '#E5E7EB' : '#FFFFFF',
                            cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#0F172A',
                          }}
                        >
                          −
                        </button>
                        <span
                          style={{
                            minWidth: 32,
                            textAlign: 'center',
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#0F172A',
                          }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item, item.quantity + 1)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            border: 'none',
                            background: '#FFFFFF',
                            cursor: 'pointer',
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#0F172A',
                          }}
                        >
                          +
                        </button>
                      </div>

                      {/* Price + remove */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: 6,
                        }}
                      >
                        <button
                          onClick={() => handleRemoveItem(item)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            fontSize: 20,
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                        <div
                          style={{
                            fontFamily:
                              'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#111827',
                          }}
                        >
                          ฿{(item.sellPrice * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Summary + Shipping Form */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                padding: '22px 20px 24px',
                boxShadow: '0 2px 10px rgba(15,23,42,0.08)',
                border: '1px solid #E2E8F0',
                position: 'sticky',
                top: 96,
              }}
            >
              <h2
                style={{
                  margin: '0 0 16px',
                  fontFamily: 'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#0F172A',
                }}
              >
                {t('order.shipping_info')}
              </h2>

              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    {t('order.recipient_name')} *
                  </label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recipientName: e.target.value,
                      }))
                    }
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: 14,
                      border: '1px solid #E5E7EB',
                      borderRadius: 999,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    {t('order.shipping_address')} *
                  </label>
                  <textarea
                    value={formData.recipientAddress}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recipientAddress: e.target.value,
                      }))
                    }
                    required
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: 14,
                      border: '1px solid #E5E7EB',
                      borderRadius: 14,
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Summary */}
                <div
                  style={{
                    marginTop: 6,
                    padding: '12px 12px 14px',
                    borderRadius: 12,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      fontSize: 14,
                      borderBottom: '1px solid #E5E7EB',
                    }}
                  >
                    <span style={{ color: '#64748B' }}>{t('common.items')}:</span>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>
                      {cart.length} {t('common.items')}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0 2px',
                      fontSize: 15,
                    }}
                  >
                    <span
                      style={{
                        fontFamily:
                          'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
                        fontWeight: 700,
                        color: '#0F172A',
                      }}
                    >
                      {t('common.total')}:
                    </span>
                    <span
                      style={{
                        fontFamily:
                          'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
                        fontSize: 20,
                        fontWeight: 800,
                        color: '#2563EB',
                      }}
                    >
                      ฿{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    marginTop: 10,
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: 'none',
                    background: submitting
                      ? '#9CA3AF'
                      : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: submitting
                      ? 'none'
                      : '0 8px 22px rgba(30,64,175,0.55)',
                  }}
                >
                  {submitting
                    ? t('message.processing')
                    : t('order.confirm_order')}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/customer')}
                  style={{
                    marginTop: 8,
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: '2px solid #2563EB',
                    background: '#FFFFFF',
                    color: '#2563EB',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ← {t('cart.go_shopping')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
