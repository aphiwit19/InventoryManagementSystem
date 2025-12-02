import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { createWithdrawal, getCart, clearCart, migrateLocalStorageCart } from '../../services';

export default function CustomerPaymentPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [items, setItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestedBy, setRequestedBy] = useState('');
  const [phone, setPhone] = useState('');
  const [requestedAddress, setRequestedAddress] = useState('');
  const [withdrawDate] = useState(new Date().toISOString().slice(0, 10));
  const total = useMemo(
    () => items.reduce((s, it) => s + (it.price * (it.quantity || 0)), 0),
    [items]
  );

  // Load cart items
  useEffect(() => {
    const loadCart = async () => {
      if (!user?.uid) {
        setLoadingCart(false);
        return;
      }
      setLoadingCart(true);
      try {
        const legacyKey = 'customerCart';
        const perUserKey = `customerCart_${user.uid}`;
        await migrateLocalStorageCart(user.uid, legacyKey, 'customer');
        await migrateLocalStorageCart(user.uid, perUserKey, 'customer');

        const cartItems = await getCart(user.uid, 'customer');
        setItems(cartItems);
      } catch (error) {
        console.error('Error loading cart for payment:', error);
        setItems([]);
      } finally {
        setLoadingCart(false);
      }
    };
    loadCart();
  }, [user?.uid]);

  // Load user info for shipping form
  useEffect(() => {
    const loadUser = async () => {
      if (!user?.uid) {
        setLoadingUser(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.displayName) {
            setRequestedBy(data.displayName);
          } else if (profile?.displayName) {
            setRequestedBy(profile.displayName);
          } else if (user.email) {
            setRequestedBy(user.email);
          }
          if (data.phone) {
            setPhone(data.phone);
          }
          if (data.address) {
            setRequestedAddress(data.address);
          }
        } else {
          if (profile?.displayName) {
            setRequestedBy(profile.displayName);
          } else if (user.email) {
            setRequestedBy(user.email);
          }
        }
      } catch (err) {
        console.error('Error loading user for payment:', err);
        if (profile?.displayName) {
          setRequestedBy(profile.displayName);
        } else if (user?.email) {
          setRequestedBy(user.email);
        }
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, [user?.uid, profile]);

  const handleConfirm = async () => {
    if (!user?.uid) {
      alert('กรุณาเข้าสู่ระบบก่อนทำรายการ');
      return;
    }
    if (items.length === 0) {
      alert('ยังไม่มีสินค้าในตะกร้า');
      return;
    }
    if (!requestedBy.trim() || !requestedAddress.trim()) {
      alert('กรุณากรอกชื่อและที่อยู่ให้ครบ');
      return;
    }

    setSaving(true);
    try {
      await createWithdrawal({
        items: items.map(it => ({
          productId: it.id,
          productName: it.productName,
          price: it.price,
          quantity: it.quantity,
          subtotal: it.price * it.quantity
        })),
        requestedBy: requestedBy.trim(),
        requestedAddress: requestedAddress.trim(),
        phone: phone.trim() || null,
        withdrawDate,
        total,
        createdByUid: user.uid,
        createdByEmail: user.email || null,
        createdSource: 'customer'
      });

      await clearCart(user.uid, 'customer');
      setItems([]);
      navigate('/customer/payment/success');
    } catch (e) {
      console.error('Error confirming order:', e);
      alert('ไม่สามารถยืนยันคำสั่งซื้อได้: ' + (e?.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const isLoading = loadingCart || loadingUser;

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
          <span style={{ color: '#4CAF50' }}>1 ตะกร้า</span>
          <span style={{ color: '#2e7d32', borderBottom: '2px solid #2e7d32', paddingBottom: 4 }}>
            2 ชำระเงิน
          </span>
          <span style={{ color: '#9e9e9e' }}>3 เสร็จสิ้น</span>
        </div>
        <div
          style={{
            marginTop: 10,
            height: 4,
            borderRadius: 999,
            background: 'linear-gradient(90deg,#4CAF50 0%,#4CAF50 50%,#e0e0e0 50%)'
          }}
        />
      </div>

      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 24,
          padding: '30px 32px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
        }}
      >
        <h2 style={{ textAlign: 'center', margin: '0 0 24px', fontSize: 24 }}>ชำระเงิน</h2>

        {isLoading ? (
          <p style={{ textAlign: 'center', color: '#777', padding: 40 }}>กำลังโหลดข้อมูล...</p>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#777', marginBottom: 16 }}>ยังไม่มีสินค้าในตะกร้า</p>
            <Link
              to="/customer"
              style={{
                padding: '10px 20px',
                background: '#4A90E2',
                color: '#fff',
                borderRadius: 999,
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              ไปเลือกซื้อสินค้า
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              gap: 24,
              alignItems: 'flex-start'
            }}
          >
            {/* Shipping form */}
            <div
              style={{
                background: '#f9fafb',
                borderRadius: 20,
                padding: 20,
                border: '1px solid #e5e7eb'
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>ที่อยู่จัดส่ง</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 6,
                      color: '#374151'
                    }}
                  >
                    ชื่อ - นามสกุล *
                  </div>
                  <input
                    type="text"
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 999,
                      border: '1px solid #d1d5db',
                      outline: 'none',
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
                    เบอร์โทร *
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 0812345678"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 999,
                      border: '1px solid #d1d5db',
                      outline: 'none',
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
                    ที่อยู่ *
                  </div>
                  <textarea
                    value={requestedAddress}
                    onChange={(e) => setRequestedAddress(e.target.value)}
                    placeholder="บ้านเลขที่ / หมู่บ้าน / ถนน / เขต / จังหวัด / รหัสไปรษณีย์"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 16,
                      border: '1px solid #d1d5db',
                      outline: 'none',
                      resize: 'vertical',
                      fontSize: 14,
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div
              style={{
                background: '#f9fafb',
                borderRadius: 20,
                padding: 20,
                border: '1px solid #e5e7eb'
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>สรุปรายการ</h3>
              <div style={{ marginBottom: 12, fontSize: 14, color: '#4b5563' }}>
                {items.map((it) => (
                  <div
                    key={it.id}
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}
                  >
                    <span>
                      {it.productName} x {it.quantity}
                    </span>
                    <span>฿{(it.price * it.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <hr style={{ border: 0, borderTop: '1px solid #e5e7eb', margin: '10px 0' }} />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                  fontSize: 14
                }}
              >
                <span>ค่าสินค้า</span>
                <span>฿{total.toLocaleString()}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  fontSize: 14
                }}
              >
                <span>ค่าจัดส่ง</span>
                <span>คำนวณตอนจัดส่ง</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16
                }}
              >
                <span style={{ fontWeight: 600 }}>ยอดรวม</span>
                <span style={{ fontWeight: 700, fontSize: 20 }}>
                  ฿{total.toLocaleString()}
                </span>
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 999,
                  border: 'none',
                  background: saving ? '#9ca3af' : 'linear-gradient(90deg,#2563EB,#1D4ED8)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 10px rgba(37,99,235,0.35)'
                }}
              >
                {saving ? 'กำลังยืนยัน...' : 'ยืนยันคำสั่งซื้อ'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
