import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, removeFromCart, clearCart, createWithdrawal } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';

export default function WithdrawPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Pagination for cart items
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form data
  const [formData, setFormData] = useState({
    requesterName: '',
    requesterDepartment: '',
    recipientName: '',
    recipientPhone: '',
    recipientAddress: '',
    withdrawDate: new Date().toISOString().split('T')[0],
    notes: '',
    deliveryMethod: 'pickup', // pickup = รับเอง, shipping = จัดส่ง
  });

  useEffect(() => {
    const loadCart = async () => {
      if (!user) return;
      try {
        const cartData = await getCart(user.uid, 'staff');
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
        requesterName: profile.displayName || profile.email || '',
        recipientAddress: profile.address || '',
      }));
    }
  }, [profile]);

  const handleQuantityChange = async (item, newQty) => {
    if (newQty < 1) return;
    try {
      await updateCartItem(user.uid, item.productId, newQty, item.variantSize, item.variantColor, 'staff');
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
    if (!window.confirm('ต้องการลบสินค้านี้ออกจากตะกร้า?')) return;
    try {
      await removeFromCart(user.uid, item.productId, item.variantSize, item.variantColor, 'staff');
      setCart(prev => prev.filter(c => !(c.productId === item.productId && c.variantSize === item.variantSize && c.variantColor === item.variantColor)));
    } catch (error) {
      console.error('Error removing item:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('ต้องการล้างตะกร้าทั้งหมด?')) return;
    try {
      await clearCart(user.uid, 'staff');
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('ไม่มีสินค้าในตะกร้า');
      return;
    }
    if (!formData.requesterName || !formData.recipientName) {
      alert('กรุณากรอกข้อมูลผู้เบิกและผู้รับให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        createdByUid: user.uid,
        createdByEmail: user.email,
        createdSource: 'staff',
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          price: item.sellPrice,
          quantity: item.quantity,
          subtotal: item.sellPrice * item.quantity,
          variantSize: item.variantSize || null,
          variantColor: item.variantColor || null,
        })),
        requestedBy: formData.requesterName,
        requestedAddress: formData.recipientAddress,
        receivedBy: formData.recipientName,
        receivedAddress: formData.recipientAddress,
        withdrawDate: formData.withdrawDate,
        note: formData.notes,
        total: cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0),
        deliveryMethod: formData.deliveryMethod,
      };

      await createWithdrawal(orderData);
      await clearCart(user.uid, 'staff');
      window.dispatchEvent(new Event('staff-cart-updated'));
      navigate('/staff');
    } catch (error) {
      console.error('Error creating withdrawal:', error);
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
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #22d3ee 100%)', 
          padding: '24px 32px', 
          borderRadius: 16, 
          marginBottom: 20, 
          boxShadow: '0 10px 40px rgba(30,64,175,0.3)'
        }}>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 26, fontWeight: 700 }}>{t('withdraw.withdraw_request')}</h1>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>{t('withdraw.withdraw_cart')}</div>
        </div>

        {/* Action Bar */}
        <div style={{ background: '#fff', padding: '16px 24px', borderRadius: 12, marginBottom: 20, boxShadow: '0 4px 16px rgba(15,23,42,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, color: '#374151' }}>
            <span style={{ fontWeight: 600 }}>{cart.length}</span> {t('common.items')}
          </div>
          {cart.length > 0 && (
            <button onClick={handleClearCart} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{t('cart.clear_cart')}</button>
          )}
        </div>

        {cart.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 18, padding: 50, textAlign: 'center', boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🛒</div>
            <p style={{ color: '#64748b', fontSize: 16 }}>{t('cart.cart_empty')}</p>
            <button onClick={() => navigate('/staff')} style={{ marginTop: 16, padding: '12px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{t('cart.go_shopping')}</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20 }}>
            {/* Cart Items */}
            <div style={{ background: '#fff', borderRadius: 18, padding: 24, boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: '#111827' }}>{t('order.order_items')}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {cart.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, idx) => (
                  <div key={`${item.productId}-${item.variantSize}-${item.variantColor}-${idx}`} style={{ display: 'flex', gap: 16, padding: 16, background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe' }}>
                    {/* Image */}
                    <div style={{ width: 80, height: 80, borderRadius: 10, background: '#dbeafe', overflow: 'hidden', flexShrink: 0 }}>
                      {item.image ? <img src={item.image} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontSize: 24 }}>📦</div>}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: 15, marginBottom: 4 }}>{item.productName}</div>
                      {/* Variant Info */}
                      {(item.variantSize || item.variantColor) && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                          {item.variantSize && <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{t('product.size')}: {item.variantSize}</span>}
                          {item.variantColor && <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{t('product.color')}: {item.variantColor}</span>}
                        </div>
                      )}
                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{t('common.unit')}: {item.unit || t('common.piece')}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => handleQuantityChange(item, item.quantity - 1)} disabled={item.quantity <= 1} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #bfdbfe', background: '#fff', cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer', fontSize: 14 }}>-</button>
                        <span style={{ fontWeight: 600, minWidth: 30, textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => handleQuantityChange(item, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #bfdbfe', background: '#fff', cursor: 'pointer', fontSize: 14 }}>+</button>
                      </div>
                    </div>
                    {/* Price & Remove */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <button onClick={() => handleRemoveItem(item)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18 }}>×</button>
                      <div style={{ fontWeight: 700, color: '#16a34a', fontSize: 16 }}>฿{(item.sellPrice * item.quantity).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {cart.length > itemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                    disabled={currentPage === 1}
                    style={{ 
                      padding: '8px 16px', 
                      borderRadius: 8, 
                      border: '1px solid #e2e8f0', 
                      background: currentPage === 1 ? '#f1f5f9' : '#fff', 
                      color: currentPage === 1 ? '#94a3b8' : '#374151', 
                      fontSize: 14, 
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer' 
                    }}
                  >
                    {t('common.previous')}
                  </button>
                  {Array.from({ length: Math.ceil(cart.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: currentPage === page ? 'none' : '1px solid #e2e8f0',
                        background: currentPage === page ? '#1e40af' : '#fff',
                        color: currentPage === page ? '#fff' : '#374151',
                        fontSize: 14,
                        fontWeight: currentPage === page ? 600 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      {page}
                    </button>
                  ))}
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(cart.length / itemsPerPage), prev + 1))} 
                    disabled={currentPage === Math.ceil(cart.length / itemsPerPage)}
                    style={{ 
                      padding: '8px 16px', 
                      borderRadius: 8, 
                      border: '1px solid #e2e8f0', 
                      background: currentPage === Math.ceil(cart.length / itemsPerPage) ? '#f1f5f9' : '#fff', 
                      color: currentPage === Math.ceil(cart.length / itemsPerPage) ? '#94a3b8' : '#374151', 
                      fontSize: 14, 
                      cursor: currentPage === Math.ceil(cart.length / itemsPerPage) ? 'not-allowed' : 'pointer' 
                    }}
                  >
                    {t('common.next')}
                  </button>
                </div>
              )}
            </div>

            {/* Withdraw Form */}
            <div style={{ background: '#fff', borderRadius: 18, padding: 24, boxShadow: '0 8px 32px rgba(15,23,42,0.12)', height: 'fit-content' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: '#111827' }}>{t('withdraw.withdraw_request')}</h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>{t('withdraw.requested_by')} *</label>
                  <input type="text" value={formData.requesterName} onChange={(e) => setFormData(prev => ({ ...prev, requesterName: e.target.value }))} required style={{ width: '100%', padding: '12px', fontSize: 14, border: '1px solid #e2e8f0', borderRadius: 8, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>{t('order.recipient_name')} *</label>
                  <input type="text" value={formData.recipientName} onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))} required style={{ width: '100%', padding: '12px', fontSize: 14, border: '1px solid #e2e8f0', borderRadius: 8, boxSizing: 'border-box' }} />
                </div>
                
                {/* วิธีการรับสินค้า */}
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#374151' }}>{t('order.delivery_method')} *</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <label 
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 10, 
                        padding: '14px 16px', 
                        borderRadius: 10, 
                        border: formData.deliveryMethod === 'pickup' ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                        background: formData.deliveryMethod === 'pickup' ? '#eff6ff' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input 
                        type="radio" 
                        name="deliveryMethod" 
                        value="pickup" 
                        checked={formData.deliveryMethod === 'pickup'} 
                        onChange={(e) => setFormData(prev => ({ ...prev, deliveryMethod: e.target.value }))}
                        style={{ display: 'none' }}
                      />
                      <span style={{ fontSize: 20 }}>🏪</span>
                      <div>
                        <div style={{ fontWeight: 600, color: formData.deliveryMethod === 'pickup' ? '#1e40af' : '#374151', fontSize: 14 }}>{t('order.pickup')}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{t('order.pickup')}</div>
                      </div>
                    </label>
                    <label 
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 10, 
                        padding: '14px 16px', 
                        borderRadius: 10, 
                        border: formData.deliveryMethod === 'shipping' ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                        background: formData.deliveryMethod === 'shipping' ? '#eff6ff' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input 
                        type="radio" 
                        name="deliveryMethod" 
                        value="shipping" 
                        checked={formData.deliveryMethod === 'shipping'} 
                        onChange={(e) => setFormData(prev => ({ ...prev, deliveryMethod: e.target.value }))}
                        style={{ display: 'none' }}
                      />
                      <span style={{ fontSize: 20 }}>📦</span>
                      <div>
                        <div style={{ fontWeight: 600, color: formData.deliveryMethod === 'shipping' ? '#1e40af' : '#374151', fontSize: 14 }}>{t('order.shipping')}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{t('order.shipping')}</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* ที่อยู่จัดส่ง - แสดงเฉพาะเมื่อเลือกจัดส่ง */}
                {formData.deliveryMethod === 'shipping' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>{t('order.shipping_address')} *</label>
                    <textarea value={formData.recipientAddress} onChange={(e) => setFormData(prev => ({ ...prev, recipientAddress: e.target.value }))} rows={2} required style={{ width: '100%', padding: '12px', fontSize: 14, border: '1px solid #e2e8f0', borderRadius: 8, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>{t('withdraw.withdraw_date')} *</label>
                  <input type="date" value={formData.withdrawDate} onChange={(e) => setFormData(prev => ({ ...prev, withdrawDate: e.target.value }))} required style={{ width: '100%', padding: '12px', fontSize: 14, border: '1px solid #e2e8f0', borderRadius: 8, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>{t('order.order_note')}</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={2} style={{ width: '100%', padding: '12px', fontSize: 14, border: '1px solid #e2e8f0', borderRadius: 8, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
                </div>

                {/* Summary */}
                <div style={{ background: '#eff6ff', padding: 16, borderRadius: 10, border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#374151' }}>{t('common.items')}:</span>
                    <span style={{ fontWeight: 600 }}>{cart.length} {t('common.items')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#374151' }}>{t('common.total')}:</span>
                    <span style={{ fontWeight: 700, fontSize: 20, color: '#16a34a' }}>฿{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <button type="submit" disabled={submitting} style={{ padding: '14px', borderRadius: 10, border: 'none', background: submitting ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: submitting ? 'none' : '0 6px 20px rgba(37,99,235,0.4)' }}>
                  {submitting ? t('message.processing') : t('withdraw.confirm_withdraw')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
