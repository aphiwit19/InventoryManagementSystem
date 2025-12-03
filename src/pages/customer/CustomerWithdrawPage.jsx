import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllProducts, getCart, updateCartItem, removeFromCart, migrateLocalStorageCart } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function CustomerWithdrawPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [productsById, setProductsById] = useState({});
  const [items, setItems] = useState([]);
  const [requestedBy, setRequestedBy] = useState('');
  const [requestedAddress, setRequestedAddress] = useState('');
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

  // Load user data from Firebase
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.uid) {
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          // Auto-fill form with user data
          if (data.displayName) {
            setRequestedBy(data.displayName);
          } else if (profile?.displayName) {
            setRequestedBy(profile.displayName);
          } else if (user?.email) {
            setRequestedBy(user.email);
          }
          
          if (data.address) {
            setRequestedAddress(data.address);
          }
        } else {
          // Fallback to profile data
          if (profile?.displayName) {
            setRequestedBy(profile.displayName);
          } else if (user?.email) {
            setRequestedBy(user.email);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to profile data
        if (profile?.displayName) {
          setRequestedBy(profile.displayName);
        } else if (user?.email) {
          setRequestedBy(user.email);
        }
      } finally {
        // no-op
      }
    };
    loadUserData();
  }, [user?.uid, user?.email, profile]);

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
        const legacyKey = 'customerCart';
        const perUserKey = `customerCart_${user.uid}`;
        await migrateLocalStorageCart(user.uid, legacyKey, 'customer');
        await migrateLocalStorageCart(user.uid, perUserKey, 'customer');
        
        // Load cart from Firebase
        const cartItems = await getCart(user.uid, 'customer');
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
    const stock = Math.max(0, qtyTotal - qtyReserved);
    const value = Math.max(1, Math.min(parseInt(qty || 1), stock));
    
    try {
      await updateCartItem(user.uid, id, value, stock, 'customer');
      setItems(prev => prev.map(it => it.id === id ? { ...it, quantity: value, stock } : it));
    } catch (error) {
      console.error('Error updating cart item:', error);
      alert('ไม่สามารถอัปเดตจำนวนสินค้าได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const removeItem = async (id) => {
    if (!user?.uid) return;
    try {
      await removeFromCart(user.uid, id, 'customer');
      setItems(prev => prev.filter(it => it.id !== id));
    } catch (error) {
      console.error('Error removing cart item:', error);
      alert('ไม่สามารถลบสินค้าได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const goToPayment = () => {
    if (!user?.uid) {
      alert('กรุณาเข้าสู่ระบบก่อน');
      return;
    }
    if (items.length === 0) {
      alert('ยังไม่มีสินค้าในตะกร้า');
      return;
    }
    navigate('/customer/payment');
  };

  return (
    <div style={{ padding: '30px', background: '#f0f4ff', minHeight: '100vh' }}>
      {/* Step indicator */}
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto 20px',
          background: '#fff',
          borderRadius: 16,
          padding: '16px 24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          <span style={{ color: '#2e7d32', borderBottom: '2px solid #2e7d32', paddingBottom: 4 }}>
            1 ตะกร้า
          </span>
          <span style={{ color: '#9e9e9e' }}>2 ชำระเงิน</span>
          <span style={{ color: '#9e9e9e' }}>3 เสร็จสิ้น</span>
        </div>
        <div
          style={{
            marginTop: 10,
            height: 4,
            borderRadius: 999,
            background: 'linear-gradient(90deg,#4CAF50 0%,#4CAF50 33%,#e0e0e0 33%)'
          }}
        />
      </div>

      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 24,
          padding: '24px 28px 28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>ตะกร้าสินค้า</h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1fr',
            gap: 20,
            alignItems: 'flex-start'
          }}
        >
          {/* Cart list */}
          <div
            style={{
              background: '#f9fafb',
              borderRadius: 20,
              padding: 18,
              border: '1px solid #e5e7eb',
              minHeight: 120
            }}
          >
            {cartLoading ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>กำลังโหลดตะกร้า...</p>
            ) : items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 10px' }}>
                <p style={{ color: '#999', marginBottom: 12 }}>ยังไม่มีรายการในตะกร้า</p>
                <Link
                  to="/customer"
                  style={{
                    padding: '8px 18px',
                    borderRadius: 999,
                    background: '#4A90E2',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 600
                  }}
                >
                  ไปเลือกสินค้า
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 120px 110px 110px',
                      gap: 10,
                      alignItems: 'center',
                      padding: '8px 4px',
                      borderBottom: '1px dashed #e5e7eb'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{it.productName}</div>
                      <div style={{ color: '#777', fontSize: 12 }}>
                        คงเหลือพร้อมขาย:{' '}
                        {Math.max(
                          0,
                          (productsById[it.id]?.quantity ?? 0) -
                            (productsById[it.id]?.reserved ?? 0)
                        )}{' '}
                        ชิ้น
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 14 }}>
                      ฿{it.price.toLocaleString()}
                    </div>
                    <div>
                      <input
                        type="number"
                        min={1}
                        max={Math.max(
                          0,
                          (productsById[it.id]?.quantity ?? 0) -
                            (productsById[it.id]?.reserved ?? 0)
                        )}
                        value={it.quantity}
                        onChange={(e) => updateQty(it.id, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          border: '1px solid #d1d5db',
                          borderRadius: 999,
                          fontSize: 13,
                          textAlign: 'center'
                        }}
                      />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          marginBottom: 4
                        }}
                      >
                        ฿{(it.price * it.quantity).toLocaleString()}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f44336',
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary & basic info */}
          <div
            style={{
              background: '#f9fafb',
              borderRadius: 20,
              padding: 18,
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>
              รายละเอียดผู้สั่งซื้อ
            </h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                maxWidth: 460,
                padding: '0 8px',
                margin: '0 auto'
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: '#374151'
                  }}
                >
                  ผู้สั่งซื้อ
                </div>
                <input
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 16,
                    fontSize: 14
                  }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: '#374151'
                  }}
                >
                  ที่อยู่ผู้สั่งซื้อ
                </div>
                <textarea
                  value={requestedAddress}
                  onChange={(e) => setRequestedAddress(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 16,
                    resize: 'vertical',
                    fontSize: 14,
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 8
                }}
              >
                <span style={{ color: '#666' }}>ราคารวม</span>
                <strong>฿{total.toLocaleString()}</strong>
              </div>
              <button
                disabled={items.length === 0}
                onClick={goToPayment}
                style={{
                  padding: '12px',
                  background:
                    items.length === 0
                      ? '#9ca3af'
                      : 'linear-gradient(90deg,#2563EB,#1D4ED8)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 999,
                  cursor: items.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  marginTop: 4,
                  boxShadow:
                    items.length === 0
                      ? 'none'
                      : '0 4px 10px rgba(37,99,235,0.35)'
                }}
              >
                ดำเนินการชำระเงิน
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
