import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { getAllProducts, deleteProduct, updateProductQuantity, getInventoryHistory, isLowStock } from '../../services';
import { Link } from 'react-router-dom';

export default function ProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();

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
  const [showDetail, setShowDetail] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  // inventory history modal states
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const lowStock = filteredProducts.filter(p => isLowStock(p));

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

  // ถ้ามาจากหน้าแจ้งเตือนสินค้า พร้อมพารามิเตอร์ focus ให้แสดงเฉพาะสินค้านั้น
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const focusId = params.get('focus');
    if (!focusId) return;

    const target = products.find(p => p.id === focusId);
    if (target) {
      setFilteredProducts([target]);
      setCurrentPage(1);
    }
  }, [location.search, products]);

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

  const openHistory = async (product) => {
    setSelectedProduct(product);
    setShowHistory(true);
    setHistoryLoading(true);
    try {
      const rows = await getInventoryHistory(product.id);
      setHistoryRows(rows);
    } finally {
      setHistoryLoading(false);
    }
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
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#fff',
        padding: '16px 20px',
        borderRadius: '10px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#111827', fontSize: 20 }}>จัดการสินค้า</h1>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>ดู แก้ไข และจัดการสต็อกสินค้าทั้งหมดในระบบ</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้า"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 36px 8px 14px',
                borderRadius: 999,
                border: '1px solid #ddd',
                fontSize: 13,
                width: 230,
                background: '#F9FAFB'
              }}
            />
            <span style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9CA3AF',
              fontSize: 15
            }}>🔍</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/addproduct')}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: 'none',
              background: '#2563EB',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(37,99,235,0.4)'
            }}
          >
            + เพิ่มสินค้าใหม่
          </button>
        </div>
      </div>

      {/* Low stock banner */}
      {lowStock.length > 0 && (
        <div style={{ background:'#fff3e0', border: '1px solid #ffcc80', color:'#e65100', borderRadius:8, padding:12, marginBottom:10, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <strong>แจ้งเตือนสต็อกต่ำ:</strong> พบ {lowStock.length} รายการที่ต่ำกว่า 20% ของสต็อกตั้งต้น
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 10 }}>
          <p>กำลังโหลดข้อมูลสินค้า...</p>
        </div>
      ) : currentProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 10 }}>
          <p style={{ color: '#999', fontSize: 16 }}>
            {searchTerm ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีสินค้าในระบบ'}
          </p>
        </div>
      ) : (
        <>
          <div style={{ background:'#fff', borderRadius: 10, boxShadow:'0 2px 6px rgba(15,23,42,0.06)', overflow:'hidden', marginBottom: 16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1.6fr 1fr 1fr 1fr 1fr', padding:'10px 16px', background:'#F9FAFB', fontWeight:600, fontSize:13 }}>
              <div>รูปภาพ</div>
              <div>ชื่อสินค้า</div>
              <div>วันที่เพิ่ม</div>
              <div>ราคา</div>
              <div>จำนวนสินค้า</div>
              <div>จัดการ</div>
            </div>

            {currentProducts.map((product) => {
              const price = (product.price ?? product.costPrice ?? 0).toLocaleString();
              const qty = product.quantity ?? 0;
              const low = isLowStock(product);
              return (
                <div
                  key={product.id}
                  style={{
                    display:'grid',
                    gridTemplateColumns:'1.1fr 1.6fr 1fr 1fr 1fr 1fr',
                    padding:'10px 16px',
                    borderTop:'1px solid #EEF2F7',
                    alignItems:'center',
                    fontSize:13,
                  }}
                >

                  <div>
                    <div style={{ width:56, height:56, borderRadius:8, background:'#F3F4F6', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.productName}
                          style={{ width:'100%', height:'100%', objectFit:'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div style={{ display: product.image ? 'none' : 'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', color:'#9CA3AF', fontSize:11 }}>
                        No Image
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight:500, color:'#111827' }}>{product.productName || 'ไม่มีชื่อสินค้า'}</div>
                  </div>
                  <div style={{ color:'#4B5563', fontSize:12 }}>
                    {product.createdAt ? formatDate(product.createdAt) : '-'}
                  </div>

                  <div style={{ fontWeight:600, color:'#16A34A' }}>฿{price}</div>
                  <div>
                    <div style={{ fontWeight:600, color: low ? '#EA580C' : '#111827' }}>{qty} ชิ้น</div>
                    {low && (
                      <div style={{ marginTop:2, fontSize:11, color:'#EA580C' }}>สต็อกต่ำ</div>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button
                      onClick={() => handleOpenQuantityModal(product)}
                      style={{
                        padding:'6px 8px',
                        borderRadius:6,
                        border:'1px solid #E5E7EB',
                        background:'#ECFDF3',
                        color:'#16A34A',
                        cursor:'pointer',
                        fontSize:12,
                        minWidth:32,
                      }}
                    >
                      +
                    </button>
                    <Link
                      to={`/admin/products/${product.id}/edit`}
                      style={{
                        padding:'6px 8px',
                        borderRadius:6,
                        border:'1px solid #E5E7EB',
                        background:'#EFF6FF',
                        color:'#1D4ED8',
                        fontSize:12,
                        textDecoration:'none',
                        minWidth:32,
                        textAlign:'center',
                      }}
                    >
                      ✏️
                    </Link>
                    <button
                      onClick={() => handleDeleteProduct(product.id, product.productName)}
                      disabled={isDeleting}
                      style={{
                        padding:'6px 8px',
                        borderRadius:6,
                        border:'1px solid #FCA5A5',
                        background: isDeleting ? '#F3F4F6' : '#FEF2F2',
                        color:'#DC2626',
                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                        fontSize:12,
                        minWidth:32,
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
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

      {/* Quantity Modal */}
      {showQuantityModal && selectedProduct && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: 20
        }} onClick={() => setShowQuantityModal(false)}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            width: 420,
            maxWidth: '100%',
            padding: 20
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>ปรับจำนวนสินค้า</h3>
            <p style={{ marginTop: 0, color: '#666' }}>
              {selectedProduct.productName} (คงเหลือ: {selectedProduct.quantity} ชิ้น)
            </p>
            <input
              type="number"
              min="1"
              value={quantityChange}
              onChange={(e) => setQuantityChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 8
              }}
              placeholder="จำนวนที่ต้องการเพิ่ม"
            />
            <div style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              marginTop: 16
            }}>
              <button
                onClick={() => setShowQuantityModal(false)}
                style={{
                  padding: '10px 16px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpdateQuantity}
                disabled={isUpdating}
                style={{
                  padding: '10px 16px',
                  background: isUpdating ? '#ccc' : '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                {isUpdating ? 'กำลังปรับปรุง...' : 'ปรับจำนวน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}