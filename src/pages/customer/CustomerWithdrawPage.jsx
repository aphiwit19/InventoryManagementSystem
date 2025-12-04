import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, removeFromCart, clearCart, createWithdrawal } from '../../services';
import { useAuth } from '../../auth/AuthContext';

export default function CustomerWithdrawPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientPhone: '',
    recipientAddress: '',
    notes: '',
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
      }));
    }
  }, [profile]);

  const handleQuantityChange = async (item, newQty) => {
    if (newQty < 1) return;
    try {
      await updateCartItem(user.uid, item.productId, newQty, item.variantSize, item.variantColor);
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
      await removeFromCart(user.uid, item.productId, item.variantSize, item.variantColor);
      setCart(prev => prev.filter(c => !(c.productId === item.productId && c.variantSize === item.variantSize && c.variantColor === item.variantColor)));
    } catch (error) {
      console.error('Error removing item:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('ต้องการล้างตะกร้าทั้งหมด?')) return;
    try {
      await clearCart(user.uid);
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
    if (!formData.recipientName || !formData.recipientPhone || !formData.recipientAddress) {
      alert('กรุณากรอกข้อมูลผู้รับให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          image: item.image,
          unit: item.unit,
          quantity: item.quantity,
          sellPrice: item.sellPrice,
          variantSize: item.variantSize || null,
          variantColor: item.variantColor || null,
        })),
        recipientName: formData.recipientName,
        recipientPhone: formData.recipientPhone,
        recipientAddress: formData.recipientAddress,
        notes: formData.notes,
        totalAmount: cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0),
        orderType: 'customer',
      };

      await createWithdrawal(orderData);
      await clearCart(user.uid);
      alert('สร้างคำสั่งซื้อสำเร็จ!');
      navigate('/customer');
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
        <p style={{ color: '#64748b', fontSize: 15 }}>กำลังโหลดตะกร้า...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', minHeight: '100vh', background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', padding: '20px 24px', borderRadius: 18, marginBottom: 20, boxShadow: '0 8px 32px rgba(15,23,42,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, color: '#1e40af', fontSize: 24, fontWeight: 700 }}>🛒 ตะกร้าสินค้า</h1>
            <div style={{ fontSize: 14, color: '#3b82f6', marginTop: 6 }}>{cart.length} รายการ</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => navigate('/customer')} style={{ padding: '10px 20px', borderRadius: 10, border: '2px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← กลับ</button>
            {cart.length > 0 && (
              <button onClick={handleClearCart} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>ล้างตะกร้า</button>
            )}
          </div>
        </div>

        {cart.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 18, padding: 50, textAlign: 'center', boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🛒</div>
            <p style={{ color: '#64748b', fontSize: 16 }}>ตะกร้าว่างเปล่า</p>
            <button onClick={() => navigate('/customer')} style={{ marginTop: 16, padding: '12px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>เลือกสินค้า</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
            {/* Cart Items */}
            <div style={{ background: '#fff', borderRadius: 18, padding: 24, boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: '#111827' }}>รายการสินค้า</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {cart.map((item, idx) => (
                  <div key={`${item.productId}-${item.variantSize}-${item.variantColor}-${idx}`} style={{ display: 'flex', gap: 16, padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                    {/* Image */}
                    <div style={{ width: 80, height: 80, borderRadius: 10, background: '#e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                      {item.image ? <img src={item.image} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 24 }}>📦</div>}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: 15, marginBottom: 4 }}>{item.productName}</div>
                      {/* Variant Info */}
                      {(item.variantSize || item.variantColor) && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                          {item.variantSize && <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>ไซส์: {item.variantSize}</span>}
                          {item.variantColor && <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>สี: {item.variantColor}</span>}
                        </div>
                      )}
                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>หน่วย: {item.unit || 'ชิ้น'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => handleQuantityChange(item, item.quantity - 1)} disabled={item.quantity <= 1} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer', fontSize: 14 }}>-</button>
                        <span style={{ fontWeight: 600, minWidth: 30, textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => handleQuantityChange(item, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 14 }}>+</button>
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
            </div>

            {/* Order Form */}
            <div style={{ background: '#fff', borderRadius: 18, padding: 24, boxShadow: '0 8px 32px rgba(15,23,42,0.12)', height: 'fit-content' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: '#111827' }}>ข้อมูลการจัดส่ง</h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>ชื่อผู้รับ *</label>
                  <input type="text" value={formData.recipientName} onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))} required style={{ width: '100%', padding: '12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>เบอร์โทร *</label>
                  <input type="tel" value={formData.recipientPhone} onChange={(e) => setFormData(prev => ({ ...prev, recipientPhone: e.target.value }))} required style={{ width: '100%', padding: '12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>ที่อยู่จัดส่ง *</label>
                  <textarea value={formData.recipientAddress} onChange={(e) => setFormData(prev => ({ ...prev, recipientAddress: e.target.value }))} required rows={3} style={{ width: '100%', padding: '12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>หมายเหตุ</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={2} style={{ width: '100%', padding: '12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
                </div>

                {/* Summary */}
                <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 10, border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#374151' }}>จำนวนรายการ:</span>
                    <span style={{ fontWeight: 600 }}>{cart.length} รายการ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#374151' }}>ยอดรวม:</span>
                    <span style={{ fontWeight: 700, fontSize: 20, color: '#16a34a' }}>฿{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <button type="submit" disabled={submitting} style={{ padding: '14px', borderRadius: 10, border: 'none', background: submitting ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: submitting ? 'none' : '0 6px 20px rgba(16,185,129,0.4)' }}>
                  {submitting ? 'กำลังสร้างคำสั่งซื้อ...' : 'ยืนยันคำสั่งซื้อ'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
