import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { getAllProducts, addToCart as addToCartService, getCart, migrateLocalStorageCart } from "../../services";
import { Link } from "react-router-dom";

export default function StaffDashboard() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  // cart state (loaded from Firebase, used for badge count)
  const [cartItems, setCartItems] = useState([]); // {id, productName, price, quantity, image}

  const [showDetail, setShowDetail] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await getAllProducts();
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Load cart from Firebase and migrate localStorage if needed
  useEffect(() => {
    const loadCart = async () => {
      if (!user?.uid) return;
      try {
        // Try to migrate localStorage cart first (one-time)
        const legacyKey = 'staffCart';
        const perUserKey = `staffCart_${user.uid}`;
        await migrateLocalStorageCart(user.uid, legacyKey, 'staff');
        await migrateLocalStorageCart(user.uid, perUserKey, 'staff');
        
        // Load cart from Firebase
        const cartItems = await getCart(user.uid, 'staff');
        setCartItems(cartItems);
      } catch (error) {
        console.error('Error loading cart:', error);
        setCartItems([]);
      }
    };
    loadCart();
  }, [user?.uid]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts(products);
      setCurrentPage(1);
    } else {
      const filtered = products.filter((product) =>
        product.productName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
      setCurrentPage(1);
    }
  }, [searchTerm, products]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addToCart = async (product) => {
    if (!user?.uid) {
      alert('กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า');
      return;
    }

    const available = Math.max(
      0,
      (product.quantity || 0) -
        (product.reserved || 0) -
        (product.staffReserved || 0)
    );

    if (available <= 0) {
      alert('สินค้าหมดสต็อกสำหรับสตาฟ');
      return;
    }

    try {
      await addToCartService(
        user.uid,
        {
          id: product.id,
          productName: product.productName,
          price: product.price ?? product.costPrice ?? 0,
          quantity: 1,
          image: product.image || null,
          stock: available,
        },
        'staff'
      );

      // reload cart to update badge count
      const updatedCart = await getCart(user.uid, 'staff');
      setCartItems(updatedCart);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('ไม่สามารถเพิ่มสินค้าลงตะกร้าได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Note: Cart management is now handled in WithdrawPage
  // These functions are kept for potential future use

  const cartCount = cartItems.reduce(
    (sum, it) => sum + (it.quantity || 0),
    0
  );

  // no direct checkout here; use WithdrawPage for final confirmation

  return (
    <div style={{ flex: 1, padding: "24px", boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #1D4ED8 0%, #2563EB 35%, #38BDF8 75%, #4F46E5 100%)",
            padding: "18px 24px",
            borderRadius: 20,
            marginBottom: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 14px 32px rgba(15,23,42,0.38)",
            color: "#fff",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                opacity: 0.9,
              }}
            >
              STAFF PANEL
            </div>
            <h1
              style={{
                margin: "4px 0 2px",
                fontSize: 20,
                letterSpacing: "0.03em",
              }}
            >
              รายการสินค้า
            </h1>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              ทำรายการสินค้า
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              position: "relative",
            }}
          >
            {/* Search */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search by name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "8px 32px 8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.4)",
                  background: "rgba(15,23,42,0.4)",
                  color: "#ffffffff",
                  fontSize: 13,
                  width: "240px",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9CA3AF",
                }}
              >
                🔍
              </span>
            </div>
            {/* Cart Icon */}
            <Link
              to="/staff/withdraw"
              style={{
                position: "relative",
                width: 44,
                height: 44,
                backgroundColor: "rgba(255,255,255,0.18)",
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#F9FAFB",
                fontSize: 22,
                textDecoration: "none",
                cursor: "pointer",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.28)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.18)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              🛒
              {cartCount > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    backgroundColor: "#f97316",
                    color: "#fff",
                    borderRadius: 999,
                    minWidth: 18,
                    height: 18,
                    padding: "0 4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: "bold",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
                  }}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </div>
              )}
            </Link>
            {/* Profile Icon Button (like customer) */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowMenu((v) => !v)}
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 24,
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  border: "none",
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.32)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                title={profile?.displayName || user?.email || "Staff"}
                aria-label="profile-menu"
              >
                👤
              </button>
            </div>
            {showMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 10px)",
                  background: "#111827",
                  color: "#F9FAFB",
                  borderRadius: 10,
                  padding: "10px 12px",
                  minWidth: 180,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
                  zIndex: 3000,
                }}
              >
                <div
                  style={{
                    paddingBottom: 8,
                    borderBottom: "1px solid rgba(249,250,251,0.14)",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {profile?.displayName || user?.email || "Staff"}
                  </div>
                </div>
                <Link
                  to="/staff/profile"
                  onClick={() => setShowMenu(false)}
                  style={{
                    display: "block",
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: "rgba(31,41,55,0.9)",
                    color: "#E5E7EB",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 500,
                    textAlign: "center",
                  }}
                >
                  ไปที่โปรไฟล์
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#4B5563" }}>
            <p>Loading products...</p>
          </div>
        ) : currentProducts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              backgroundColor: "#fff",
              borderRadius: 16,
              boxShadow: "0 6px 16px rgba(15,23,42,0.12)",
              marginTop: 12,
            }}
          >
            <p style={{ color: "#9CA3AF", fontSize: 16 }}>
              {searchTerm ? "ไม่พบสินค้าที่ค้นหา" : "ยังไม่มีสินค้า"}
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 20,
                margin: "18px 0 26px",
              }}
            >
            {currentProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  padding: "15px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-5px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
                onClick={() => {
                  setDetailProduct(product);
                  setShowDetail(true);
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "200px",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "8px",
                    marginBottom: "15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.productName}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      display: product.image ? "none" : "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      height: "100%",
                      color: "#999",
                    }}
                  >
                    No Image
                  </div>
                </div>
                <h3
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "18px",
                    color: "#333",
                    fontWeight: "bold",
                  }}
                >
                  {product.productName || "Unnamed Product"}
                </h3>
                {product.purchaseLocation && (
                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
                    แหล่งที่ซื้อ: {product.purchaseLocation}
                  </div>
                )}
                <p
                  title={product.description || "ไม่มีคำอธิบาย"}
                  style={{
                    margin: "0 0 10px 0",
                    fontSize: "12px",
                    color: "#666",
                    height: "36px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {product.description || "ไม่มีคำอธิบาย"}
                </p>
                <div
                  style={{
                    backgroundColor: "#e8f5e9",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    marginBottom: "10px",
                    fontSize: "14px",
                    color: "#2e7d32",
                    fontWeight: "500",
                  }}
                >
                  คงเหลือพร้อมขาย:{" "}
                  {Math.max(
                    0,
                    (product.quantity || 0) - (product.reserved || 0) - (product.staffReserved || 0)
                  )}{" "}
                  ชิ้น
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "10px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#4CAF50",
                    }}
                  >
                    ฿
                    {(product.price ?? product.costPrice ?? 0).toLocaleString()}
                  </span>
                  <button
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#673AB7",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                  >
                    เพิ่มลงตะกร้า
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Product Detail Modal */}
          {showDetail && detailProduct && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2100,
                padding: 20,
              }}
              onClick={() => setShowDetail(false)}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  width: 640,
                  maxWidth: "100%",
                  padding: 20,
                  display: "grid",
                  gridTemplateColumns: "1fr 1.2fr",
                  gap: 16,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    width: "100%",
                    height: 280,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 8,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {detailProduct.image ? (
                    <img
                      src={detailProduct.image}
                      alt={detailProduct.productName}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span style={{ color: "#999" }}>No Image</span>
                  )}
                </div>
                <div>
                  <h2 style={{ marginTop: 0 }}>
                    {detailProduct.productName || "Unnamed Product"}
                  </h2>
                  {detailProduct.purchaseLocation && (
                    <div style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 8px" }}>
                      แหล่งที่ซื้อ: {detailProduct.purchaseLocation}
                    </div>
                  )}
                  <p style={{ color: "#666", whiteSpace: "pre-wrap" }}>
                    {detailProduct.description || "ไม่มีคำอธิบาย"}
                  </p>
                  <div
                    style={{
                      background: "#e8f5e9",
                      color: "#2e7d32",
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontWeight: 500,
                      marginTop: 8,
                    }}
                  >
                    คงเหลือพร้อมขาย:{" "}
                    {Math.max(
                      0,
                      (detailProduct.quantity || 0) -
                        (detailProduct.reserved || 0) -
                        (detailProduct.staffReserved || 0)
                    )}{" "}
                    ชิ้น
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 12,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: "bold",
                        color: "#4CAF50",
                      }}
                    >
                      ฿
                      {(
                        detailProduct.price ??
                        detailProduct.costPrice ??
                        0
                      ).toLocaleString()}
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => {
                          setShowDetail(false);
                          addToCart(detailProduct);
                        }}
                        style={{
                          padding: "8px 14px",
                          background: "#673AB7",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        เพิ่มลงตะกร้า
                      </button>
                      <button
                        onClick={() => setShowDetail(false)}
                        style={{
                          padding: "8px 14px",
                          background: "#6c757d",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
                padding: "20px",
                backgroundColor: "#fff",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  backgroundColor: currentPage === 1 ? "#f5f5f5" : "#fff",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  color: currentPage === 1 ? "#999" : "#333",
                }}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    backgroundColor: currentPage === page ? "#4CAF50" : "#fff",
                    color: currentPage === page ? "white" : "#333",
                    cursor: "pointer",
                    fontWeight: currentPage === page ? "bold" : "normal",
                  }}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  backgroundColor: currentPage === totalPages ? "#f5f5f5" : "#fff",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  color: currentPage === totalPages ? "#999" : "#333",
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
  );
}
