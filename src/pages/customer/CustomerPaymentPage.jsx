import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { createWithdrawal, getCart, clearCart, migrateLocalStorageCart } from '../../services';

export default function CustomerPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();

  const [items, setItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestedBy, setRequestedBy] = useState('');
  const [phone, setPhone] = useState('');
  const [requestedAddress, setRequestedAddress] = useState('');
  const [formError, setFormError] = useState('');
  const [withdrawDate] = useState(new Date().toISOString().slice(0, 10));
  const total = useMemo(
    () =>
      items.reduce((s, it) => {
        const unitPrice = it.price ?? it.sellPrice ?? 0;
        return s + unitPrice * (it.quantity || 0);
      }, 0),
    [items]
  );

  const shippingFromCart = location.state && location.state.shipping ? location.state.shipping : null;

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
          // ดึงชื่อ
          const name = data.displayName || data.name || profile?.displayName || user.displayName || user.email || '';
          setRequestedBy(name);
          
          // ดึงเบอร์โทร
          const userPhone = data.phone || data.tel || '';
          setPhone(userPhone);
          
          // ดึงที่อยู่
          const userAddress = data.address || data.requestedAddress || '';
          setRequestedAddress(userAddress);
        } else {
          // ถ้าไม่มีข้อมูลใน Firestore ให้ใช้จาก profile หรือ user
          setRequestedBy(profile?.displayName || user.displayName || user.email || '');
        }
      } catch (err) {
        console.error('Error loading user for payment:', err);
        setRequestedBy(profile?.displayName || user?.displayName || user?.email || '');
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, [user?.uid, user?.displayName, user?.email, profile?.displayName]);

  // ถ้ามีข้อมูลที่อยู่จากหน้าตะกร้า ให้ override ค่าในฟอร์ม (แต่ล็อกไม่ให้แก้ไขในหน้านี้)
  useEffect(() => {
    if (!shippingFromCart) return;
    if (shippingFromCart.recipientName) {
      setRequestedBy(shippingFromCart.recipientName);
    }
    if (shippingFromCart.recipientPhone) {
      setPhone(shippingFromCart.recipientPhone);
    }
    if (shippingFromCart.recipientAddress) {
      setRequestedAddress(shippingFromCart.recipientAddress);
    }
  }, [shippingFromCart]);

  const handleConfirm = async () => {
    setFormError('');
    if (!user?.uid) {
      setFormError('กรุณาเข้าสู่ระบบก่อนทำรายการ');
      return;
    }
    if (items.length === 0) {
      setFormError('ยังไม่มีสินค้าในตะกร้า');
      return;
    }
    if (!requestedBy.trim() || !requestedAddress.trim()) {
      setFormError('กรุณากรอกชื่อและที่อยู่ให้ครบ');
      return;
    }

    setSaving(true);
    try {
      await createWithdrawal({
        items: items.map(it => {
          const unitPrice = it.price ?? it.sellPrice ?? 0;
          return {
            productId: it.productId ?? it.id,
            productName: it.productName,
            price: unitPrice,
            quantity: it.quantity,
            subtotal: unitPrice * it.quantity,
            variantSize: it.variantSize || null,
            variantColor: it.variantColor || null,
          };
        }),
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
            {/* Left: Payment (manual transfer) + read-only shipping info */}
            <div
              style={{
                background: '#f9fafb',
                borderRadius: 20,
                padding: 20,
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
              }}
            >
              {/* Payment section */}
              <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>ชำระเงิน</h3>
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  padding: 16,
                  border: '1px solid #e5e7eb',
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: 260,
                    margin: '0 auto 12px',
                    borderRadius: 16,
                    background: '#f1f5f9',
                    border: '1px dashed #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 4 }}>💳</div>
                    <div style={{ fontSize: 13, color: '#475569' }}>สแกน QR หรือโอนด้วยตนเอง</div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', fontSize: 12, color: '#64748b' }}>
                  กรุณาโอนเงินภายใน <span style={{ fontWeight: 600 }}>6 นาที</span> หลังจากสร้างคำสั่งซื้อ
                </div>
              </div>

              {/* Slip upload + basic transfer info (UI only) */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  padding: 16,
                  border: '1px solid #e5e7eb',
                  marginBottom: 18,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                  แจ้งชำระเงิน (อัปโหลดสลิป)
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 12, marginBottom: 4, color: '#6b7280' }}>วันที่โอน</div>
                    <input
                      type="date"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: '1px solid #d1d5db',
                        fontSize: 13,
                      }}
                    />
                  </div>
                  <div style={{ width: 120 }}>
                    <div style={{ fontSize: 12, marginBottom: 4, color: '#6b7280' }}>เวลาโอน</div>
                    <input
                      type="time"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: '1px solid #d1d5db',
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, marginBottom: 4, color: '#6b7280' }}>ยอดที่โอน</div>
                  <input
                    type="text"
                    value={`฿${total.toLocaleString()}`}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid #d1d5db',
                      fontSize: 13,
                      background: '#f9fafb',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, marginBottom: 6, color: '#6b7280' }}>อัปโหลดสลิปโอนเงิน</div>
                  <label
                    style={{
                      display: 'block',
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: '1px dashed #cbd5e1',
                      background: '#f8fafc',
                      textAlign: 'center',
                      fontSize: 13,
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    เลือกไฟล์สลิปจากเครื่อง
                    <input type="file" accept="image/*" style={{ display: 'none' }} />
                  </label>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                    รองรับไฟล์รูปภาพ .jpg, .png ขนาดไม่เกิน 5MB
                  </div>
                </div>
              </div>

              {/* Shipping address (read-only) */}
              <div
                style={{
                  background: '#f9fafb',
                  borderRadius: 16,
                  padding: 16,
                  border: '1px solid #e5e7eb',
                }}
              >
                <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#111827' }}>ที่อยู่จัดส่ง</h4>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 4,
                        color: '#374151',
                      }}
                    >
                      ชื่อ - นามสกุล
                    </div>
                    <input
                      type="text"
                      value={requestedBy}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 999,
                        border: '1px solid #d1d5db',
                        background: '#ffffff',
                        fontSize: 13,
                      }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 4,
                        color: '#374151',
                      }}
                    >
                      เบอร์โทร
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 999,
                        border: '1px solid #d1d5db',
                        background: '#ffffff',
                        fontSize: 13,
                      }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 4,
                        color: '#374151',
                      }}
                    >
                      ที่อยู่จัดส่ง
                    </div>
                    <textarea
                      value={requestedAddress}
                      readOnly
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 14,
                        border: '1px solid #d1d5db',
                        background: '#ffffff',
                        fontSize: 13,
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
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
                {items.map((it, idx) => {
                  const unitPrice = it.price ?? it.sellPrice ?? 0;
                  return (
                    <div
                      key={it.productId ?? it.id ?? idx}
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}
                    >
                      <span>
                        {it.productName} x {it.quantity}
                      </span>
                      <span>฿{(unitPrice * (it.quantity || 0)).toLocaleString()}</span>
                    </div>
                  );
                })}
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

              {formError && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '10px 14px',
                    borderRadius: 10,
                    marginBottom: 12,
                    fontSize: 14,
                    textAlign: 'center',
                  }}
                >
                  {formError}
                </div>
              )}

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
