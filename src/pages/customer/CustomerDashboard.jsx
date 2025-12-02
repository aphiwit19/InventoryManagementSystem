import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../auth/AuthContext';
import { getAllProducts, addToCart as addToCartService, migrateLocalStorageCart, getCart } from '../../services';
import { Link, useNavigate } from 'react-router-dom';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [showQtyPrompt, setShowQtyPrompt] = useState(false);
  const [promptProduct, setPromptProduct] = useState(null);
  const [promptQty, setPromptQty] = useState('1');
  const [showDetail, setShowDetail] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [cartLoading, setCartLoading] = useState({}); // { productId: true/false }
  const [cartError, setCartError] = useState('');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await getAllProducts();
        setProducts(productsData);
        setFilteredProducts(productsData);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Migrate localStorage cart to Firebase and load cart count
  useEffect(() => {
    const loadCartData = async () => {
      if (!user?.uid) return;
      try {
        // Try to migrate from both legacy and per-user localStorage keys
        const legacyKey = 'customerCart';
        const perUserKey = `customerCart_${user.uid}`;
        
        // Try legacy first
        await migrateLocalStorageCart(user.uid, legacyKey, 'customer');
        // Try per-user key
        await migrateLocalStorageCart(user.uid, perUserKey, 'customer');
        
        // Load cart count
        const cartItems = await getCart(user.uid, 'customer');
        const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        setCartCount(totalItems);
      } catch (error) {
        console.warn('Cart migration/load failed:', error);
      }
    };
    loadCartData();
  }, [user?.uid]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
      setCurrentPage(1);
    } else {
      const filtered = products.filter(p => p.productName?.toLowerCase().includes(searchTerm.toLowerCase()));
      setFilteredProducts(filtered);
      setCurrentPage(1);
    }
  }, [searchTerm, products]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const addToCartDirectly = async (product) => {
    if (!user?.uid) {
      alert('กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า');
      return;
    }
    
    const available = Math.max(0, (product.quantity || 0) - (product.reserved || 0));
    if (available <= 0) {
      alert('สินค้าหมดสต็อก');
      return;
    }
    
    // Set loading state for this specific product
    setCartLoading(prev => ({ ...prev, [product.id]: true }));
    
    try {
      await addToCartService(user.uid, {
        id: product.id,
        productName: product.productName,
        price: product.price ?? product.costPrice ?? 0,
        quantity: 1,
        image: product.image || null,
        stock: available
      }, 'customer');
      
      // Update cart count
      const cartItems = await getCart(user.uid, 'customer');
      const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      setCartCount(totalItems);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('ไม่สามารถเพิ่มสินค้าลงตะกร้าได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      // Clear loading state for this specific product
      setCartLoading(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const openQtyPrompt = (product) => {
    setPromptProduct(product);
    setPromptQty('1');
    setShowQtyPrompt(true);
  };

  const confirmAddToCart = async () => {
    if (!promptProduct || !user?.uid) {
      alert('กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า');
      return;
    }
    const available = Math.max(0, (promptProduct.quantity || 0) - (promptProduct.reserved || 0));
    const qty = Math.max(1, Math.min(parseInt(promptQty || 1), available));
    
    setCartLoading(true);
    setCartError('');
    try {
      await addToCartService(user.uid, {
        id: promptProduct.id,
        productName: promptProduct.productName,
        price: promptProduct.price ?? promptProduct.costPrice ?? 0,
        quantity: qty,
        image: promptProduct.image || null,
        stock: available
      }, 'customer');
      
      // Update cart count
      const cartItems = await getCart(user.uid, 'customer');
      const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      setCartCount(totalItems);
      
      setShowQtyPrompt(false);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setCartError('ไม่สามารถเพิ่มสินค้าลงตะกร้าได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setCartLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      style={{
        padding: 0,
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, #ffffff 0%, #e5f0ff 40%, #d6e4ff 70%, #c7d2fe 100%)'
      }}
    >
      {/* Top Header - Blue Rounded Bar */}
      <div style={{ padding: '24px 24px 14px', display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: '100%',
            maxWidth: 1200,
            background:
              'linear-gradient(135deg, #1D4ED8 0%, #2563EB 35%, #1D9BF0 70%, #4F46E5 100%)',
            padding: '22px 36px',
            borderRadius: '24px',
            boxShadow: '0 14px 36px rgba(15,23,42,0.35)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Left: Logo and Store Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '26px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.18)'
                }}
              >
                🏪
              </div>
              <div>
                <div
                  style={{
                    color: '#fff',
                    fontSize: '26px',
                    fontWeight: '800',
                    marginBottom: 4,
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  ร้านค้าออนไลน์
                </div>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: 13,
                    fontWeight: 400
                  }}
                >
                  สินค้าคุณภาพ ราคาย่อมเยา
                </div>
              </div>
            </div>

            {/* Right: Cart, Profile, Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
              {/* Cart Icon */}
              <Link
                to="/customer/withdraw"
                style={{
                  position: 'relative',
                  width: '44px',
                  height: '44px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '22px',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                🛒
                {cartCount > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      backgroundColor: '#f97316',
                      color: '#fff',
                      borderRadius: '999px',
                      minWidth: 20,
                      height: 20,
                      padding: '0 4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 'bold',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </div>
                )}
              </Link>

              {/* Profile Icon + Menu */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowMenu((prev) => !prev)}
                  style={{
                    width: '44px',
                    height: '44px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: 'none',
                    padding: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  👤
                </button>
                {showMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      marginTop: 8,
                      background: '#fff',
                      borderRadius: 12,
                      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                      minWidth: 160,
                      zIndex: 2100,
                      overflow: 'hidden'
                    }}
                  >
                    <Link
                      to="/customer/profile"
                      onClick={() => setShowMenu(false)}
                      style={{
                        display: 'block',
                        padding: '10px 14px',
                        fontSize: 14,
                        color: '#111827',
                        textDecoration: 'none',
                        borderBottom: '1px solid #e5e7eb'
                      }}
                    >
                      โปรไฟล์
                    </Link>
                    <Link
                      to="/customer/orders"
                      onClick={() => setShowMenu(false)}
                      style={{
                        display: 'block',
                        padding: '10px 14px',
                        fontSize: 14,
                        color: '#111827',
                        textDecoration: 'none'
                      }}
                    >
                      ติดตามสถานะ
                    </Link>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={() => signOut(auth)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  border: 'none',
                  borderRadius: '999px',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                }}
              >
                <span>🚪</span>
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 24px 26px' }}>
        <div
          style={{
            width: '100%',
            maxWidth: 1200,
            backgroundColor: '#fff',
            padding: '18px 26px 22px',
            borderRadius: '20px',
            boxShadow: '0 8px 20px rgba(15,23,42,0.12)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}
          >
            <span style={{ fontSize: '20px' }}>🔍</span>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>ค้นหาสินค้า</span>
          </div>
          <input
            type="text"
            placeholder="พิมพ์ชื่อสินค้า หรือคำที่เกี่ยวข้อง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 18px',
              fontSize: 15,
              border: '2px solid #e5e7eb',
              borderRadius: '999px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4A90E2';
              e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.3)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Products Grid */}
      <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1200 }}>
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#fff',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(15,23,42,0.08)'
            }}
          >
            <p>กำลังโหลดสินค้า...</p>
          </div>
        ) : currentProducts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#fff',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(15,23,42,0.08)'
            }}
          >
            <p style={{ color: '#999', fontSize: '18px' }}>
              {searchTerm ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีสินค้า'}
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 20,
                marginBottom: 30
              }}
            >
              {currentProducts.map((product) => (
                <div
                  key={product.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '18px',
                    padding: '14px 14px 12px',
                    boxShadow: '0 10px 25px rgba(15,23,42,0.18)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  onClick={() => {
                    setDetailProduct(product);
                    setShowDetail(true);
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: 200,
                      backgroundColor: '#f3f4f6',
                      borderRadius: '14px',
                      marginBottom: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.productName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        display: product.image ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        color: '#999'
                      }}
                    >
                      No Image
                    </div>
                  </div>
                  <h3
                    style={{
                      margin: '0 0 6px 0',
                      fontSize: 17,
                      color: '#111827',
                      fontWeight: 700
                    }}
                  >
                    {product.productName || 'Unnamed Product'}
                  </h3>
                  {product.purchaseLocation && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                      แหล่งที่ซื้อ: {product.purchaseLocation}
                    </div>
                  )}
                  <p
                    style={{
                      margin: '0 0 10px 0',
                      fontSize: 12,
                      color: '#6b7280',
                      height: 36,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {product.description || 'ไม่มีคำอธิบาย'}
                  </p>
                  <div
                    style={{
                      backgroundColor: '#e8f5e9',
                      padding: '6px 10px',
                      borderRadius: 999,
                      marginBottom: 10,
                      fontSize: 12,
                      color: '#15803d',
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    คงเหลือพร้อมขาย: {Math.max(0, (product.quantity || 0) - (product.reserved || 0))} ชิ้น
                  </div>
                  <div
                    style={{
                      marginTop: 'auto',
                      marginLeft: -14,
                      marginRight: -14,
                      padding: '10px 16px 8px',
                      borderRadius: '0 0 18px 18px',
                      background:
                        'linear-gradient(90deg, #1D4ED8 0%, #2563EB 50%, #4F46E5 100%)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      columnGap: 8
                    }}
                  >
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#fff',
                        textShadow: '0 1px 2px rgba(15,23,42,0.5)'
                      }}
                    >
                      ฿{(product.price ?? product.costPrice ?? 0).toLocaleString()}
                    </span>
                    <button
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#ffffff',
                        color: '#1D4ED8',
                        border: 'none',
                        borderRadius: 999,
                        cursor: cartLoading[product.id] ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        opacity: cartLoading[product.id] ? 0.7 : 1,
                        boxShadow: '0 2px 6px rgba(15,23,42,0.25)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCartDirectly(product);
                      }}
                      disabled={
                        cartLoading[product.id] ||
                        Math.max(0, (product.quantity || 0) - (product.reserved || 0)) <= 0
                      }
                    >
                      {cartLoading[product.id] ? 'กำลังเพิ่ม...' : 'เพิ่มลงตะกร้า'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 10,
                  padding: 20,
                  backgroundColor: '#fff',
                  borderRadius: 999,
                  boxShadow: '0 4px 10px rgba(15,23,42,0.15)'
                }}
              >
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: currentPage === 1 ? '#f5f5f5' : '#fff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    color: currentPage === 1 ? '#999' : '#333'
                  }}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      backgroundColor: currentPage === page ? '#4CAF50' : '#fff',
                      color: currentPage === page ? 'white' : '#333',
                      cursor: 'pointer',
                      fontWeight: currentPage === page ? 'bold' : 'normal'
                    }}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: currentPage === totalPages ? '#f5f5f5' : '#fff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    color: currentPage === totalPages ? '#999' : '#333'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {showDetail && detailProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2100,
            padding: 20
          }}
          onClick={() => setShowDetail(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              width: 640,
              maxWidth: '100%',
              padding: 20,
              display: 'grid',
              gridTemplateColumns: '1fr 1.2fr',
              gap: 16
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '100%',
                height: 280,
                background: '#f0f0f0',
                borderRadius: 8,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {detailProduct.image ? (
                <img
                  src={detailProduct.image}
                  alt={detailProduct.productName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ color: '#999' }}>No Image</span>
              )}
            </div>
            <div>
              <h2 style={{ marginTop: 0 }}>{detailProduct.productName || 'Unnamed Product'}</h2>
              {detailProduct.purchaseLocation && (
                <div
                  style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    margin: '4px 0 8px'
                  }}
                >
                  แหล่งที่ซื้อ: {detailProduct.purchaseLocation}
                </div>
              )}
              <p style={{ color: '#666', whiteSpace: 'pre-wrap' }}>
                {detailProduct.description || 'ไม่มีคำอธิบาย'}
              </p>
              <div
                style={{
                  background: '#e8f5e9',
                  color: '#2e7d32',
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontWeight: 500,
                  marginTop: 8
                }}
              >
                คงเหลือพร้อมขาย:{' '}
                {Math.max(
                  0,
                  (detailProduct.quantity || 0) - (detailProduct.reserved || 0)
                )}{' '}
                ชิ้น
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 12
                }}
              >
                <span
                  style={{ fontSize: 22, fontWeight: 'bold', color: '#4CAF50' }}
                >
                  ฿{(detailProduct.price ?? detailProduct.costPrice ?? 0).toLocaleString()}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      setShowDetail(false);
                      addToCartDirectly(detailProduct);
                    }}
                    disabled={
                      cartLoading[detailProduct?.id] ||
                      Math.max(
                        0,
                        (detailProduct.quantity || 0) -
                          (detailProduct.reserved || 0)
                      ) <= 0
                    }
                    style={{
                      padding: '8px 14px',
                      background: cartLoading[detailProduct?.id]
                        ? '#ccc'
                        : '#673AB7',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: cartLoading[detailProduct?.id]
                        ? 'not-allowed'
                        : 'pointer',
                      opacity: cartLoading[detailProduct?.id] ? 0.6 : 1
                    }}
                  >
                    {cartLoading[detailProduct?.id]
                      ? 'กำลังเพิ่ม...'
                      : 'เพิ่มลงตะกร้า'}
                  </button>
                  <button
                    onClick={() => setShowDetail(false)}
                    style={{
                      padding: '8px 14px',
                      background: '#6c757d',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer'
                    }}
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quantity Prompt Modal */}
      {showQtyPrompt && promptProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 20
          }}
          onClick={() => setShowQtyPrompt(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              width: 420,
              maxWidth: '100%',
              padding: 20
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>ระบุจำนวนสินค้า</h3>
            <p style={{ marginTop: 0, color: '#666' }}>{promptProduct.productName}</p>
            <input
              type="number"
              min={1}
              max={Math.max(
                0,
                (promptProduct.quantity || 0) - (promptProduct.reserved || 0)
              )}
              value={promptQty}
              onChange={(e) => setPromptQty(e.target.value)}
              disabled={cartLoading}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 8
              }}
            />
            {cartError && (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px',
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  borderRadius: 8,
                  fontSize: '14px'
                }}
              >
                {cartError}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
                marginTop: 16
              }}
            >
              <button
                onClick={() => {
                  setShowQtyPrompt(false);
                  setCartError('');
                }}
                disabled={cartLoading}
                style={{
                  padding: '10px 16px',
                  background: cartLoading ? '#ccc' : '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: cartLoading ? 'not-allowed' : 'pointer'
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmAddToCart}
                disabled={cartLoading}
                style={{
                  padding: '10px 16px',
                  background: cartLoading ? '#ccc' : '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: cartLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                {cartLoading ? 'กำลังเพิ่ม...' : 'เพิ่มลงตะกร้า'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

