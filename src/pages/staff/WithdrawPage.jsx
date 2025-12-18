import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, removeFromCart, clearCart, createWithdrawal } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import styles from './WithdrawPage.module.css';

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
      }));
    }
  }, [profile]);

  const handleQuantityChange = async (item, newQty) => {
    if (newQty < 1) return;
    try {
      await updateCartItem(user.uid, item.productId, newQty, item.variantSize, item.variantColor, item.selectedOptions, 'staff');
      setCart(prev => prev.map(c => {
        if (c.productId === item.productId && c.variantSize === item.variantSize && c.variantColor === item.variantColor) {
          return { ...c, quantity: newQty };
        }
        return c;
      }));
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert(t('common.error') + ': ' + error.message);
    }
  };

  const handleRemoveItem = async (item) => {
    if (!window.confirm(t('cart.confirm_remove_item'))) return;
    try {
      await removeFromCart(user.uid, item.productId, item.variantSize, item.variantColor, item.selectedOptions, 'staff');
      setCart(prev => prev.filter(c => !(c.productId === item.productId && c.variantSize === item.variantSize && c.variantColor === item.variantColor)));
    } catch (error) {
      console.error('Error removing item:', error);
      alert(t('common.error') + ': ' + error.message);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm(t('cart.confirm_clear_cart'))) return;
    try {
      await clearCart(user.uid, 'staff');
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      alert(t('common.error') + ': ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert(t('validation.no_items_in_cart'));
      return;
    }
    if (!formData.requesterName || !formData.recipientName) {
      alert(t('withdraw.fill_requester_receiver'));
      return;
    }
    if (formData.deliveryMethod === 'shipping' && !formData.recipientAddress) {
      alert(t('withdraw.fill_shipping_address'));
      return;
    }

    setSubmitting(true);
    try {
      const addressForOrder = formData.deliveryMethod === 'shipping' ? formData.recipientAddress : '';
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
          selectedOptions:
            item.selectedOptions && typeof item.selectedOptions === 'object' ? item.selectedOptions : null,
        })),
        requestedBy: formData.requesterName,
        requestedAddress: addressForOrder,
        receivedBy: formData.recipientName,
        receivedAddress: addressForOrder,
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
      alert(t('common.error') + ': ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);

  if (loading) {
    return (
      <div className={styles.page} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p className={styles.emptyText}>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {cart.length === 0 ? (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIcon}>🛒</div>
            <p className={styles.emptyText}>{t('cart.cart_empty')}</p>
            <button type="button" className={styles.backBtn} onClick={() => navigate('/staff')}>
              {t('cart.go_shopping')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.grid}>
              <div className={styles.leftCol}>
                <div className={styles.pageHeader}>
                  <h1 className={styles.pageTitle}>{t('withdraw.withdraw_request') || 'Withdraw Items'}</h1>
                  <p className={styles.pageSubtitle}>
                    {t('withdraw.withdraw_cart') || 'Review your selected items and choose a delivery method.'}
                  </p>
                </div>

                <div>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                      {(t('order.order_items') || 'Selected Items')} ({cart.length})
                    </h2>
                    <button type="button" className={styles.clearAllBtn} onClick={handleClearCart}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_sweep</span>
                      {t('cart.clear_cart') || 'Clear All'}
                    </button>
                  </div>

                  <div className={styles.itemList}>
                    {cart.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, idx) => {
                      const key = `${item.productId}-${item.variantSize}-${item.variantColor}-${idx}`;
                      const imageStyle = item.image ? { backgroundImage: `url('${item.image}')` } : undefined;
                      const skuText = item.sku || item.productId;

                      return (
                        <div key={key} className={styles.itemCard}>
                          <div className={styles.itemImage} style={imageStyle} />

                          <div className={styles.itemBody}>
                            <div className={styles.itemTop}>
                              <div>
                                <h3 className={styles.itemName}>{item.productName}</h3>
                                <div className={styles.itemSku}>SKU: {skuText}</div>
                              </div>
                              <div className={styles.itemPrice}>
                                ฿{(item.sellPrice * item.quantity).toLocaleString()}
                              </div>
                            </div>

                            {(item.variantSize || item.variantColor) && (
                              <div className={styles.variantRow}>
                                {item.variantSize && (
                                  <div className={styles.variantGroup}>
                                    <div className={styles.variantLabel}>{t('product.size') || 'Size'}</div>
                                    <div className={styles.variantValue}>{item.variantSize}</div>
                                  </div>
                                )}
                                {item.variantColor && (
                                  <div className={styles.variantGroup}>
                                    <div className={styles.variantLabel}>{t('product.color') || 'Color'}</div>
                                    <div className={styles.variantValue}>{item.variantColor}</div>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className={styles.itemBottom}>
                              <div className={styles.qtyControl}>
                                <button
                                  type="button"
                                  className={styles.qtyBtn}
                                  onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>remove</span>
                                </button>
                                <div className={styles.qtyValue}>{item.quantity}</div>
                                <button
                                  type="button"
                                  className={styles.qtyBtn}
                                  onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                                </button>
                              </div>

                              <button type="button" className={styles.removeBtn} onClick={() => handleRemoveItem(item)}>
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {cart.length > itemsPerPage && (
                    <div className={styles.paginationWrap}>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={styles.paginationBtn}
                      >
                        {t('common.previous')}
                      </button>
                      {Array.from({ length: Math.ceil(cart.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`${styles.paginationBtn} ${currentPage === page ? styles.paginationBtnActive : ''}`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(Math.ceil(cart.length / itemsPerPage), p + 1))}
                        disabled={currentPage === Math.ceil(cart.length / itemsPerPage)}
                        className={styles.paginationBtn}
                      >
                        {t('common.next')}
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.deliverySection}>
                  <h2 className={styles.deliveryTitle}>{t('order.delivery_method') || 'Delivery Method'}</h2>
                  <div className={styles.deliveryGrid}>
                    <button
                      type="button"
                      className={`${styles.deliveryOption} ${formData.deliveryMethod === 'pickup' ? styles.deliveryOptionActive : ''}`}
                      onClick={() => setFormData((p) => ({ ...p, deliveryMethod: 'pickup', recipientAddress: '' }))}
                    >
                      <div className={styles.deliveryOptionTop}>
                        <div className={`${styles.deliveryIcon} ${formData.deliveryMethod === 'pickup' ? styles.deliveryIconActive : ''}`}>
                          <span className="material-symbols-outlined">storefront</span>
                        </div>
                        <div className={`${styles.radioDot} ${formData.deliveryMethod === 'pickup' ? styles.radioDotActive : ''}`}>
                          {formData.deliveryMethod === 'pickup' && <div className={styles.radioDotInner} />}
                        </div>
                      </div>
                      <div>
                        <p className={styles.deliveryName} style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('order.pickup')}</p>
                        <p className={styles.deliveryDesc}>{t('withdraw.pickup_hint')}</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`${styles.deliveryOption} ${formData.deliveryMethod === 'shipping' ? styles.deliveryOptionActive : ''}`}
                      onClick={() => setFormData((p) => ({ ...p, deliveryMethod: 'shipping', recipientAddress: '' }))}
                    >
                      <div className={styles.deliveryOptionTop}>
                        <div className={`${styles.deliveryIcon} ${formData.deliveryMethod === 'shipping' ? styles.deliveryIconActive : ''}`}>
                          <span className="material-symbols-outlined">local_shipping</span>
                        </div>
                        <div className={`${styles.radioDot} ${formData.deliveryMethod === 'shipping' ? styles.radioDotActive : ''}`}>
                          {formData.deliveryMethod === 'shipping' && <div className={styles.radioDotInner} />}
                        </div>
                      </div>
                      <div>
                        <p className={styles.deliveryName} style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('order.shipping')}</p>
                        <p className={styles.deliveryDesc}>{t('withdraw.shipping_hint')}</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className={styles.addressCard}>
                  <div className={styles.addressHeader}>
                    <span className="material-symbols-outlined" style={{ color: '#135bec' }}>assignment</span>
                    <h2 className={styles.addressTitle}>{t('withdraw.withdraw_request')}</h2>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={`${styles.field} ${styles.formSpan2}`}>
                      <label className={styles.label}>{t('withdraw.requested_by') || 'Full Name / Company Name'} *</label>
                      <input
                        className={styles.input}
                        type="text"
                        value={formData.requesterName}
                        onChange={(e) => setFormData((p) => ({ ...p, requesterName: e.target.value }))}
                        required
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>{t('order.recipient_phone') || 'Phone Number'}</label>
                      <input
                        className={styles.input}
                        type="tel"
                        value={formData.recipientPhone}
                        onChange={(e) => setFormData((p) => ({ ...p, recipientPhone: e.target.value }))}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>{t('order.recipient_name') || 'Recipient Name'} *</label>
                      <input
                        className={styles.input}
                        type="text"
                        value={formData.recipientName}
                        onChange={(e) => setFormData((p) => ({ ...p, recipientName: e.target.value }))}
                        required
                      />
                    </div>

                    {formData.deliveryMethod === 'shipping' && (
                      <div className={`${styles.field} ${styles.formSpan2}`}>
                        <label className={styles.label}>{t('order.shipping_address') || 'Shipping Address'} *</label>
                        <textarea
                          className={styles.textarea}
                          value={formData.recipientAddress}
                          onChange={(e) => setFormData((p) => ({ ...p, recipientAddress: e.target.value }))}
                          required
                        />
                      </div>
                    )}

                    <div className={styles.field}>
                      <label className={styles.label}>{t('withdraw.withdraw_date') || 'Withdraw Date'} *</label>
                      <input
                        className={styles.input}
                        type="date"
                        value={formData.withdrawDate}
                        onChange={(e) => setFormData((p) => ({ ...p, withdrawDate: e.target.value }))}
                        required
                      />
                    </div>

                    <div className={`${styles.field} ${styles.formSpan2}`}>
                      <label className={styles.label}>{t('order.order_note') || 'Internal Notes (Optional)'}</label>
                      <textarea
                        className={styles.textarea}
                        value={formData.notes}
                        onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.rightCol}>
                <div className={styles.sticky}>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryHeader}>
                      <h2 className={styles.summaryHeaderTitle}>{t('common.summary')}</h2>
                    </div>
                    <div className={styles.summaryBody}>
                      <div className={styles.summaryRow}>
                        <span>{t('common.items')} ({cart.length})</span>
                        <span className={styles.summaryValue}>฿{totalAmount.toLocaleString()}</span>
                      </div>
                      <div className={styles.summaryDivider}></div>
                      <div className={styles.totalRow}>
                        <span className={styles.totalLabel}>{t('common.total')}</span>
                        <span className={styles.totalAmount}>฿{totalAmount.toLocaleString()}</span>
                      </div>

                      <button type="submit" className={styles.confirmBtn} disabled={submitting}>
                        {submitting ? (t('message.processing') || 'Processing...') : (t('withdraw.confirm_withdraw') || 'Confirm Withdrawal')}
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </button>
                    </div>
                  </div>

                  <div className={styles.helpBox}>
                    <span className="material-symbols-outlined" style={{ color: '#135bec' }}>support_agent</span>
                    <div>
                      <h4 className={styles.helpTitle}>{t('common.help') || 'Need Help?'}</h4>
                      <p className={styles.helpText}>
                        {t('withdraw.support_hint') || 'Contact inventory support if you have questions about stock availability or shipping restrictions.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
