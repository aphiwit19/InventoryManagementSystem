import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { db, storage } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createWithdrawal, getCart, clearCart, migrateLocalStorageCart, validateAndUseCoupon, incrementCouponUsage } from '../../services';
import { useTranslation } from 'react-i18next';

export default function CustomerPaymentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();

  const [items, setItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPaymentAccount, setLoadingPaymentAccount] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestedBy, setRequestedBy] = useState('');
  const [phone, setPhone] = useState('');
  const [requestedAddress, setRequestedAddress] = useState('');
  const [formError, setFormError] = useState('');
  const [withdrawDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentAccount, setPaymentAccount] = useState({ bankName: '', accountName: '', accountNumber: '', note: '', qrUrl: '' });
  const [paymentAccountError, setPaymentAccountError] = useState('');
  const [slipFile, setSlipFile] = useState(null);
  const [, setSlipUploading] = useState(false);
  const [slipPreviewText, setSlipPreviewText] = useState('');
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
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

  // Load payment account (QR + bank info) from admin settings
  useEffect(() => {
    const loadPaymentAccount = async () => {
      setLoadingPaymentAccount(true);
      setPaymentAccountError('');
      try {
        const snap = await getDoc(doc(db, 'settings', 'paymentAccount'));
        if (snap.exists()) {
          const data = snap.data() || {};
          setPaymentAccount({
            bankName: data.bankName || '',
            accountName: data.accountName || '',
            accountNumber: data.accountNumber || '',
            note: data.note || '',
            qrUrl: data.qrUrl || '',
          });
        } else {
          setPaymentAccountError('ยังไม่ได้ตั้งค่าบัญชีสำหรับชำระเงิน');
        }
      } catch (e) {
        console.error('load paymentAccount failed:', e);
        setPaymentAccountError('โหลดข้อมูลบัญชีสำหรับชำระเงินไม่สำเร็จ');
      } finally {
        setLoadingPaymentAccount(false);
      }
    };
    loadPaymentAccount();
  }, []);

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

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('กรุณากรอกรหัสคูปอง');
      return;
    }

    setApplyingCoupon(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const result = await validateAndUseCoupon(couponCode, total);
      setAppliedCoupon(result.coupon);
      setCouponDiscount(result.discountAmount);
      setCouponSuccess(`ใช้คูปองสำเร็จ! ลด ฿${result.discountAmount.toLocaleString()}`);
    } catch (err) {
      setCouponError(err.message || 'ไม่สามารถใช้คูปองได้');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    setCouponError('');
    setCouponSuccess('');
  };

  // Calculate final total
  const finalTotal = total - couponDiscount;

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

    if (!paymentAccount.bankName || !paymentAccount.accountName || !paymentAccount.accountNumber) {
      setFormError('ไม่สามารถทำรายการได้: ระบบยังไม่ได้ตั้งค่าบัญชีสำหรับชำระเงิน');
      return;
    }

    if (!slipFile) {
      setFormError('กรุณาอัปโหลดสลิปการโอนเงิน');
      return;
    }

    setSaving(true);
    try {
      // Upload slip image to Firebase Storage
      setSlipUploading(true);
      const path = `customer/payment-slips/${user.uid}/${Date.now()}_${slipFile.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, slipFile);
      const slipUrl = await getDownloadURL(storageRef);
      setSlipUploading(false);

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
        total: finalTotal,
        subtotal: total,
        discount: couponDiscount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        couponId: appliedCoupon ? appliedCoupon.id : null,
        paymentMethod: 'bank_transfer_qr',
        paymentAccount: {
          bankName: paymentAccount.bankName,
          accountName: paymentAccount.accountName,
          accountNumber: paymentAccount.accountNumber,
          note: paymentAccount.note || null,
          qrUrl: paymentAccount.qrUrl || null,
        },
        paymentSlipUrl: slipUrl,
        createdByUid: user.uid,
        createdByEmail: user.email || null,
        createdSource: 'customer'
      });

      // Increment coupon usage if applied
      if (appliedCoupon) {
        await incrementCouponUsage(appliedCoupon.id);
      }

      await clearCart(user.uid, 'customer');
      setItems([]);
      navigate('/customer/payment/success');
    } catch (e) {
      console.error('Error confirming order:', e);
      alert('ไม่สามารถยืนยันคำสั่งซื้อได้: ' + (e?.message || ''));
    } finally {
      setSaving(false);
      setSlipUploading(false);
    }
  };

  const isLoading = loadingCart || loadingUser;

  return (
    <div style={{ padding: '30px', background: '#f0f4ff', minHeight: '100vh' }}>
      {/* Step indicator */}
      <div
        style={{
          maxWidth: 930,
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
          <span style={{ color: '#4CAF50' }}>1 {t('payment.step_cart')}</span>
          <span style={{ color: '#2e7d32', borderBottom: '2px solid #2e7d32', paddingBottom: 4 }}>
            2 {t('payment.step_payment')}
          </span>
          <span style={{ color: '#9e9e9e' }}>3 {t('payment.step_complete')}</span>
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
          maxWidth: 930,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 24,
          padding: '24px 24px 28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          boxSizing: 'border-box',
        }}
      >
        <h2 style={{ textAlign: 'center', margin: '0 0 24px', fontSize: 24 }}>{t('payment.payment')}</h2>

        {isLoading ? (
          <p style={{ textAlign: 'center', color: '#777', padding: 40 }}>{t('common.loading')}</p>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#777', marginBottom: 16 }}>{t('cart.cart_empty_message')}</p>
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
              {t('cart.go_shopping')}
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)',
              gap: 24,
              alignItems: 'flex-start',
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
              <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>{t('payment.payment')}</h3>
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
                  {paymentAccount.qrUrl ? (
                    <img
                      src={paymentAccount.qrUrl}
                      alt="QR สำหรับชำระเงิน"
                      style={{ maxWidth: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 12 }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 40, marginBottom: 4 }}>💳</div>
                      <div style={{ fontSize: 13, color: '#475569' }}>
                        {loadingPaymentAccount
                          ? t('payment.loading_payment_account')
                          : t('payment.no_qr')}
                      </div>
                    </div>
                  )}
                </div>
                {/* removed time limit helper text */}
                {paymentAccount.bankName && (
                  <div
                    style={{
                      marginTop: 4,
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      fontSize: 13,
                      color: '#1e40af',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{paymentAccount.bankName}</div>
                    <div style={{ marginTop: 2 }}>{paymentAccount.accountName}</div>
                    <div style={{ marginTop: 2 }}>{t('payment.account_number')}: {paymentAccount.accountNumber}</div>
                    {paymentAccount.note && (
                      <div style={{ marginTop: 4, fontSize: 12, color: '#334155' }}>{paymentAccount.note}</div>
                    )}
                  </div>
                )}
                {paymentAccountError && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '8px 10px',
                      borderRadius: 10,
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      fontSize: 12,
                    }}
                  >
                    {paymentAccountError}
                  </div>
                )}
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
                  {t('payment.notify_payment')}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 12, marginBottom: 4, color: '#6b7280' }}>{t('order.transfer_date')}</div>
                    <input
                      type="date"
                      style={{
                        width: 'calc(100% - 50px)',
                        margin: '0 auto',
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: '1px solid #d1d5db',
                        fontSize: 13,
                      }}
                    />
                  </div>
                  <div style={{ width: 120 }}>
                    <div style={{ fontSize: 12, marginBottom: 4, color: '#6b7280' }}>{t('order.transfer_time')}</div>
                    <input
                      type="time"
                      style={{
                        width: 'calc(100% - 50px)',
                        margin: '0 auto',
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: '1px solid #d1d5db',
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, marginBottom: 4, color: '#6b7280' }}>{t('order.transfer_amount')}</div>
                  <input
                    type="text"
                    value={`฿${finalTotal.toLocaleString()}`}
                    readOnly
                    style={{
                      width: 'calc(100% - 50px)',
                      margin: '0 auto',
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid #d1d5db',
                      fontSize: 13,
                      background: '#f9fafb',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, marginBottom: 6, color: '#6b7280' }}>{t('order.upload_slip')}</div>
                  <label
                    style={{
                      display: 'block',
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: slipFile ? '1px solid #4ade80' : '1px dashed #cbd5e1',
                      background: slipFile ? '#ecfdf3' : '#f8fafc',
                      textAlign: 'center',
                      fontSize: 13,
                      color: slipFile ? '#166534' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {slipFile ? `${t('order.slip_uploaded')} (${t('order.click_to_change')})` : t('order.select_slip_file')}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setSlipFile(file);
                        setSlipPreviewText(file.name);
                      }}
                    />
                  </label>
                  {slipFile && (
                    <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4 }}>
                      {t('order.slip_uploaded')}: {slipPreviewText}
                    </div>
                  )}
                  {!slipFile && (
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                      {slipPreviewText}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    {t('order.slip_file_hint')}
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
                <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#111827' }}>{t('order.shipping_address')}</h4>
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
                      {t('auth.full_name')}
                    </div>
                    <input
                      type="text"
                      value={requestedBy}
                      readOnly
                      style={{
                        width: 'calc(100% - 50px)',
                        margin: '0 auto',
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
                      {t('common.phone')}
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      readOnly
                      style={{
                        width: 'calc(100% - 50px)',
                        margin: '0 auto',
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
                      {t('order.shipping_address')}
                    </div>
                    <textarea
                      value={requestedAddress}
                      readOnly
                      rows={3}
                      style={{
                        width: 'calc(100% - 50px)',
                        margin: '0 auto',
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
              <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>{t('order.order_summary')}</h3>
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
                <span>{t('order.product_total')}</span>
                <span>฿{total.toLocaleString()}</span>
              </div>

              {/* Coupon Section */}
              {!appliedCoupon ? (
                <div style={{ marginBottom: 12, padding: '12px', background: '#f9fafb', borderRadius: 10, border: '1px dashed #d1d5db' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>🎫 มีรหัสส่วนลด?</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="กรอกรหัสคูปอง"
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon}
                      style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: applyingCoupon ? 'not-allowed' : 'pointer', opacity: applyingCoupon ? 0.6 : 1 }}
                    >
                      {applyingCoupon ? 'กำลังตรวจสอบ...' : 'ใช้'}
                    </button>
                  </div>
                  {couponError && <div style={{ marginTop: 6, fontSize: 12, color: '#dc2626' }}>{couponError}</div>}
                  {couponSuccess && <div style={{ marginTop: 6, fontSize: 12, color: '#059669' }}>{couponSuccess}</div>}
                </div>
              ) : (
                <div style={{ marginBottom: 12, padding: '12px', background: '#d1fae5', borderRadius: 10, border: '1px solid #10b981' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>🎫 {appliedCoupon.code}</div>
                      <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>ลด ฿{couponDiscount.toLocaleString()}</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      style={{ padding: '4px 8px', background: '#fff', border: '1px solid #10b981', borderRadius: 6, fontSize: 12, color: '#059669', cursor: 'pointer' }}
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              )}

              {/* Discount */}
              {couponDiscount > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                    fontSize: 14,
                    color: '#059669'
                  }}
                >
                  <span>ส่วนลด</span>
                  <span>-฿{couponDiscount.toLocaleString()}</span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  fontSize: 14
                }}
              >
                <span>{t('order.shipping_fee')}</span>
                <span>{t('order.shipping_fee_note')}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16
                }}
              >
                <span style={{ fontWeight: 600 }}>{t('order.grand_total')}</span>
                <span style={{ fontWeight: 700, fontSize: 20, color: couponDiscount > 0 ? '#059669' : '#000' }}>
                  ฿{finalTotal.toLocaleString()}
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
                {saving ? t('order.confirming_order') : t('order.confirm_order')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
