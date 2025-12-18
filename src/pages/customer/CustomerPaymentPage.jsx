import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { db, storage } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createWithdrawal, getCart, clearCart, migrateLocalStorageCart } from '../../services';
import { useTranslation } from 'react-i18next';
import styles from './CustomerPaymentPage.module.css';

export default function CustomerPaymentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();

  const [items, setItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [, setLoadingPaymentAccount] = useState(true);
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
  
  // Payment method tab
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  

  const total = useMemo(
    () =>
      items.reduce((s, it) => {
        const unitPrice = it.price ?? it.sellPrice ?? 0;
        return s + unitPrice * (it.quantity || 0);
      }, 0),
    [items]
  );

  const shippingFromCart = location.state && location.state.shipping ? location.state.shipping : null;
  const finalTotal = total;
  const totalItems = items.reduce((sum, it) => sum + (it.quantity || 0), 0);

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
          const name = data.firstName || data.displayName || data.name || profile?.displayName || user.displayName || user.email || '';
          setRequestedBy(name);
          
          // Find default address or use first address from addresses array
          const addresses = data.addresses || [];
          const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
          
          if (defaultAddr) {
            // Use address from saved addresses
            setPhone(defaultAddr.phone || data.phone || data.tel || '');
            // Build full address string from address components
            const addressParts = [
              defaultAddr.address,
              defaultAddr.district,
              defaultAddr.city,
              defaultAddr.province,
              defaultAddr.postalCode
            ].filter(Boolean);
            setRequestedAddress(addressParts.join(', '));
          } else {
            // No saved address, use profile data
            const userPhone = data.phone || data.tel || '';
            setPhone(userPhone);
            const userAddress = data.address || data.requestedAddress || '';
            setRequestedAddress(userAddress);
          }
        } else {
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
          setPaymentAccountError('Payment account not configured');
        }
      } catch (e) {
        console.error('load paymentAccount failed:', e);
        setPaymentAccountError('Failed to load payment account');
      } finally {
        setLoadingPaymentAccount(false);
      }
    };
    loadPaymentAccount();
  }, []);

  // Override form values from cart shipping info
  useEffect(() => {
    if (!shippingFromCart) return;
    if (shippingFromCart.recipientName) {
      setRequestedBy(shippingFromCart.recipientName);
    }
    if (shippingFromCart.phone) {
      setPhone(shippingFromCart.phone);
    }
    if (shippingFromCart.address) {
      setRequestedAddress(shippingFromCart.address);
    }
  }, [shippingFromCart]);


  const handleConfirm = async () => {
    setFormError('');
    if (!user?.uid) {
      setFormError(t('auth.please_login'));
      return;
    }
    if (items.length === 0) {
      setFormError(t('validation.no_items_in_cart'));
      return;
    }
    if (!requestedBy.trim() || !requestedAddress.trim()) {
      setFormError(t('validation.please_fill_name_address'));
      return;
    }

    if (!paymentAccount.bankName || !paymentAccount.accountName || !paymentAccount.accountNumber) {
      setFormError(t('payment.no_payment_account'));
      return;
    }

    if (!slipFile) {
      setFormError(t('validation.please_upload_slip'));
      return;
    }

    setSaving(true);
    try {
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
        discount: 0,
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

      await clearCart(user.uid, 'customer');
      setItems([]);
      navigate('/customer/payment/success');
    } catch (e) {
      console.error('Error confirming order:', e);
      alert('Failed to confirm order: ' + (e?.message || ''));
    } finally {
      setSaving(false);
      setSlipUploading(false);
    }
  };

  const isLoading = loadingCart || loadingUser;

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <p className={styles.loadingText}>{t('common.loading')}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>🛒</div>
          <h2 className={styles.emptyStateTitle}>{t('cart.cart_empty')}</h2>
          <p className={styles.emptyStateDesc}>{t('cart.cart_empty_message')}</p>
          <Link to="/customer" className={styles.emptyStateButton}>
            {t('cart.go_shopping')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainGrid}>
        {/* Left Column: Checkout Process */}
        <div className={styles.leftColumn}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>{t('cart.checkout')}</h1>
            <p className={styles.pageSubtitle}>{t('payment.checkout_subtitle')}</p>
          </div>

          {/* Step 1: Shipping Address */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.stepNumber}>1</span>
                {t('order.shipping_address')}
              </h3>
            </div>
            <div className={styles.addressCard}>
              <div className={styles.addressContent}>
                <div className={styles.addressInfo}>
                  <div className={styles.addressDetails}>
                    <div className={styles.addressHeader}>
                      <span className={`material-symbols-outlined ${styles.addressIcon}`}>location_on</span>
                      <p className={styles.addressName}>{requestedBy || t('common.no_data')}</p>
                    </div>
                    <p className={styles.addressText}>
                      {requestedAddress || t('common.no_data')}
                      {phone && <><br />{phone}</>}
                    </p>
                  </div>
                  <button 
                    className={styles.changeButton}
                    onClick={() => navigate('/customer/withdraw')}
                  >
                    {t('common.edit')}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Step 2: Payment Method */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.stepNumber}>2</span>
                {t('order.payment_method')}
              </h3>
              <div className={styles.securityBadge}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>lock</span>
                <span className={styles.securityText}>{t('payment.encrypted')}</span>
              </div>
            </div>
            <div className={styles.paymentCard}>
              {/* Payment Tabs */}
              <div className={styles.paymentTabs}>
                                <button 
                  className={`${styles.paymentTab} ${paymentMethod === 'bank_transfer' ? styles.paymentTabActive : ''}`}
                  onClick={() => setPaymentMethod('bank_transfer')}
                >
                  <span className={`material-symbols-outlined ${styles.paymentTabIcon}`}>account_balance</span>
                  <span className={styles.paymentTabText}>{t('order.bank_transfer')}</span>
                </button>
                <button 
                  className={`${styles.paymentTab} ${paymentMethod === 'promptpay' ? styles.paymentTabActive : ''}`}
                  onClick={() => setPaymentMethod('promptpay')}
                >
                  <span className={`material-symbols-outlined ${styles.paymentTabIcon}`}>qr_code_scanner</span>
                  <span className={styles.paymentTabText}>{t('payment.promptpay')}</span>
                </button>
              </div>

              {/* Payment Content */}
              <div className={styles.paymentContent}>
                
                {paymentMethod === 'bank_transfer' && (
                  <div className={styles.formGrid}>
                    {/* Bank Info */}
                    {paymentAccount.bankName && (
                      <div className={styles.bankInfo}>
                        <div className={styles.bankLogo}>
                          {paymentAccount.bankName.substring(0, 4).toUpperCase()}
                        </div>
                        <div className={styles.bankDetails}>
                          <p className={styles.bankName}>{paymentAccount.bankName}</p>
                          <p className={styles.bankAccountName}>{paymentAccount.accountName}</p>
                          <p className={styles.bankAccountNumber}>{paymentAccount.accountNumber}</p>
                        </div>
                      </div>
                    )}

                    {paymentAccountError && (
                      <div className={styles.errorMessage}>{paymentAccountError}</div>
                    )}

                    {/* Upload Slip */}
                    <label className={styles.uploadArea}>
                      <span className={`material-symbols-outlined ${styles.uploadIcon}`}>cloud_upload</span>
                      <p className={styles.uploadTitle}>{t('payment.upload_slip')}</p>
                      <p className={styles.uploadDesc}>{t('payment.upload_desc')}</p>
                      <p className={styles.uploadHint}>{t('payment.file_hint')}</p>
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
                      <div className={styles.uploadPreview}>
                        <span className={`material-symbols-outlined ${styles.uploadPreviewIcon}`}>check_circle</span>
                        <span className={styles.uploadPreviewText}>{slipPreviewText}</span>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'promptpay' && (
                  <div className={styles.formGrid}>
                    {/* QR Code */}
                    <div className={styles.qrSection}>
                      <div className={styles.qrImage}>
                        {paymentAccount.qrUrl ? (
                          <img src={paymentAccount.qrUrl} alt="PromptPay QR" />
                        ) : (
                          <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: '#9ca3af' }}>qr_code_2</span>
                        )}
                      </div>
                      <p className={styles.qrText}>
                        {t('payment.scan_qr_to_pay')} ฿{finalTotal.toLocaleString()}
                      </p>
                    </div>

                    {/* Upload Slip */}
                    <label className={styles.uploadArea}>
                      <span className={`material-symbols-outlined ${styles.uploadIcon}`}>cloud_upload</span>
                      <p className={styles.uploadTitle}>{t('payment.upload_slip')}</p>
                      <p className={styles.uploadDesc}>{t('payment.upload_desc')}</p>
                      <p className={styles.uploadHint}>{t('payment.file_hint')}</p>
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
                      <div className={styles.uploadPreview}>
                        <span className={`material-symbols-outlined ${styles.uploadPreviewIcon}`}>check_circle</span>
                        <span className={styles.uploadPreviewText}>{slipPreviewText}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary */}
        <aside className={styles.rightColumn}>
          <div className={styles.summarySticky}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader}>
                <h3 className={styles.summaryTitle}>{t('order.order_summary')}</h3>
                <Link to="/customer/withdraw" className={styles.editOrderLink}>{t('common.edit')}</Link>
              </div>

              {/* Product List */}
              <div className={styles.productList}>
                {items.map((item, idx) => {
                  const unitPrice = item.price ?? item.sellPrice ?? 0;
                  return (
                    <div key={item.productId ?? item.id ?? idx} className={styles.productItem}>
                      <div 
                        className={styles.productImage}
                        style={{ backgroundImage: item.image ? `url('${item.image}')` : 'none' }}
                      />
                      <div className={styles.productInfo}>
                        <div className={styles.productHeader}>
                          <h4 className={styles.productName}>{item.productName}</h4>
                          <p className={styles.productPrice}>฿{(unitPrice * item.quantity).toLocaleString()}</p>
                        </div>
                        <p className={styles.productSku}>
                          {item.variantSize && `Size: ${item.variantSize}`}
                          {item.variantSize && item.variantColor && ' | '}
                          {item.variantColor && `Color: ${item.variantColor}`}
                        </p>
                        <span className={styles.productQty}>{t('common.quantity')}: {item.quantity}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Calculations */}
              <div className={styles.calculations}>
                <div className={styles.calcRow}>
                  <span>{t('order.product_total')} ({totalItems} {t('common.items')})</span>
                  <span className={styles.calcValue}>฿{total.toLocaleString()}</span>
                </div>
                <div className={styles.calcDivider}></div>
                <div className={styles.calcTotal}>
                  <span className={styles.calcTotalLabel}>{t('common.total')}</span>
                  <span className={styles.calcTotalValue}>฿{finalTotal.toLocaleString()}</span>
                </div>

                {formError && (
                  <div className={styles.errorMessage} style={{ marginTop: '1rem' }}>
                    {formError}
                  </div>
                )}

                <button 
                  className={styles.payButton}
                  onClick={handleConfirm}
                  disabled={saving}
                >
                  {saving ? t('message.processing') : t('payment.pay_now')}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <p className={styles.securePaymentText}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>verified_user</span>
                  {t('payment.secure_payment')}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
