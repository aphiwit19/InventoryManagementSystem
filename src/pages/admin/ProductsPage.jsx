import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { getAllProducts, deleteProduct, updateProductQuantity } from '../../server/products';
import { Link } from 'react-router-dom';

export default function ProductsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantityChange, setQuantityChange] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await getAllProducts();
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
      setCurrentPage(1);
    } else {
      const filtered = products.filter(product =>
        product.productName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
      setCurrentPage(1);
    }
  }, [searchTerm, products]);

  // คำนวณ pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบสินค้า "${productName}"?`)) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteProduct(productId);
      // Reload products
      const productsData = await getAllProducts();
      setProducts(productsData);
      setFilteredProducts(productsData);
      alert('ลบสินค้าสำเร็จ!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('เกิดข้อผิดพลาดในการลบสินค้า: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenQuantityModal = (product) => {
    setSelectedProduct(product);
    setQuantityChange('');
    setShowQuantityModal(true);
  };

  const handleUpdateQuantity = async () => {
    if (!quantityChange || parseInt(quantityChange) <= 0) {
      alert('กรุณากรอกจำนวนสินค้าที่ต้องการเพิ่ม');
      return;
    }

    setIsUpdating(true);
    try {
      await updateProductQuantity(selectedProduct.id, quantityChange, true);
      // Reload products
      const productsData = await getAllProducts();
      setProducts(productsData);
      setFilteredProducts(productsData);
      setShowQuantityModal(false);
      setSelectedProduct(null);
      setQuantityChange('');
      alert('อัพเดตจำนวนสินค้าสำเร็จ!');
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('เกิดข้อผิดพลาดในการอัพเดตจำนวนสินค้า: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('th-TH');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        backgroundColor: '#fff',
        padding: '20px',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <h2 style={{ marginBottom: '30px', color: '#333' }}>Admin Panel</h2>
        <Link
          to="/admin/dashboard"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#4CAF50',
            color: 'white',
            textDecoration: 'none',
            display: 'block',
            fontWeight: 'bold'
          }}
        >
          Products
        </Link>
        <Link
          to="/admin/users"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#f0f0f0',
            color: '#333',
            textDecoration: 'none',
            display: 'block'
          }}
        >
          Manage User
        </Link>
        <Link
          to="/admin/addproduct"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#f0f0f0',
            color: '#333',
            textDecoration: 'none',
            display: 'block'
          }}
        >
          Add Product
        </Link>
        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <button
            onClick={() => signOut(auth)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px' }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ margin: 0, color: '#333' }}>All Products</h1>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '10px 40px 10px 15px',
                  borderRadius: '20px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  width: '250px'
                }}
              />
              <span style={{
                position: 'absolute',
                right: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#999'
              }}>🔍</span>
            </div>
            <Link
              to="/admin/addproduct"
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold'
              }}
            >
              Add New +
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#666' }}>{profile?.displayName || user?.email || 'Admin'}</span>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#4CAF50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold'
              }}>
                {(profile?.displayName || user?.email || 'A')[0].toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading products...</p>
          </div>
        ) : currentProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '8px' }}>
            <p style={{ color: '#999', fontSize: '18px' }}>
              {searchTerm ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีสินค้า'}
            </p>
            <Link
              to="/admin/addproduct"
              style={{
                display: 'inline-block',
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px'
              }}
            >
              เพิ่มสินค้าแรก
            </Link>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {currentProducts.map((product) => (
                <div
                  key={product.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '15px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.productName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div style={{
                      display: product.image ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      color: '#999'
                    }}>
                      No Image
                    </div>
                  </div>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '18px',
                    color: '#333',
                    fontWeight: 'bold'
                  }}>
                    {product.productName || 'Unnamed Product'}
                  </h3>
                  <p style={{
                    margin: '0 0 10px 0',
                    fontSize: '12px',
                    color: '#666',
                    height: '36px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {product.description || 'ไม่มีคำอธิบาย'}
                  </p>
                  <div style={{
                    backgroundColor: '#e8f5e9',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    marginBottom: '10px',
                    fontSize: '14px',
                    color: '#2e7d32',
                    fontWeight: '500'
                  }}>
                    จำนวน: {product.quantity || 0} ชิ้น
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '10px'
                  }}>
                    <span style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#4CAF50'
                    }}>
                      ฿{product.price?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginTop: '12px'
                  }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'background-color 0.3s ease'
                        }}
                        onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#1976D2'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#2196F3'}
                      >
                        แก้ไข
                      </button>
                      <button
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          backgroundColor: '#FF9800',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'background-color 0.3s ease'
                        }}
                        onClick={() => handleOpenQuantityModal(product)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#F57C00'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#FF9800'}
                      >
                        จำนวน
                      </button>
                      <button
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: isDeleting ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'background-color 0.3s ease',
                          opacity: isDeleting ? 0.6 : 1
                        }}
                        onClick={() => handleDeleteProduct(product.id, product.productName)}
                        disabled={isDeleting}
                        onMouseEnter={(e) => {
                          if (!isDeleting) e.target.style.backgroundColor = '#d32f2f';
                        }}
                        onMouseLeave={(e) => {
                          if (!isDeleting) e.target.style.backgroundColor = '#f44336';
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                    <button
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#9C27B0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'background-color 0.3s ease'
                      }}
                      onClick={() => navigate(`/admin/products/${product.id}/history`)}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#7B1FA2'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#9C27B0'}
                    >
                      📊 ประวัติเข้าคลัง
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                padding: '20px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
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

        {/* Quantity Update Modal */}
        {showQuantityModal && selectedProduct && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }} onClick={() => setShowQuantityModal(false)}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
            }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '22px',
                color: '#333',
                fontWeight: '700'
              }}>
                อัพเดตจำนวนสินค้า
              </h3>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                  สินค้า: <strong>{selectedProduct.productName}</strong>
                </p>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  จำนวนปัจจุบัน: <strong style={{ color: '#4CAF50' }}>{selectedProduct.quantity || 0} ชิ้น</strong>
                </p>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  จำนวนที่ต้องการเพิ่ม *
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantityChange}
                  onChange={(e) => setQuantityChange(e.target.value)}
                  placeholder="กรอกจำนวนสินค้าที่ต้องการเพิ่ม"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
                <p style={{
                  margin: '12px 0 0 0',
                  fontSize: '13px',
                  color: '#666',
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '6px'
                }}>
                  จำนวนปัจจุบัน: <strong style={{ color: '#333' }}>{selectedProduct.quantity || 0}</strong> ชิ้น<br />
                  จำนวนใหม่จะเป็น: <strong style={{ color: '#4CAF50' }}>{selectedProduct.quantity + parseInt(quantityChange || 0)}</strong> ชิ้น
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleUpdateQuantity}
                  disabled={isUpdating || !quantityChange || parseInt(quantityChange) <= 0}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    fontSize: '15px',
                    fontWeight: '600',
                    backgroundColor: isUpdating || !quantityChange || parseInt(quantityChange) <= 0
                      ? '#ccc'
                      : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isUpdating || !quantityChange || parseInt(quantityChange) <= 0
                      ? 'not-allowed'
                      : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isUpdating && quantityChange && parseInt(quantityChange) > 0) {
                      e.target.style.backgroundColor = '#45a049';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isUpdating && quantityChange && parseInt(quantityChange) > 0) {
                      e.target.style.backgroundColor = '#4CAF50';
                    }
                  }}
                >
                  {isUpdating ? 'กำลังอัพเดต...' : 'บันทึก'}
                </button>
                <button
                  onClick={() => {
                    setShowQuantityModal(false);
                    setSelectedProduct(null);
                    setQuantityChange('');
                  }}
                  style={{
                    padding: '12px 24px',
                    fontSize: '15px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

