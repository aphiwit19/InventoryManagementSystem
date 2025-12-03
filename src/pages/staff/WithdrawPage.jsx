import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createWithdrawal, getAllProducts, getCart, updateCartItem, removeFromCart, clearCart, migrateLocalStorageCart } from '../../services';
import { useAuth } from '../../auth/AuthContext';

export default function WithdrawPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [productsById, setProductsById] = useState({});
  const [items, setItems] = useState([]);
  const [requestedBy, setRequestedBy] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [receivedAddress, setReceivedAddress] = useState('');
  const [note, setNote] = useState('');
  const [withdrawDate, setWithdrawDate] = useState(new Date().toISOString().slice(0,10));
  const [deliveryMethod, setDeliveryMethod] = useState('shipping');
  const [submitting, setSubmitting] = useState(false);
  const [cartLoading, setCartLoading] = useState(true);

  const total = useMemo(() => items.reduce((s, it) => s + (it.price * (it.quantity || 0)), 0), [items]);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await getAllProducts();
        const map = {};
        list.forEach(p => { map[p.id] = p; });
        setProductsById(map);
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };
    load();
  }, []);

  // Load cart from Firebase and migrate localStorage if needed
  useEffect(() => {
    const loadCart = async () => {
      if (!user?.uid) {
        setCartLoading(false);
        return;
      }
      
      setCartLoading(true);
      try {
        // Try to migrate localStorage cart first (one-time)
        const legacyKey = 'staffCart';
        const perUserKey = `staffCart_${user.uid}`;
        await migrateLocalStorageCart(user.uid, legacyKey, 'staff');
        await migrateLocalStorageCart(user.uid, perUserKey, 'staff');
        
        // Load cart from Firebase
        const cartItems = await getCart(user.uid, 'staff');
        setItems(cartItems);
      } catch (error) {
        console.error('Error loading cart:', error);
        setItems([]);
      } finally {
        setCartLoading(false);
      }
    };
    loadCart();
  }, [user?.uid]);

  const updateQty = async (id, qty) => {
    if (!user?.uid) return;
    const qtyTotal = productsById[id]?.quantity ?? 0;
    const qtyReserved = productsById[id]?.reserved ?? 0;
    const qtyStaffReserved = productsById[id]?.staffReserved ?? 0;
    const stock = Math.max(0, qtyTotal - qtyReserved - qtyStaffReserved);
    
    const value = Math.max(1, Math.min(parseInt(qty || 1), stock));
    
    try {
      await updateCartItem(user.uid, id, value, stock, 'staff');
      setItems(prev => prev.map(it => it.id === id ? { ...it, quantity: value, stock } : it));
    } catch (error) {
      console.error('Error updating cart item:', error);
      alert('ไม่สามารถอัปเดตจำนวนสินค้าได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const removeItem = async (id) => {
    if (!user?.uid) return;
    try {
      await removeFromCart(user.uid, id, 'staff');
      setItems(prev => prev.filter(it => it.id !== id));
    } catch (error) {
      console.error('Error removing cart item:', error);
      alert('ไม่สามารถลบสินค้าได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const submit = async () => {
    if (items.length === 0) return;
    const needAddress = deliveryMethod === 'shipping';
    if (!requestedBy.trim() || !receivedBy.trim() || (needAddress && !receivedAddress.trim()) || !withdrawDate) {
      return;
    }
    if (!user?.uid) {
      alert('กรุณาเข้าสู่ระบบก่อน');
      return;
    }
    
    setSubmitting(true);
    try {
      await createWithdrawal({
        items: items.map(it => ({ productId: it.id, productName: it.productName, price: it.price, quantity: it.quantity, subtotal: it.price * it.quantity })),
        requestedBy: requestedBy.trim(),
        receivedBy: receivedBy.trim(),
        receivedAddress: receivedAddress.trim(),
        note: note.trim(),
        withdrawDate,
        total,
        createdByUid: user.uid,
        createdByEmail: user.email || null,
        createdSource: 'staff',
        deliveryMethod,
      });
      
      // Clear cart after successful order
      await clearCart(user.uid, 'staff');
      setItems([]);
      
      navigate('/staff/orders');
    } catch (e) {
      console.error('Error creating withdrawal:', e);
      alert('ไม่สามารถบันทึกคำสั่งเบิกได้: ' + (e?.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        padding: '24px',
        minHeight: '100%',
        background:
          'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: 1120, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#1f2937',
            }}
          >
            คำสั่งเบิกสินค้า
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.2fr',
            gap: 20,
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 18,
              boxShadow: '0 10px 30px rgba(15,23,42,0.18)',
              padding: 18,
              boxSizing: 'border-box',
            }}
          >
            {cartLoading ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>กำลังโหลดตะกร้า...</p>
            ) : items.length === 0 ? (
              <p style={{ color: '#999' }}>ยังไม่มีรายการในคำสั่งเบิก</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map(it => (
                  <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 80px', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{it.productName}</div>
                      <div style={{ color: '#777', fontSize: 12 }}>คงเหลือพร้อมขาย: {Math.max(0, (productsById[it.id]?.quantity ?? 0) - (productsById[it.id]?.reserved ?? 0) - (productsById[it.id]?.staffReserved ?? 0))} ชิ้น</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>฿{(it.price).toLocaleString()}</div>
                    <div>
                      <input type="number" min={1} max={Math.max(0, (productsById[it.id]?.quantity ?? 0) - (productsById[it.id]?.reserved ?? 0) - (productsById[it.id]?.staffReserved ?? 0))} value={it.quantity} onChange={(e)=>updateQty(it.id, e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }} />
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 600 }}>฿{(it.price * it.quantity).toLocaleString()}</div>
                    <button onClick={()=>removeItem(it.id)} style={{ gridColumn: '1 / -1', justifySelf: 'end', background: 'transparent', border: 'none', color: '#f44336', cursor: 'pointer' }}>ลบ</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: 22,
              boxShadow: '0 14px 32px rgba(15,23,42,0.22)',
              padding: 24,
              boxSizing: 'border-box',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 14 }}>รายละเอียดผู้เบิก</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>วิธีรับสินค้า</div>
                <select
                  value={deliveryMethod}
                  onChange={(e)=>setDeliveryMethod(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box' }}
                >
                  <option value="shipping">จัดส่ง</option>
                  <option value="pickup">รับเอง</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>ผู้เบิก</div>
                <input
                  value={requestedBy}
                  onChange={(e)=>setRequestedBy(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>ผู้รับ</div>
                <input
                  value={receivedBy}
                  onChange={(e)=>setReceivedBy(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>ที่อยู่รับของ {deliveryMethod==='pickup' ? '(ไม่บังคับเมื่อรับเอง)' : ''}</div>
                <textarea
                  value={receivedAddress}
                  onChange={(e)=>setReceivedAddress(e.target.value)}
                  rows={3}
                  disabled={deliveryMethod==='pickup'}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, resize:'vertical', background: deliveryMethod==='pickup' ? '#f5f5f5' : '#fff', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>หมายเหตุ (ถ้ามี)</div>
                <textarea
                  value={note}
                  onChange={(e)=>setNote(e.target.value)}
                  rows={2}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, resize:'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>วันที่เบิก</div>
                <input
                  type="date"
                  value={withdrawDate}
                  onChange={(e)=>setWithdrawDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ color: '#666' }}>ราคารวม</span>
                <strong>฿{total.toLocaleString()}</strong>
              </div>
              <button
                disabled={submitting || items.length===0}
                onClick={submit}
                style={{
                  width: '100%',
                  padding: '12px',
                  background:
                    submitting || items.length===0
                      ? '#9ca3af'
                      : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                  color: '#eff6ff',
                  border: 'none',
                  borderRadius: 999,
                  cursor: submitting || items.length===0 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  boxSizing: 'border-box',
                  marginTop: 4,
                  boxShadow:
                    submitting || items.length===0
                      ? 'none'
                      : '0 10px 20px rgba(37,99,235,0.45)',
                  letterSpacing: '0.03em',
                }}
              >
                {submitting ? 'กำลังบันทึก...' : 'บันทึกคำสั่งเบิก'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}