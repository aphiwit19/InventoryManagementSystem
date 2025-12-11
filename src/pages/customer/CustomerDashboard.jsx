import { useEffect, useState, useMemo } from 'react';
import { getAllProducts, addToCart, DEFAULT_CATEGORIES } from '../../services';
import { useAuth } from '../../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { getEffectivePrice, hasActivePromotion, getDiscountPercentage } from '../../utils/promotionHelper';

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
    }, 5000); // 5 วินาที

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

  return (
    <div style={{ padding: '24px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}>
        {/* Promotion Banner */}
        {(() => {
          const promoProducts = products.filter(p => hasActivePromotion(p));
          if (promoProducts.length === 0) return null;
          
          const featuredPromo = promoProducts[currentPromoIndex % promoProducts.length];
          const discount = getDiscountPercentage(featuredPromo);
          const effectivePrice = getEffectivePrice(featuredPromo);
          const originalPrice = featuredPromo.sellPrice || featuredPromo.price || 0;

          const handlePrev = (e) => {
            e.stopPropagation();
            setCurrentPromoIndex((prev) => (prev - 1 + promoProducts.length) % promoProducts.length);
          };

          const handleNext = (e) => {
            e.stopPropagation();
            setCurrentPromoIndex((prev) => (prev + 1) % promoProducts.length);
          };

          return (
            <section
              onClick={() => openProductModal(featuredPromo)}
              style={{
                background: 'linear-gradient(135deg, #0B1120 0%, #1E3A8A 10%, #2563EB 45%, #0EA5E9 100%)',
                borderRadius: 24,
                padding: '40px',
                marginBottom: '32px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 26px 80px rgba(15,23,42,0.75)',
                minHeight: 280,
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 32px 96px rgba(15,23,42,0.85)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 26px 80px rgba(15,23,42,0.75)';
              }}
            >
              {/* Navigation Arrows - Hidden by default, show on hover */}
              {promoProducts.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="promo-nav-btn"
                    style={{
                      position: 'absolute',
                      left: 20,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      background: 'rgba(255,255,255,0.95)',
                      border: 'none',
                      borderRadius: 12,
                      width: 44,
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#1e40af',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      transition: 'all 0.3s ease',
                      opacity: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.transform = 'translateY(-50%) translateX(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                      e.currentTarget.style.transform = 'translateY(-50%) translateX(0)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={handleNext}
                    className="promo-nav-btn"
                    style={{
                      position: 'absolute',
                      right: 20,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      background: 'rgba(255,255,255,0.95)',
                      border: 'none',
                      borderRadius: 12,
                      width: 44,
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#1e40af',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      transition: 'all 0.3s ease',
                      opacity: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.transform = 'translateY(-50%) translateX(4px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                      e.currentTarget.style.transform = 'translateY(-50%) translateX(0)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                    }}
                  >
                    ›
                  </button>
                  <style>{`
                    section:hover .promo-nav-btn {
                      opacity: 1 !important;
                    }
                  `}</style>

                  {/* Dots Indicator */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 20,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 10,
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    {promoProducts.map((_, index) => (
                      <div
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPromoIndex(index);
                        }}
                        style={{
                          width: index === currentPromoIndex % promoProducts.length ? 24 : 8,
                          height: 8,
                          borderRadius: 4,
                          background: index === currentPromoIndex % promoProducts.length ? '#fff' : 'rgba(255,255,255,0.4)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Decorative blobs */}
              <div
                style={{
                  position: 'absolute',
                  top: '-50%',
                  right: '-10%',
                  width: 400,
                  height: 400,
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, transparent 70%)',
                  borderRadius: '50%',
                  filter: 'blur(50px)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-40%',
                  left: '-10%',
                  width: 360,
                  height: 360,
                  background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, transparent 70%)',
                  borderRadius: '50%',
                  filter: 'blur(50px)',
                }}
              />

              {/* Left: Product Info */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  flex: 1,
                  padding: '18px 22px',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    padding: '8px 18px',
                    borderRadius: 999,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 16,
                    boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
                  }}
                >
                  🔥 SALE {discount}% OFF
                </div>
                <h1
                  style={{
                    fontFamily: 'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
                    fontSize: 36,
                    fontWeight: 800,
                    color: '#ffffff',
                    margin: '0 0 12px',
                    lineHeight: 1.2,
                  }}
                >
                  {featuredPromo.productName}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: '#fbbf24' }}>
                    ฿{effectivePrice.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)', textDecoration: 'line-through' }}>
                    ฿{originalPrice.toLocaleString()}
                  </span>
                </div>
                <p
                  style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: 14,
                    margin: '0 0 20px',
                    lineHeight: 1.6,
                    maxWidth: 400,
                  }}
                >
                  {featuredPromo.description || 'โปรโมชั่นพิเศษ ลดราคาสุดคุ้ม!'}
                </p>
                <button
                  type="button"
                  style={{
                    background: '#ffffff',
                    color: '#2563EB',
                    padding: '12px 30px',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                    letterSpacing: 0.5,
                  }}
                >
                  ซื้อเลย →
                </button>
              </div>

              {/* Right: Product Image */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  width: 350,
                  height: 280,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {featuredPromo.image ? (
                  <img
                    src={featuredPromo.image}
                    alt={featuredPromo.productName}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))',
                    }}
                  />
                ) : (
                  <div style={{ fontSize: 80, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}>
                    📦
                  </div>
                )}
              </div>
            </section>
          );
        })()}

        {/* Original Banner (shown when no promotions) */}
        <section
          style={{
            background:
              'linear-gradient(135deg, #0B1120 0%, #1E3A8A 10%, #2563EB 45%, #0EA5E9 100%)',
            borderRadius: 24,
            padding: '40px',
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 26px 80px rgba(15,23,42,0.75)',
            minHeight: 280,
            display: products.filter(p => hasActivePromotion(p)).length > 0 ? 'none' : 'flex',
            alignItems: 'center',
          }}
        >
          {/* Decorative blobs */}
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: 400,
              height: 400,
              background:
                'radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(50px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-40%',
              left: '-10%',
              width: 360,
              height: 360,
              background:
                'radial-gradient(circle, rgba(118, 75, 162, 0.25) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(50px)',
            }}
          />

          {/* Hero Content */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              maxWidth: '50%',
              padding: '18px 22px',
              borderRadius: 20,
              background:
                'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(30,64,175,0.75))',
              boxShadow:
                '0 18px 55px rgba(15,23,42,0.9), 0 0 0 1px rgba(148,163,184,0.25)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                background:
                  'linear-gradient(135deg, rgba(59,130,246,0.35), rgba(96,165,250,0.6))',
                backdropFilter: 'blur(10px)',
                padding: '8px 18px',
                borderRadius: 999,
                color: '#E5F0FF',
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 16,
              }}
            >
              🎁 โปรโมชั่นพิเศษสำหรับคุณ
            </div>
            <h1
              style={{
                fontFamily: 'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
                fontSize: 40,
                fontWeight: 800,
                color: '#ffffff',
                margin: '0 0 12px',
                lineHeight: 1.1,
              }}
            >
              {(() => {
                const promoProducts = products.filter(p => hasActivePromotion(p));
                if (promoProducts.length > 0) {
                  const maxDiscount = Math.max(...promoProducts.map(p => getDiscountPercentage(p)));
                  return `ลดสูงสุด ${maxDiscount}%`;
                }
                return 'สินค้าคุณภาพ';
              })()}
              <br />
              {(() => {
                const promoProducts = products.filter(p => hasActivePromotion(p));
                return promoProducts.length > 0 ? `${promoProducts.length} รายการ` : 'ราคาพิเศษ';
              })()}
            </h1>
            <p
              style={{
                color: 'rgba(255,255,255,0.95)',
                fontSize: 15,
                margin: '0 0 20px',
                lineHeight: 1.6,
              }}
            >
              {(() => {
                const promoProducts = products.filter(p => hasActivePromotion(p));
                if (promoProducts.length > 0) {
                  return `มีสินค้าโปรโมชั่น ${promoProducts.length} รายการ รอคุณอยู่!`;
                }
                return 'สินค้าคุณภาพดี ราคาเป็นกันเอง';
              })()}
            </p>
            <button
              type="button"
              style={{
                background: '#ffffff',
                color: '#3B82F6',
                padding: '12px 30px',
                border: 'none',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                letterSpacing: 0.5,
              }}
            >
              SHOP NOW ➜
            </button>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: '#ffffff',
                }}
              />
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.4)',
                }}
              />
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.4)',
                }}
              />
            </div>
          </div>

          {/* Illustration block */}
          <div
            style={{
              position: 'absolute',
              right: '8%',
              top: '50%',
              transform: 'translateY(-50%)',
              maxWidth: '38%',
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: '100%',
                paddingTop: '70%',
                borderRadius: 18,
                background:
                  'linear-gradient(135deg, rgba(148, 163, 253, 0.35), rgba(251, 113, 133, 0.5))',
                position: 'relative',
                boxShadow: '0 18px 40px rgba(15,23,42,0.45)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 16,
                  borderRadius: 14,
                  background:
                    'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,64,175,0.95))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#e5e7eb',
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                Inventory
              </div>
            </div>
          </div>
        </section>

        {/* Page Header */}
        <section
          style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
            border: '1px solid #E2E8F0',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: 'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
              fontSize: 24,
              fontWeight: 700,
              color: '#2563EB',
            }}
          >
            {t('product.all_products')}
          </h1>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 14,
              color: '#64748b',
            }}
          >
            {t('product.select_to_add')}
          </p>
        </section>

        {/* Filter Section */}
        <section
          style={{
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '2px solid #E2E8F0',
              fontSize: 14,
              background: '#ffffff',
              cursor: 'pointer',
              minWidth: 180,
            }}
          >
            <option value="">{t('common.all_categories')}</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {t(`categories.${cat}`, cat)}
              </option>
            ))}
          </select>
        </section>

        {/* Products Grid */}
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: 50,
              background: '#ffffff',
              borderRadius: 18,
              boxShadow: '0 2px 12px rgba(15,23,42,0.08)',
              border: '1px solid #E2E8F0',
            }}
          >
            <p style={{ color: '#64748b', fontSize: 15 }}>{t('common.loading')}</p>
          </div>
        ) : currentProducts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 50,
              background: '#ffffff',
              borderRadius: 18,
              boxShadow: '0 2px 12px rgba(15,23,42,0.08)',
              border: '1px solid #E2E8F0',
            }}
          >
            <p style={{ color: '#64748b', fontSize: 15 }}>
              {searchTerm ? t('product.no_products_found') : t('product.no_products')}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 20,
              marginBottom: 24,
            }}
          >
            {currentProducts.map((product) => {
              const hasVariants =
                product.hasVariants &&
                Array.isArray(product.variants) &&
                product.variants.length > 0;
              return (
                <div
                  key={product.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: 16,
                    overflow: 'hidden',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 6px 18px rgba(15,23,42,0.08)',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow =
                      '0 12px 32px rgba(15,23,42,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow =
                      '0 6px 18px rgba(15,23,42,0.08)';
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      position: 'relative',
                      paddingTop: '72%',
                      background: '#F8FAFC',
                      overflow: 'hidden',
                    }}
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.productName}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          maxWidth: '90%',
                          maxHeight: '90%',
                          objectFit: 'contain',
                          transition: 'transform 0.3s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform =
                            'translate(-50%, -50%) scale(1.06)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform =
                            'translate(-50%, -50%)';
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          color: '#9ca3af',
                          fontSize: 40,
                        }}
                      >
                        📦
                      </span>
                    )}

                    {hasActivePromotion(product) && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                          color: '#ffffff',
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          boxShadow: '0 4px 12px rgba(220,38,38,0.4)',
                        }}
                      >
                        🔥 SALE {getDiscountPercentage(product)}%
                      </span>
                    )}

                    {product.category && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          background: '#3B82F6',
                          color: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {product.category}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 6,
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 600,
                          color: '#0F172A',
                          lineHeight: 1.3,
                          maxWidth: '75%',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {product.productName}
                      </h3>
                      {hasVariants && (
                        <span
                          style={{
                            background: '#EEF2FF',
                            color: '#4338CA',
                            padding: '3px 7px',
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          {product.variants.length} {t('product.variants')}
                        </span>
                      )}
                    </div>

                    {product.description && (
                      <p
                        style={{
                          margin: '0 0 10px',
                          fontSize: 12,
                          color: '#64748B',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {product.description}
                      </p>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        gap: 6,
                        marginBottom: 10,
                        flexWrap: 'wrap',
                      }}
                    >
                      {product.category && (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            background: 'rgba(59,130,246,0.08)',
                            color: '#2563EB',
                          }}
                        >
                          {product.category}
                        </span>
                      )}
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          background: '#F8FAFC',
                          color: '#64748B',
                        }}
                      >
                        {product.unit || 'ชิ้น'}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: hasActivePromotion(product) ? '#dc2626' : '#111827',
                            fontFamily:
                              'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
                          }}
                        >
                          {(() => {
                            if (hasActivePromotion(product)) {
                              const effectivePrice = getEffectivePrice(product);
                              return `฿${effectivePrice.toLocaleString()}`;
                            }
                            return getDisplayPrice(product);
                          })()}
                        </span>
                        {hasActivePromotion(product) && !product.hasVariants && (
                          <span style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through' }}>
                            ฿{(product.sellPrice || product.price || 0).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {(() => {
                        const qty = parseInt(product.quantity || 0);
                        const reserved = parseInt(product.reserved || 0);
                        const staffReserved = parseInt(product.staffReserved || 0);
                        const availableForCustomer = Math.max(
                          0,
                          qty - reserved - staffReserved,
                        );
                        return (
                          <span
                            style={{
                              fontSize: 12,
                              color: '#94A3B8',
                            }}
                          >
                            {t('product.remaining')}: {availableForCustomer}{' '}
                            {product.unit || t('common.piece')}
                          </span>
                        );
                      })()}
                    </div>

                    <button
                      onClick={() => openProductModal(product)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: 10,
                        border: 'none',
                        background:
                          'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                        color: '#ffffff',
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 18px rgba(30,64,175,0.45)',
                      }}
                    >
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              marginTop: 20,
            }}
          >
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '10px 18px',
                border: '2px solid #E2E8F0',
                borderRadius: 10,
                background: currentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                color: currentPage === 1 ? '#94A3B8' : '#1E40AF',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {t('common.previous')}
            </button>
            <span
              style={{
                padding: '10px 16px',
                fontSize: 14,
                color: '#374151',
              }}
            >
              {t('common.page')} {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '10px 18px',
                border: '2px solid #E2E8F0',
                borderRadius: 10,
                background:
                  currentPage === totalPages ? '#F1F5F9' : '#FFFFFF',
                cursor:
                  currentPage === totalPages ? 'not-allowed' : 'pointer',
                color: currentPage === totalPages ? '#94A3B8' : '#1E40AF',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {t('common.next')}
            </button>
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
                  background:
                    addingToCart ||
                    (selectedProduct.hasVariants && !selectedVariant) ||
                    getAvailableQuantity() <= 0
                      ? '#9ca3af'
                      : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor:
                    addingToCart ||
                    (selectedProduct.hasVariants && !selectedVariant) ||
                    getAvailableQuantity() <= 0
                      ? 'not-allowed'
                      : 'pointer',
                  boxShadow:
                    addingToCart ||
                    (selectedProduct.hasVariants && !selectedVariant) ||
                    getAvailableQuantity() <= 0
                      ? 'none'
                      : '0 6px 22px rgba(30,64,175,0.5)',
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
