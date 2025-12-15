import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, removeFromCart } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import styles from './CustomerWithdrawPage.module.css';

export default function CustomerWithdrawPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('shipping');

  // Form data
  const [formData, setFormData] = useState({
    recipientName: '',
    phone: '',
    email: '',
    address: '',
    province: '',
    district: '',
    subdistrict: '',
    zipCode: '',
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
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
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

  const handleClearAll = async () => {
    if (!window.confirm('ต้องการลบสินค้าทั้งหมดออกจากตะกร้าหรือไม่?')) return;
    try {
      for (const item of cart) {
        await removeFromCart(user.uid, item.productId, item.variantSize, item.variantColor);
      }
      setCart([]);
      window.dispatchEvent(new Event('customer-cart-updated'));
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
    if (!formData.recipientName || !formData.address) {
      alert('กรุณากรอกข้อมูลผู้รับให้ครบถ้วน');
      return;
    }

    setSubmitting(true);
    try {
      navigate('/customer/payment', {
        state: {
          shipping: {
            recipientName: formData.recipientName,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            province: formData.province,
            district: formData.district,
            subdistrict: formData.subdistrict,
            zipCode: formData.zipCode,
            deliveryMethod: deliveryMethod,
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

  const subtotal = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
  const shippingFee = deliveryMethod === 'pickup' ? 0 : 50;
  const tax = Math.round(subtotal * 0.07);
  const totalAmount = subtotal + shippingFee + tax;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <p className={styles.loadingText}>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <a href="/customer" className={styles.breadcrumbLink}>Inventory</a>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>{t('cart.cart') || 'Withdraw Cart'}</span>
      </div>

      {cart.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>🛒</div>
          <h2 className={styles.emptyStateTitle}>{t('cart.cart_empty') || 'Your cart is empty'}</h2>
          <p className={styles.emptyStateDesc}>
            {t('cart.cart_empty_hint') || 'Start adding items to your cart from the inventory.'}
          </p>
          <button
            onClick={() => navigate('/customer')}
            className={styles.emptyStateButton}
          >
            {t('cart.go_shopping') || 'Browse Inventory'}
          </button>
        </div>
      ) : (
        <div className={styles.mainGrid}>
          {/* Left Column: Cart & Details */}
          <div className={styles.leftColumn}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Withdraw Items</h1>
              <p className={styles.pageSubtitle}>Review your selected items and choose a delivery method.</p>
            </div>

            {/* Cart Items List */}
            <div className={styles.cartItemsList}>
              <div className={styles.cartHeader}>
                <h2 className={styles.cartTitle}>Selected Items ({totalItems})</h2>
                <button className={styles.clearAllButton} onClick={handleClearAll}>
                  <strong>Clear All</strong>
                </button>
              </div>

              {cart.map((item, idx) => (
                <div
                  key={`${item.productId}-${item.variantSize}-${item.variantColor}-${idx}`}
                  className={styles.cartItem}
                >
                  <div
                    className={styles.cartItemImage}
                    style={{ backgroundImage: item.image ? `url('${item.image}')` : 'none' }}
                  />
                  <div className={styles.cartItemContent}>
                    <div className={styles.cartItemHeader}>
                      <div className={styles.cartItemInfo}>
                        <h3 className={styles.cartItemName}>{item.productName}</h3>
                        <p className={styles.cartItemSku}>
                          {item.variantSize && `${t('product.size')}: ${item.variantSize}`}
                          {item.variantSize && item.variantColor && ' | '}
                          {item.variantColor && `${t('product.color')}: ${item.variantColor}`}
                        </p>
                      </div>
                      <p className={styles.cartItemPrice}>฿{item.sellPrice.toLocaleString()}</p>
                    </div>
                    <div className={styles.cartItemFooter}>
                      <div className={styles.cartItemVariants}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {t('common.unit')}: {item.unit || t('common.piece')}
                        </span>
                      </div>
                      <div className={styles.cartItemActions}>
                        <div className={styles.quantityControl}>
                          <button
                            className={styles.quantityButton}
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>remove</span>
                          </button>
                          <input
                            type="text"
                            readOnly
                            value={item.quantity}
                            className={styles.quantityInput}
                          />
                          <button
                            className={styles.quantityButton}
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>add</span>
                          </button>
                        </div>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleRemoveItem(item)}
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Method Section */}
            <div className={styles.deliverySection}>
              <h2 className={styles.deliverySectionTitle}>Delivery Method</h2>
              <div className={styles.deliveryOptions}>
                {/* Shipping */}
                <label className={styles.deliveryOption}>
                  <input
                    type="radio"
                    name="delivery"
                    value="shipping"
                    checked={deliveryMethod === 'shipping'}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className={styles.deliveryOptionInput}
                  />
                  <div className={styles.deliveryOptionCard}>
                    <div className={styles.deliveryOptionHeader}>
                      <div className={styles.deliveryOptionIcon}>
                        <span className="material-symbols-outlined">local_shipping</span>
                      </div>
                      <div className={styles.deliveryOptionRadio}>
                        <div className={styles.deliveryOptionRadioDot} />
                      </div>
                    </div>
                    <div className={styles.deliveryOptionContent}>
                      <p className={styles.deliveryOptionTitle}>Standard Shipping</p>
                      <p className={styles.deliveryOptionDesc}>Delivery within 3-5 business days</p>
                      <p className={`${styles.deliveryOptionPrice} ${styles.deliveryOptionPricePaid}`}>
                        ฿{shippingFee.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Shipping Address Form */}
            <form className={styles.shippingForm} onSubmit={handleSubmit}>
              <div className={styles.shippingFormHeader}>
                <span className={`material-symbols-outlined ${styles.shippingFormIcon}`}>location_on</span>
                <h2 className={styles.shippingFormTitle}>Shipping Address</h2>
              </div>

              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.formLabel}>Full Name / Company Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Somchai Jai-dee"
                    value={formData.recipientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone Number</label>
                  <input
                    type="tel"
                    className={styles.formInput}
                    placeholder="08x-xxx-xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.formGroupRight}`}>
                  <label className={styles.formLabel}>Email Address (Optional)</label>
                  <input
                    type="email"
                    className={styles.formInput}
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.formLabel}>Address Details</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Building, Floor, Room, Street"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Province</label>
                  <div className={styles.selectWrapper}>
                    <select
                      className={styles.formSelect}
                      value={formData.province}
                      onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                    >
                      <option value="">{t('common.select') || 'Select Province'}</option>
                      <option value="Bangkok">Bangkok</option>
                      <option value="Chiang Mai">Chiang Mai</option>
                      <option value="Phuket">Phuket</option>
                    </select>
                    <span className={`material-symbols-outlined ${styles.selectIcon}`}>expand_more</span>
                  </div>
                </div>

                <div className={`${styles.formGroup} ${styles.formGroupRight}`}>
                  <label className={styles.formLabel}>District</label>
                  <div className={styles.selectWrapper}>
                    <select
                      className={styles.formSelect}
                      value={formData.district}
                      onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                    >
                      <option value="">{t('common.select') || 'Select District'}</option>
                      <option value="Pathum Wan">Pathum Wan</option>
                      <option value="Bang Rak">Bang Rak</option>
                    </select>
                    <span className={`material-symbols-outlined ${styles.selectIcon}`}>expand_more</span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Sub-district</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.subdistrict}
                    onChange={(e) => setFormData(prev => ({ ...prev, subdistrict: e.target.value }))}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.formGroupRight}`}>
                  <label className={styles.formLabel}>Zip Code</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.zipCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className={styles.rightColumn}>
            <div className={styles.summarySticky}>
              {/* Summary Card */}
              <div className={styles.summaryCard}>
                <div className={styles.summaryHeader}>
                  <h2 className={styles.summaryTitle}>Order Summary</h2>
                </div>
                <div className={styles.summaryBody}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>
                      {t('cart.subtotal') || 'Subtotal'} ({totalItems} {t('common.items') || 'items'})
                    </span>
                    <span className={styles.summaryValue}>฿{subtotal.toLocaleString()}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Shipping Estimate</span>
                    <span className={styles.summaryValue}>
                      {shippingFee === 0 ? 'FREE' : `฿${shippingFee.toLocaleString()}`}
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Tax (7%)</span>
                    <span className={styles.summaryValue}>฿{tax.toLocaleString()}</span>
                  </div>

                  {/* Promo Code */}
                  <div className={styles.promoSection}>
                    <div className={styles.promoInputWrapper}>
                      <input
                        type="text"
                        className={styles.promoInput}
                        placeholder="Promo code"
                      />
                      <button type="button" className={styles.promoButton}>
                        {t('common.apply') || 'Apply'}
                      </button>
                    </div>
                  </div>

                  <div className={styles.summaryDivider} />

                  <div className={styles.summaryTotal}>
                    <span className={styles.summaryTotalLabel}>{t('common.total') || 'Total'}</span>
                    <div className={styles.summaryTotalValue}>
                      <span className={styles.summaryTotalAmount}>฿{totalAmount.toLocaleString()}</span>
                      <span className={styles.summaryTotalCurrency}>THB</span>
                    </div>
                  </div>
                </div>

                <div className={styles.summaryFooter}>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={styles.submitButton}
                  >
                    {submitting ? 'Processing...' : 'Confirm Withdrawal'}
                    <span className={`material-symbols-outlined ${styles.submitButtonIcon}`} style={{ fontSize: '1.25rem' }}>
                      arrow_forward
                    </span>
                  </button>
                  <p className={styles.secureText}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>lock</span>
                    Secure processing
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
