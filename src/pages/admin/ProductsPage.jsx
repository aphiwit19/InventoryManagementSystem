import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getAllProducts, deleteProduct, updateProductQuantity, isLowStock } from '../../services';

export default function ProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantityChange, setQuantityChange] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const lowStock = filteredProducts.filter(p => isLowStock(p));
  const gridColumns = '96px 1.6fr 1fr 1fr 1fr 1fr 1fr';

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

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildPageRange = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    let start = currentPage - 2;
    let end = currentPage + 2;

    if (start < 1) {
      start = 1;
      end = 5;
    }

    if (end > totalPages) {
      end = totalPages;
      start = totalPages - 4;
    }

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    return pages;
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบสินค้า "${productName}"?`)) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productId);
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
    <div style={{ padding: '32px 24px', background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)', minHeight: '100vh', boxSizing: 'border-box', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', padding: '20px 24px', borderRadius: 18, marginBottom: 20, boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 4px 12px rgba(37,99,235,0.08)', border: '1px solid rgba(255,255,255,0.9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: '#1e40af', fontSize: 24, fontWeight: 700 }}>จัดการสินค้า</h1>
          <div style={{ fontSize: 14, color: '#3b82f6', marginTop: 6 }}>ดู แก้ไข และจัดการสต็อกสินค้าทั้งหมดในระบบ</div>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input type="text" placeholder="ค้นหาชื่อสินค้า" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px 40px 10px 16px', borderRadius: 999, border: '2px solid #e2e8f0', fontSize: 14, width: 240, background: '#fff', outline: 'none' }} />
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#3b82f6', fontSize: 16 }}>🔍</span>
          </div>
          <button type="button" onClick={() => navigate('/admin/addproduct')} style={{ padding: '10px 20px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 6px 20px rgba(37,99,235,0.4)' }}>+ เพิ่มสินค้าใหม่</button>
        </div>
      </div>

      {/* Low stock banner */}
      {lowStock.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1px solid #f59e0b', color: '#92400e', borderRadius: 14, padding: '14px 18px', marginBottom: 16, boxShadow: '0 4px 12px rgba(245,158,11,0.2)', fontWeight: 500 }}>
          ⚠️ <strong>แจ้งเตือนสต็อกต่ำ:</strong> พบ {lowStock.length} รายการที่ต่ำกว่า 20% ของสต็อกตั้งต้น
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 50, background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', borderRadius: 18, boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>
          <p style={{ color: '#64748b', fontSize: 15 }}>กำลังโหลดข้อมูลสินค้า...</p>
        </div>
      ) : currentProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 50, background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', borderRadius: 18, boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>
          <p style={{ color: '#64748b', fontSize: 15 }}>{searchTerm ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีสินค้าในระบบ'}</p>
        </div>
      ) : (
        <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', borderRadius: 18, boxShadow: '0 10px 40px rgba(15,23,42,0.12), 0 4px 16px rgba(37,99,235,0.08)', overflow: 'hidden', marginBottom: 20, border: '1px solid rgba(255,255,255,0.9)' }}>
          <div style={{ display: 'table', width: '100%', tableLayout: 'fixed', borderSpacing: 0 }}>
            {/* Header */}
            <div style={{ display: 'table-row', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', color: '#1e40af', fontWeight: 600, fontSize: 13 }}>
              <div style={{ display: 'table-cell', width: 96, padding: '14px 20px', boxSizing: 'border-box' }}>รูปภาพ</div>
              <div style={{ display: 'table-cell', padding: '14px 20px', boxSizing: 'border-box' }}>ชื่อสินค้า</div>
              <div style={{ display: 'table-cell', padding: '14px 20px', boxSizing: 'border-box' }}>วันที่เพิ่ม</div>
              <div style={{ display: 'table-cell', padding: '14px 20px', boxSizing: 'border-box' }}>ราคาต้นทุน</div>
              <div style={{ display: 'table-cell', padding: '14px 20px', boxSizing: 'border-box' }}>ราคาขาย</div>
              <div style={{ display: 'table-cell', padding: '14px 20px', boxSizing: 'border-box' }}>จำนวน</div>
              <div style={{ display: 'table-cell', width: 200, padding: '14px 20px', boxSizing: 'border-box' }}>จัดการ</div>
            </div>
            {/* Rows */}
            {currentProducts.map((product) => {
              const sell = (product.sellPrice ?? product.price ?? 0);
              const cost = (product.costPrice ?? 0);
              const sellText = sell.toLocaleString();
              const costText = cost.toLocaleString();
              const qty = product.quantity ?? 0;
              const low = isLowStock(product);
              return (
                <div key={product.id} style={{ display: 'table-row', fontSize: 13 }}>
                  <div style={{ display: 'table-cell', width: 96, padding: '14px 20px', verticalAlign: 'middle' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 8, background: '#F3F4F6', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {product.image ? <img src={product.image} alt={product.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#9CA3AF', fontSize: 11 }}>No Image</span>}
                    </div>
                  </div>
                  <div style={{ display: 'table-cell', padding: '14px 20px', color: '#111827', fontWeight: 500, verticalAlign: 'middle' }}>{product.productName || 'ไม่มีชื่อสินค้า'}</div>
                  <div style={{ display: 'table-cell', padding: '14px 20px', color: '#4B5563', verticalAlign: 'middle' }}>{product.createdAt ? formatDate(product.createdAt) : '-'}</div>
                  <div style={{ display: 'table-cell', padding: '14px 20px', color: '#1f2937', fontWeight: 600, verticalAlign: 'middle' }}>฿{costText}</div>
                  <div style={{ display: 'table-cell', padding: '14px 20px', color: '#16A34A', fontWeight: 700, verticalAlign: 'middle' }}>฿{sellText}</div>
                  <div style={{ display: 'table-cell', padding: '14px 20px', verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 600, color: low ? '#EA580C' : '#111827' }}>{qty} ชิ้น</div>
                    {low && <div style={{ marginTop: 2, fontSize: 11, color: '#EA580C' }}>สต็อกต่ำ</div>}
                  </div>
                  <div style={{ display: 'table-cell', width: 200, padding: '14px 20px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => handleOpenQuantityModal(product)} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, boxShadow: '0 1px 6px rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center' }}>เพิ่ม</button>
                      <Link to={`/admin/products/${product.id}/edit`} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', fontSize: 11, fontWeight: 600, textDecoration: 'none', boxShadow: '0 1px 6px rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center' }}>แก้ไข</Link>
                      <button onClick={() => handleDeleteProduct(product.id, product.productName)} disabled={isDeleting} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: isDeleting ? '#94a3b8' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', cursor: isDeleting ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 600, boxShadow: '0 1px 6px rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center' }}>ลบ</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages >= 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '20px 24px', marginTop: 10, background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', borderRadius: 18, boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 4px 12px rgba(37,99,235,0.08)', border: '1px solid rgba(255,255,255,0.9)' }}>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} style={{ padding: '10px 18px', border: '2px solid #e2e8f0', borderRadius: 10, background: currentPage === 1 ? '#f1f5f9' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#94a3b8' : '#1e40af', fontSize: 14, fontWeight: 600 }}>Previous</button>
          {buildPageRange().map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              style={{
                padding: '10px 16px',
                border: currentPage === page ? 'none' : '2px solid #e2e8f0',
                borderRadius: 10,
                background:
                  currentPage === page
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                    : '#fff',
                color: currentPage === page ? '#fff' : '#374151',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                boxShadow:
                  currentPage === page
                    ? '0 2px 8px rgba(37,99,235,0.4)'
                    : 'none',
                minWidth: 44,
              }}
            >
              {page}
            </button>
          ))}
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} style={{ padding: '10px 18px', border: '2px solid #e2e8f0', borderRadius: 10, background: currentPage === totalPages ? '#f1f5f9' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#94a3b8' : '#1e40af', fontSize: 14, fontWeight: 600 }}>Next</button>
        </div>
      )}

      {/* Quantity Modal */}
      {showQuantityModal && selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }} onClick={() => setShowQuantityModal(false)}>
          <div style={{ background: '#fff', borderRadius: 12, width: 420, maxWidth: '100%', padding: 20 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>ปรับจำนวนสินค้า</h3>
            <p style={{ marginTop: 0, color: '#666' }}>{selectedProduct.productName} (คงเหลือ: {selectedProduct.quantity} ชิ้น)</p>
            <input type="number" min="1" value={quantityChange} onChange={(e) => setQuantityChange(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }} placeholder="จำนวนที่ต้องการเพิ่ม" />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setShowQuantityModal(false)} style={{ padding: '10px 16px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>ยกเลิก</button>
              <button onClick={handleUpdateQuantity} disabled={isUpdating} style={{ padding: '10px 16px', background: isUpdating ? '#ccc' : '#4CAF50', color: '#fff', border: 'none', borderRadius: 8, cursor: isUpdating ? 'not-allowed' : 'pointer', fontWeight: 600 }}>{isUpdating ? 'กำลังปรับปรุง...' : 'ปรับจำนวน'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
