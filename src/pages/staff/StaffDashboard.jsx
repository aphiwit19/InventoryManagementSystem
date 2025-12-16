import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getAllProducts, addToCart, getCart, DEFAULT_CATEGORIES } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import styles from './StaffDashboard.module.css';

export default function StaffDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const outletCtx = useOutletContext();
  const searchQuery = outletCtx?.searchQuery || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Variant selection modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // Cart count for badge
  const [cartCount, setCartCount] = useState(0);

  // Profile menu
  // eslint-disable-next-line no-unused-vars
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await getAllProducts();
        // Filter only products that still have available stock for staff
        const available = productsData.filter(p => {
          const qty = parseInt(p.quantity || 0);
          const reserved = parseInt(p.reserved || 0);
          const staffReserved = parseInt(p.staffReserved || 0);
          const availableForStaff = qty - reserved - staffReserved;
          return availableForStaff > 0;
        });
        setProducts(available);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Load cart count
  useEffect(() => {
    if (!user?.uid) {
      setCartCount(0);
      return;
    }
    const loadCartCount = async () => {
      try {
        const cartItems = await getCart(user.uid, 'staff');
        const total = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        setCartCount(total);
      } catch (err) {
        console.warn('load staff cart failed:', err);
      }
    };
    loadCartCount();

    const handler = () => loadCartCount();
    window.addEventListener('staff-cart-updated', handler);
    return () => window.removeEventListener('staff-cart-updated', handler);
  }, [user?.uid]);

  const uniqueCategories = useMemo(() => {
    const cats = products.map(p => p.category).filter(c => c && c.trim() !== '');
    const sorted = [...new Set([...DEFAULT_CATEGORIES, ...cats])].sort();

    const otherLabel = 'อื่นๆ';
    const idx = sorted.findIndex((c) => String(c).trim() === otherLabel);
    if (idx >= 0) {
      const [other] = sorted.splice(idx, 1);
      sorted.push(other);
    }

    return sorted;
  }, [products]);

  useEffect(() => {
    if (!categoryOpen) return;
    const onDown = (e) => {
      if (!categoryRef.current) return;
      if (!categoryRef.current.contains(e.target)) {
        setCategoryOpen(false);
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [categoryOpen]);

  const skuText = (product) => {
    if (product?.sku) return String(product.sku);
    if (product?.productCode) return String(product.productCode);
    if (product?.barcode) return String(product.barcode);
    return product?.id ? String(product.id).slice(0, 8).toUpperCase() : '-';
  };

  const productMatchesQuery = (product, query) => {
    if (!query) return true;
    const q = query.toLowerCase();
    const haystack = [
      product?.productName,
      product?.category,
      product?.description,
      skuText(product),
    ]
      .filter(Boolean)
      .map((v) => String(v).toLowerCase());
    return haystack.some((v) => v.includes(q));
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter((product) => productMatchesQuery(product, searchQuery));
    }
    if (categoryFilter) {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }
    return filtered;
  }, [products, searchQuery, categoryFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setSelectedVariant(null);
    setQuantity(1);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setSelectedVariant(null);
    setQuantity(1);
  };

  const handleAddToCart = async () => {
    if (!user) {
      alert('กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า');
      return;
    }

    const product = selectedProduct;
    if (!product) return;

    const hasVariants = product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0;

    if (hasVariants && !selectedVariant) {
      alert('กรุณาเลือก Variant ก่อนเพิ่มลงตะกร้า');
      return;
    }

    setAddingToCart(true);
    try {
      const cartItem = {
        productId: product.id,
        productName: product.productName,
        image: product.image,
        unit: product.unit || 'ชิ้น',
        quantity: quantity,
      };

      if (hasVariants && selectedVariant) {
        cartItem.variantSize = selectedVariant.size;
        cartItem.variantColor = selectedVariant.color;
        cartItem.sellPrice = selectedVariant.sellPrice;
        const vQty = parseInt(selectedVariant.quantity || 0);
        const vReserved = parseInt(selectedVariant.reserved || 0);
        const vStaffReserved = parseInt(selectedVariant.staffReserved || 0);
        cartItem.maxQuantity = Math.max(0, vQty - vReserved - vStaffReserved);
      } else {
        cartItem.sellPrice = product.sellPrice || product.price || 0;
        const pQty = parseInt(product.quantity || 0);
        const pReserved = parseInt(product.reserved || 0);
        const pStaffReserved = parseInt(product.staffReserved || 0);
        cartItem.maxQuantity = Math.max(0, pQty - pReserved - pStaffReserved);
      }

      await addToCart(user.uid, cartItem, 'staff');
      // Update cart count
      setCartCount(prev => prev + quantity);
      // Dispatch event for other components
      window.dispatchEvent(new Event('staff-cart-updated'));
      closeModal();
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setAddingToCart(false);
    }
  };

  const getAvailableQuantity = () => {
    if (!selectedProduct) return 0;
    const hasVariants = selectedProduct.hasVariants && Array.isArray(selectedProduct.variants);
    if (hasVariants && selectedVariant) {
      const vQty = parseInt(selectedVariant.quantity || 0);
      const vReserved = parseInt(selectedVariant.reserved || 0);
      const vStaffReserved = parseInt(selectedVariant.staffReserved || 0);
      return Math.max(0, vQty - vReserved - vStaffReserved);
    }
    const pQty = parseInt(selectedProduct.quantity || 0);
    const pReserved = parseInt(selectedProduct.reserved || 0);
    const pStaffReserved = parseInt(selectedProduct.staffReserved || 0);
    return Math.max(0, pQty - pReserved - pStaffReserved);
  };

  const getAvailableForStaff = (product) => {
    const qty = parseInt(product.quantity || 0);
    const reserved = parseInt(product.reserved || 0);
    const staffReserved = parseInt(product.staffReserved || 0);
    return Math.max(0, qty - reserved - staffReserved);
  };

  const getStockBadgeClass = (available) => {
    if (available <= 0) return styles.stockOut;
    if (available <= 10) return styles.stockLow;
    return styles.stockIn;
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.hero}>
          <div className={styles.heroBg}></div>
          <div className={styles.heroContent}>
            <h2 className={styles.heroTitle}>Staff Withdrawal Portal</h2>
            <p className={styles.heroSubtitle}>
              Browse inventory, check stock levels, and request equipment withdrawals efficiently.
            </p>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.filtersHeader}>
            <div className={styles.filtersTitleRow}>
              <div className={styles.filtersTitle}>{t('product.all_products') || 'สินค้าทั้งหมด'}</div>
            </div>

            <div className={styles.categoryDropdown} ref={categoryRef}>
              <button
                type="button"
                className={styles.categoryButton}
                onClick={() => setCategoryOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={categoryOpen}
              >
                <span>{categoryFilter ? t(`categories.${categoryFilter}`, categoryFilter) : (t('common.all_categories') || 'ทุกประเภท')}</span>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>keyboard_arrow_down</span>
              </button>

              {categoryOpen && (
                <div className={styles.categoryMenu} role="listbox">
                  <button
                    type="button"
                    className={styles.categoryMenuItem}
                    onClick={() => {
                      setCategoryFilter('');
                      setCurrentPage(1);
                      setCategoryOpen(false);
                    }}
                  >
                    {t('common.all_categories') || 'ทุกประเภท'}
                  </button>
                  {uniqueCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={styles.categoryMenuItem}
                      onClick={() => {
                        setCategoryFilter(cat);
                        setCurrentPage(1);
                        setCategoryOpen(false);
                      }}
                    >
                      {t(`categories.${cat}`, cat)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>{t('common.loading')}</div>
        ) : currentProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            {searchQuery ? t('product.no_products_found') : t('product.no_products')}
          </div>
        ) : (
          <div className={styles.grid}>
            {currentProducts.map((product) => {
              const available = getAvailableForStaff(product);
              const stockClass = getStockBadgeClass(available);
              const canAdd = available > 0;
              return (
                <div
                  key={product.id}
                  className={`${styles.card} ${styles.cardClickable}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => openProductModal(product)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openProductModal(product);
                    }
                  }}
                >
                  <div className={styles.cardImageWrap}>
                    <div className={styles.skuBadge}>SKU: {skuText(product)}</div>
                    {product.image ? (
                      <img className={styles.cardImage} src={product.image} alt={product.productName} />
                    ) : (
                      <div className={styles.cardImageWrap}></div>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <h4 className={styles.cardTitle} title={product.productName}>
                      {product.productName}
                    </h4>
                    <div className={styles.cardMeta}>{product.category || '-'}</div>

                    {product.description && (
                      <div className={styles.cardDescription} title={product.description}>
                        {product.description}
                      </div>
                    )}

                    <div className={styles.cardFooter}>
                      <div className={`${styles.stockBadge} ${stockClass}`}>
                        <span className={styles.stockDot}></span>
                        <span>
                          {available <= 0
                            ? `0 Out of Stock`
                            : available <= 10
                              ? `${available} Low Stock`
                              : `${available} In Stock`}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={`${styles.addButton} ${!canAdd ? styles.addButtonDisabled : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canAdd) openProductModal(product);
                        }}
                        disabled={!canAdd}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={styles.pageButton}
            >
              {t('common.previous')}
            </button>
            <div className={styles.pageInfo}>
              {t('common.page')} {currentPage} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={styles.pageButton}
            >
              {t('common.next')}
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        className={styles.floatingCart}
        onClick={() => navigate('/staff/withdraw')}
      >
        <span className="material-symbols-outlined">shopping_cart</span>
        {cartCount > 0 && (
          <span className={styles.floatingBadge}>{cartCount > 99 ? '99+' : cartCount}</span>
        )}
      </button>

      {/* Variant Selection Modal */}
      {selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={closeModal}>
          <div style={{ background: '#fff', borderRadius: 20, maxWidth: 500, width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e40af' }}>{selectedProduct.productName}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#1e40af' }}>×</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Product Image */}
              <div style={{ height: 200, background: '#f3f4f6', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {selectedProduct.image ? <img src={selectedProduct.image} alt={selectedProduct.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#9ca3af', fontSize: 60 }}>📦</span>}
              </div>

              {selectedProduct.description && (
                <div style={{ marginBottom: 20, padding: '14px 16px', background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                    {t('common.description') || 'คำอธิบายสินค้า'}
                  </div>
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {selectedProduct.description}
                  </div>
                </div>
              )}

              {/* Variant Selection - Button Grid */}
              {selectedProduct.hasVariants && Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0 ? (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#374151' }}>{t('product.select_variant')}:</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                    {selectedProduct.variants.map((variant, idx) => {
                      const vQty = parseInt(variant.quantity || 0);
                      const vReserved = parseInt(variant.reserved || 0);
                      const vStaffReserved = parseInt(variant.staffReserved || 0);
                      const available = Math.max(0, vQty - vReserved - vStaffReserved);
                      const isSelected = selectedVariant === variant;
                      const isOutOfStock = available <= 0;
                      return (
                        <button
                          key={idx}
                          onClick={() => !isOutOfStock && setSelectedVariant(variant)}
                          disabled={isOutOfStock}
                          style={{
                            padding: '12px 10px',
                            borderRadius: 10,
                            border: isSelected ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                            background: isOutOfStock ? '#f3f4f6' : isSelected ? '#eff6ff' : '#fff',
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                            opacity: isOutOfStock ? 0.5 : 1,
                            textAlign: 'center',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: 13, color: isSelected ? '#1e40af' : '#111827' }}>{variant.size}</div>
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{variant.color}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginTop: 6 }}>฿{(variant.sellPrice || 0).toLocaleString()}</div>
                          <div style={{ fontSize: 10, color: isOutOfStock ? '#ef4444' : '#6b7280', marginTop: 4 }}>
                            {isOutOfStock ? t('product.out_of_stock') : `${t('product.remaining')} ${available}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: 20, padding: '16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: '#374151' }}>{t('common.price')}:</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>฿{(selectedProduct.sellPrice || selectedProduct.price || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{t('product.remaining')}:</span>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{getAvailableQuantity()} {selectedProduct.unit || t('common.piece')}</span>
                  </div>
                </div>
              )}

              {/* Selected Variant Info */}
              {selectedVariant && (
                <div style={{ marginBottom: 20, padding: '16px', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: 13, color: '#1e40af', fontWeight: 600, marginBottom: 8 }}>{t('common.selected')}:</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: '#374151' }}>{selectedVariant.size} / {selectedVariant.color}</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>฿{(selectedVariant.sellPrice || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#374151' }}>{t('common.quantity')}:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 40, height: 40, borderRadius: 10, border: '2px solid #e2e8f0', background: '#fff', fontSize: 20, cursor: 'pointer', color: '#374151' }}>-</button>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(getAvailableQuantity(), parseInt(e.target.value) || 1)))} min="1" max={getAvailableQuantity()} style={{ width: 80, padding: '10px', textAlign: 'center', fontSize: 16, fontWeight: 600, border: '2px solid #e2e8f0', borderRadius: 10 }} />
                  <button onClick={() => setQuantity(Math.min(getAvailableQuantity(), quantity + 1))} style={{ width: 40, height: 40, borderRadius: 10, border: '2px solid #e2e8f0', background: '#fff', fontSize: 20, cursor: 'pointer', color: '#374151' }}>+</button>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>/ {getAvailableQuantity()} {selectedProduct.unit || t('common.piece')}</span>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || (selectedProduct.hasVariants && !selectedVariant) || getAvailableQuantity() <= 0}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 12,
                  border: 'none',
                  background: (addingToCart || (selectedProduct.hasVariants && !selectedVariant) || getAvailableQuantity() <= 0) ? '#9ca3af' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: (addingToCart || (selectedProduct.hasVariants && !selectedVariant) || getAvailableQuantity() <= 0) ? 'not-allowed' : 'pointer',
                  boxShadow: (addingToCart || (selectedProduct.hasVariants && !selectedVariant) || getAvailableQuantity() <= 0) ? 'none' : '0 6px 20px rgba(37,99,235,0.4)',
                }}
              >
                {addingToCart ? t('cart.adding_to_cart') : getAvailableQuantity() <= 0 ? t('product.out_of_stock') : `${t('cart.add_to_cart')} (฿${((selectedVariant?.sellPrice || selectedProduct.sellPrice || selectedProduct.price || 0) * quantity).toLocaleString()})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
