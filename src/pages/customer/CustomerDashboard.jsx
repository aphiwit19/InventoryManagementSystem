import { useEffect, useState, useMemo } from 'react';
import { getAllProducts, addToCart, DEFAULT_CATEGORIES } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Variant selection modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await getAllProducts();
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
        cartItem.sellPrice = product.sellPrice || product.price || 0;
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

  return (
    <div style={{ padding: '16px 24px 32px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', padding: '20px 24px', borderRadius: 18, marginBottom: 20, boxShadow: '0 8px 32px rgba(15,23,42,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: '#1e40af', fontSize: 24, fontWeight: 700 }}>{t('product.all_products')}</h1>
          <div style={{ fontSize: 14, color: '#3b82f6', marginTop: 6 }}>{t('product.select_to_add')}</div>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input type="text" placeholder={t('product.search_products')} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} style={{ padding: '10px 40px 10px 16px', borderRadius: 999, border: '2px solid #e2e8f0', fontSize: 14, width: 220, background: '#fff', outline: 'none' }} />
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#3b82f6', fontSize: 16 }}>🔍</span>
          </div>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} style={{ padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 14, background: '#fff', cursor: 'pointer' }}>
            <option value="">{t('common.all_categories')}</option>
            {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 50, background: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>
            <p style={{ color: '#64748b', fontSize: 15 }}>{t('common.loading')}</p>
          </div>
        ) : currentProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50, background: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>
            <p style={{ color: '#64748b', fontSize: 15 }}>{searchTerm ? t('product.no_products_found') : t('product.no_products')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, marginBottom: 24 }}>
            {currentProducts.map((product) => {
            const hasVariants = product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0;
            return (
              <div key={product.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 6px 24px rgba(15,23,42,0.1)', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(15,23,42,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(15,23,42,0.1)'; }}>
                {/* Image */}
                <div style={{ height: 160, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {product.image ? <img src={product.image} alt={product.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#9ca3af', fontSize: 40 }}>📦</span>}
                </div>
                {/* Info */}
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>{product.productName}</h3>
                    {hasVariants && <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 500 }}>{product.variants.length} {t('product.variants')}</span>}
                  </div>
                  {product.description && (
                    <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6b7280', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description}</p>
                  )}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    {product.category && <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{product.category}</span>}
                    <span style={{ background: '#f8fafc', color: '#64748b', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{product.unit || 'ชิ้น'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>{getDisplayPrice(product)}</span>
                    {(() => {
                      const qty = parseInt(product.quantity || 0);
                      const reserved = parseInt(product.reserved || 0);
                      const staffReserved = parseInt(product.staffReserved || 0);
                      const availableForCustomer = Math.max(0, qty - reserved - staffReserved);
                      return (
                        <span style={{ fontSize: 12, color: '#6b7280' }}>
                          {t('product.remaining')}: {availableForCustomer} {product.unit || t('common.piece')}
                        </span>
                      );
                    })()}
                  </div>
                  <button onClick={() => openProductModal(product)} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
                    {t('cart.add_to_cart')}
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} style={{ padding: '10px 18px', border: '2px solid #e2e8f0', borderRadius: 10, background: currentPage === 1 ? '#f1f5f9' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#94a3b8' : '#1e40af', fontSize: 14, fontWeight: 600 }}>{t('common.previous')}</button>
            <span style={{ padding: '10px 16px', fontSize: 14, color: '#374151' }}>{t('common.page')} {currentPage} / {totalPages}</span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} style={{ padding: '10px 18px', border: '2px solid #e2e8f0', borderRadius: 10, background: currentPage === totalPages ? '#f1f5f9' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#94a3b8' : '#1e40af', fontSize: 14, fontWeight: 600 }}>{t('common.next')}</button>
          </div>
        )}
      </div>

      {/* Variant Selection Modal */}
      {selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={closeModal}>
          <div style={{ background: '#fff', borderRadius: 20, maxWidth: 500, width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>{selectedProduct.productName}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Product Image */}
              <div style={{ height: 200, background: '#f3f4f6', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {selectedProduct.image ? <img src={selectedProduct.image} alt={selectedProduct.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#9ca3af', fontSize: 60 }}>📦</span>}
              </div>

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
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#16a34a', marginTop: 6 }}>฿{(variant.sellPrice || 0).toLocaleString()}</div>
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
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>฿{(selectedProduct.sellPrice || selectedProduct.price || 0).toLocaleString()}</span>
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
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>฿{(selectedVariant.sellPrice || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#374151' }}>{t('common.quantity')}:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 40, height: 40, borderRadius: 10, border: '2px solid #e5e7eb', background: '#fff', fontSize: 20, cursor: 'pointer', color: '#374151' }}>-</button>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(getAvailableQuantity(), parseInt(e.target.value) || 1)))} min="1" max={getAvailableQuantity()} style={{ width: 80, padding: '10px', textAlign: 'center', fontSize: 16, fontWeight: 600, border: '2px solid #e5e7eb', borderRadius: 10 }} />
                  <button onClick={() => setQuantity(Math.min(getAvailableQuantity(), quantity + 1))} style={{ width: 40, height: 40, borderRadius: 10, border: '2px solid #e5e7eb', background: '#fff', fontSize: 20, cursor: 'pointer', color: '#374151' }}>+</button>
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
                  background: (addingToCart || (selectedProduct.hasVariants && !selectedVariant) || getAvailableQuantity() <= 0) ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: (addingToCart || (selectedProduct.hasVariants && !selectedVariant) || getAvailableQuantity() <= 0) ? 'not-allowed' : 'pointer',
                  boxShadow: (addingToCart || (selectedProduct.hasVariants && !selectedVariant) || getAvailableQuantity() <= 0) ? 'none' : '0 6px 20px rgba(16,185,129,0.4)',
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
