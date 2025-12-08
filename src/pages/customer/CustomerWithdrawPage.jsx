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
      <div style={{ padding: '32px 24px', minHeight: '100vh', background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#64748b', fontSize: 15 }}>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', minHeight: '100vh', background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Step indicator */}
        <div
          style={{
            marginBottom: 20,
            background: '#fff',
            borderRadius: 16,
            padding: '14px 22px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <span style={{ color: '#2e7d32', borderBottom: '2px solid #2e7d32', paddingBottom: 2 }}>1 {t('payment.step_cart')}</span>
            <span style={{ color: '#9e9e9e' }}>2 {t('payment.step_payment')}</span>
            <span style={{ color: '#9e9e9e' }}>3 {t('payment.step_complete')}</span>
          </div>
          <div
            style={{
              marginTop: 10,
              height: 4,
              borderRadius: 999,
              background: 'linear-gradient(90deg,#4CAF50 0%,#4CAF50 33%,#e0e0e0 33%)',
            }}
          />
        </div>

        {cart.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 18, padding: 50, textAlign: 'center', boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🛒</div>
            <p style={{ color: '#64748b', fontSize: 16 }}>{t('cart.cart_empty')}</p>
            <button onClick={() => navigate('/customer')} style={{ marginTop: 16, padding: '12px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{t('cart.go_shopping')}</button>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 24, padding: '28px 30px 32px', boxShadow: '0 14px 40px rgba(15,23,42,0.16)' }}>
            {/* Title */}
            <h2 style={{ margin: '0 0 24px', textAlign: 'center', fontSize: 24, fontWeight: 700, color: '#111827' }}>
              {t('cart.my_cart')}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24, alignItems: 'flex-start' }}>
              {/* Left: Cart items - รายการสินค้า */}
              <div style={{ borderRadius: 20, border: '1px solid #e5e7eb', padding: 20, background: '#f9fafb' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#111827' }}>{t('order.order_items')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {cart.map((item, idx) => (
                    <div
                      key={`${item.productId}-${item.variantSize}-${item.variantColor}-${idx}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: 14,
                        borderRadius: 16,
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
                        gap: 14,
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 14,
                          overflow: 'hidden',
                          background: '#f3f4f6',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ fontSize: 28, color: '#9ca3af' }}>📦</span>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: '#111827',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginBottom: 2,
                          }}
                        >
                          {item.productName}
                        </div>
                        {(item.variantSize || item.variantColor) && (
                          <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                            {item.variantSize && (
                              <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>
                                {t('product.size')}: {item.variantSize}
                              </span>
                            )}
                            {item.variantColor && (
                              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>
                                {t('product.color')}: {item.variantColor}
                              </span>
                            )}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{t('common.unit')}: {item.unit || t('common.piece')}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 999,
                              border: '1px solid #d1d5db',
                              background: '#fff',
                              cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                              fontSize: 14,
                            }}
                          >
                            -
                          </button>
                          <span style={{ fontSize: 14, fontWeight: 600, minWidth: 26, textAlign: 'center' }}>{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 999,
                              border: '1px solid #d1d5db',
                              background: '#fff',
                              cursor: 'pointer',
                              fontSize: 14,
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Price + remove */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <button
                          onClick={() => handleRemoveItem(item)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: 18,
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>฿{(item.sellPrice * item.quantity).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Shipping form + summary */}
              <div style={{ borderRadius: 20, border: '1px solid #e5e7eb', padding: 20, background: '#f9fafb' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#111827' }}>{t('order.shipping_info')}</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>{t('order.recipient_name')} *</label>
                    <input type="text" value={formData.recipientName} onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))} required style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 999, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>{t('order.shipping_address')} *</label>
                    <textarea value={formData.recipientAddress} onChange={(e) => setFormData(prev => ({ ...prev, recipientAddress: e.target.value }))} required rows={3} style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 16, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
                  </div>

                  {/* Summary */}
                  <div style={{ background: '#ecfdf3', padding: 16, borderRadius: 12, border: '1px solid #bbf7d0', marginTop: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                      <span style={{ color: '#166534' }}>{t('common.items')}:</span>
                      <span style={{ fontWeight: 600, color: '#166534' }}>{cart.length} {t('common.items')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: '#166534' }}>{t('common.total')}:</span>
                      <span style={{ fontWeight: 700, fontSize: 18, color: '#16a34a' }}>฿{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <button type="submit" disabled={submitting} style={{ marginTop: 6, padding: '12px 16px', borderRadius: 999, border: 'none', background: submitting ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: submitting ? 'none' : '0 10px 26px rgba(37,99,235,0.55)' }}>
                    {submitting ? t('message.processing') : t('order.confirm_order')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
