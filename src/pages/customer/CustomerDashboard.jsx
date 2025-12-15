import { useEffect, useState, useMemo } from 'react';
import { getAllProducts, addToCart, DEFAULT_CATEGORIES } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getEffectivePrice, hasActivePromotion, getDiscountPercentage } from '../../utils/promotionHelper';
import styles from './CustomerDashboard.module.css';

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Variant selection modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // Promotion slider
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  // Auto slide promotion banner every 5 seconds
  useEffect(() => {
    const promoProducts = products.filter(p => hasActivePromotion(p));
    if (promoProducts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promoProducts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [products]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await getAllProducts();
        console.log('Loaded products:', productsData);
        
        // Check promotion data
        productsData.forEach(p => {
          if (p.productName?.includes('หูฟัง')) {
            console.log('หูฟัง product:', p);
            console.log('Has promotion?', p.promotion);
            console.log('Is active?', hasActivePromotion(p));
          }
        });
        
        // Filter only products that still have available stock for customers
        const available = productsData.filter(p => {
          const qty = parseInt(p.quantity || 0);
          const reserved = parseInt(p.reserved || 0);
          const staffReserved = parseInt(p.staffReserved || 0);
          const availableForCustomer = qty - reserved - staffReserved;
          return availableForCustomer > 0;
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

  const uniqueCategories = useMemo(() => {
    const cats = products.map(p => p.category).filter(c => c && c.trim() !== '');
    return [...new Set([...DEFAULT_CATEGORIES, ...cats])].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(product =>
        product.productName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }
    return filtered;
  }, [products, searchTerm, categoryFilter]);

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
        // Use promotion price if active
        cartItem.sellPrice = getEffectivePrice(product);
        const pQty = parseInt(product.quantity || 0);
        const pReserved = parseInt(product.reserved || 0);
        const pStaffReserved = parseInt(product.staffReserved || 0);
        cartItem.maxQuantity = Math.max(0, pQty - pReserved - pStaffReserved);
      }

      await addToCart(user.uid, cartItem);
      window.dispatchEvent(new Event('customer-cart-updated'));
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

  const getDisplayPrice = (product) => {
    const hasVariants = product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0;
    if (hasVariants) {
      const prices = product.variants.map(v => v.sellPrice || 0);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max ? `฿${min.toLocaleString()}` : `฿${min.toLocaleString()} - ฿${max.toLocaleString()}`;
    }
    return `฿${(product.sellPrice || product.price || 0).toLocaleString()}`;
  };

  const promoProducts = products.filter(p => hasActivePromotion(p));

  return (
    <div>
      {/* Promo Banner */}
      {promoProducts.length > 0 && (() => {
        const featuredPromo = promoProducts[currentPromoIndex % promoProducts.length];
        const discount = getDiscountPercentage(featuredPromo);
        const effectivePrice = getEffectivePrice(featuredPromo);
        const originalPrice = featuredPromo.sellPrice || featuredPromo.price || 0;

        return (
          <div 
            className={styles.promoBanner}
            onClick={() => openProductModal(featuredPromo)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.promoBannerInner}>
              <div 
                className={styles.promoBannerImage}
                style={{ backgroundImage: featuredPromo.image ? `url('${featuredPromo.image}')` : 'none' }}
              >
                <div className={styles.promoBannerImageOverlay} />
              </div>
              <div className={styles.promoBannerContent}>
                <div className={styles.promoBadge}>
                  <span className={`material-symbols-outlined ${styles.promoBadgeIcon}`}>bolt</span>
                  <span className={styles.promoBadgeText}>🔥 SALE {discount}% OFF</span>
                </div>
                <h2 className={styles.promoTitle}>{featuredPromo.productName}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#135bec' }}>
                    ฿{effectivePrice.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '1rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                    ฿{originalPrice.toLocaleString()}
                  </span>
                </div>
                <p className={styles.promoDescription}>
                  {featuredPromo.description || 'โปรโมชั่นพิเศษ ลดราคาสุดคุ้ม!'}
                </p>
                <button className={styles.promoButton}>
                  Buy Now
                  <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Section Header */}
      <div className={styles.sectionHeader} style={{ marginTop: promoProducts.length > 0 ? '1.5rem' : 0 }}>
        <h1 className={styles.sectionTitle}>{t('product.all_products') || 'Featured Products'}</h1>
        <div className={styles.sectionActions}>
          <button className={styles.filterButton}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>filter_list</span>
            {t('common.filters') || 'Filters'}
          </button>
          <div style={{ position: 'relative' }}>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.sortButton}
              style={{ appearance: 'none', paddingRight: '2rem' }}
            >
              <option value="">{t('common.all_categories') || 'All Categories'}</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`categories.${cat}`, cat)}
                </option>
              ))}
            </select>
            <span 
              className="material-symbols-outlined" 
              style={{ 
                position: 'absolute', 
                right: '0.75rem', 
                top: '50%', 
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                fontSize: '1.25rem',
                color: 'white'
              }}
            >
              keyboard_arrow_down
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tags */}
      {categoryFilter && (
        <div className={styles.filterTags}>
          <button className={`${styles.filterTag} ${styles.filterTagActive}`}>
            {categoryFilter}
            <span 
              className="material-symbols-outlined" 
              style={{ fontSize: '1rem' }}
              onClick={(e) => {
                e.stopPropagation();
                setCategoryFilter('');
              }}
            >
              close
            </span>
          </button>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className={styles.loadingState}>
          <p className={styles.loadingText}>{t('common.loading')}</p>
        </div>
      ) : currentProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>
            {searchTerm ? t('product.no_products_found') : t('product.no_products')}
          </p>
        </div>
      ) : (
        <div className={styles.productsGrid}>
          {currentProducts.map((product) => {
            const hasVariants = product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0;
            const qty = parseInt(product.quantity || 0);
            const reserved = parseInt(product.reserved || 0);
            const staffReserved = parseInt(product.staffReserved || 0);
            const availableForCustomer = Math.max(0, qty - reserved - staffReserved);
            const isOutOfStock = availableForCustomer <= 0;
            const isLowStock = availableForCustomer > 0 && availableForCustomer <= 5;
            const isPromo = hasActivePromotion(product);

            return (
              <div
                key={product.id}
                className={`${styles.productCard} ${isOutOfStock ? styles.productCardOutOfStock : ''}`}
              >
                {/* Image */}
                <div className={styles.productImageWrapper}>
                  {isPromo && (
                    <span className={`${styles.productBadge} ${styles.productBadgeSale}`}>
                      -{getDiscountPercentage(product)}%
                    </span>
                  )}
                  
                  {isOutOfStock && (
                    <div className={styles.outOfStockOverlay}>
                      <span className={styles.outOfStockBadge}>{t('product.out_of_stock') || 'Out of Stock'}</span>
                    </div>
                  )}
                  
                  <div
                    className={`${styles.productImage} ${isOutOfStock ? styles.productImageGrayscale : ''}`}
                    style={{ 
                      backgroundImage: product.image ? `url('${product.image}')` : 'none',
                      backgroundColor: !product.image ? '#f3f4f6' : undefined
                    }}
                  />
                  
                  {!isOutOfStock && (
                    <button className={styles.favoriteButton}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>favorite</span>
                    </button>
                  )}
                </div>

                {/* Info */}
                <div className={styles.productInfo}>
                  <div className={styles.productCategory}>{product.category || 'General'}</div>
                  <h3 className={styles.productName}>
                    {product.productName}
                    {hasVariants && (
                      <span className={styles.productNameThai}>
                        ({product.variants.length} {t('product.variants') || 'variants'})
                      </span>
                    )}
                  </h3>
                  
                  {/* Description */}
                  {product.description && (
                    <p className={styles.productDescription}>
                      {product.description}
                    </p>
                  )}
                  
                  <div className={styles.productPriceRow}>
                    <span className={styles.productPrice}>
                      {isPromo ? `฿${getEffectivePrice(product).toLocaleString()}` : getDisplayPrice(product)}
                    </span>
                    {isPromo && !hasVariants && (
                      <span className={styles.productPriceOriginal}>
                        ฿{(product.sellPrice || product.price || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  <div className={`${styles.productStock} ${
                    isOutOfStock ? styles.productStockOutOfStock : 
                    isLowStock ? styles.productStockLowStock : 
                    styles.productStockInStock
                  }`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>
                      {isOutOfStock ? 'cancel' : isLowStock ? 'warning' : 'check_circle'}
                    </span>
                    {isOutOfStock 
                      ? (t('product.out_of_stock') || 'Out of Stock')
                      : isLowStock 
                        ? `${t('product.low_stock') || 'Low Stock'} (${availableForCustomer} ${product.unit || t('common.piece') || 'units'})`
                        : `${t('product.in_stock') || 'In Stock'} (${availableForCustomer} ${product.unit || t('common.piece') || 'units'})`
                    }
                  </div>
                  
                  {isOutOfStock ? (
                    <button className={styles.notifyMeButton} disabled>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>notifications</span>
                      {t('product.notify_me') || 'Notify Me'}
                    </button>
                  ) : (
                    <button 
                      className={styles.addToCartButton}
                      onClick={() => openProductModal(product)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>add_shopping_cart</span>
                      {t('cart.add_to_cart') || 'Add to Cart'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.paginationButton}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            {t('common.previous') || 'Previous'}
          </button>
          <span style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: '#374151' }}>
            {t('common.page') || 'Page'} {currentPage} / {totalPages}
          </span>
          <button
            className={styles.paginationButton}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {t('common.next') || 'Next'}
          </button>
        </div>
      )}


      {/* Variant Selection Modal */}
      {selectedProduct && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{selectedProduct.productName}</h2>
              <button className={styles.modalCloseButton} onClick={closeModal}>×</button>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              {/* Product Image */}
              <div className={styles.modalProductImage}>
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} alt={selectedProduct.productName} />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: 60, color: '#9ca3af' }}>
                    inventory_2
                  </span>
                )}
              </div>

              {/* Variant Selection */}
              {selectedProduct.hasVariants && Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0 ? (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                    {t('product.select_variant') || 'Select Variant'}:
                  </h3>
                  <div className={styles.variantGrid}>
                    {selectedProduct.variants.map((variant, idx) => {
                      const vQty = parseInt(variant.quantity || 0);
                      const vReserved = parseInt(variant.reserved || 0);
                      const vStaffReserved = parseInt(variant.staffReserved || 0);
                      const available = Math.max(0, vQty - vReserved - vStaffReserved);
                      const isSelected = selectedVariant === variant;
                      const isVarOutOfStock = available <= 0;
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => !isVarOutOfStock && setSelectedVariant(variant)}
                          disabled={isVarOutOfStock}
                          className={`${styles.variantButton} ${isSelected ? styles.variantButtonSelected : ''}`}
                        >
                          <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: isSelected ? '#1e40af' : '#111827' }}>
                            {variant.size}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                            {variant.color}
                          </div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', marginTop: '0.375rem' }}>
                            ฿{(variant.sellPrice || 0).toLocaleString()}
                          </div>
                          <div style={{ fontSize: '0.625rem', color: isVarOutOfStock ? '#ef4444' : '#6b7280', marginTop: '0.25rem' }}>
                            {isVarOutOfStock ? (t('product.out_of_stock') || 'Out of Stock') : `${t('product.remaining') || 'Remaining'} ${available}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={styles.priceInfoBox}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: '#374151' }}>{t('common.price') || 'Price'}:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
                      ฿{getEffectivePrice(selectedProduct).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{t('product.remaining') || 'Remaining'}:</span>
                    <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                      {getAvailableQuantity()} {selectedProduct.unit || t('common.piece') || 'units'}
                    </span>
                  </div>
                </div>
              )}

              {/* Selected Variant Info */}
              {selectedVariant && (
                <div className={styles.selectedVariantBox}>
                  <div style={{ fontSize: '0.8125rem', color: '#1e40af', fontWeight: 600, marginBottom: '0.5rem' }}>
                    {t('common.selected') || 'Selected'}:
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                      {selectedVariant.size} / {selectedVariant.color}
                    </span>
                    <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
                      ฿{(selectedVariant.sellPrice || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                  {t('common.quantity') || 'Quantity'}:
                </label>
                <div className={styles.quantityControl}>
                  <button 
                    className={styles.quantityButton}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Math.max(1, Math.min(getAvailableQuantity(), parseInt(e.target.value) || 1)))} 
                    min="1" 
                    max={getAvailableQuantity()} 
                    className={styles.quantityInput}
                  />
                  <button 
                    className={styles.quantityButton}
                    onClick={() => setQuantity(Math.min(getAvailableQuantity(), quantity + 1))}
                  >
                    +
                  </button>
                  <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                    / {getAvailableQuantity()} {selectedProduct.unit || t('common.piece') || 'units'}
                  </span>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || (selectedProduct.hasVariants && !selectedVariant) || getAvailableQuantity() <= 0}
                className={styles.addToCartModalButton}
              >
                {addingToCart 
                  ? (t('cart.adding_to_cart') || 'Adding...') 
                  : getAvailableQuantity() <= 0 
                    ? (t('product.out_of_stock') || 'Out of Stock') 
                    : `${t('cart.add_to_cart') || 'Add to Cart'} (฿${((selectedVariant?.sellPrice || getEffectivePrice(selectedProduct)) * quantity).toLocaleString()})`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
