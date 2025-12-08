import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getAllProducts, deleteProduct, isLowStock, DEFAULT_CATEGORIES, addInventoryHistory } from '../../services';
import { db } from '../../firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function ProductsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const lowStock = filteredProducts.filter(p => isLowStock(p));

  // Add Stock Modal State
  const [addStockModal, setAddStockModal] = useState(null);
  const [addStockQty, setAddStockQty] = useState(1);
  const [addStockVariantIdx, setAddStockVariantIdx] = useState(null);
  const [isAddingStock, setIsAddingStock] = useState(false);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState(null);

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

  const uniqueCategories = useMemo(() => {
    const cats = products.map(p => p.category).filter(c => c && c.trim() !== '');
    return [...new Set([...DEFAULT_CATEGORIES, ...cats])].sort();
  }, [products]);

  useEffect(() => {
    let filtered = products;
    
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(product =>
        product.productName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, products]);

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
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    let start = currentPage - 2;
    let end = currentPage + 2;
    if (start < 1) { start = 1; end = 5; }
    if (end > totalPages) { end = totalPages; start = totalPages - 4; }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const openDeleteModal = (product) => {
    setDeleteModal(product);
  };

  const closeDeleteModal = () => {
    setDeleteModal(null);
  };

  const handleDeleteProduct = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      await deleteProduct(deleteModal.id);
      const productsData = await getAllProducts();
      setProducts(productsData);
      setFilteredProducts(productsData);
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('เกิดข้อผิดพลาดในการลบสินค้า: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleExpand = (productId) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  const openAddStockModal = (product) => {
    setAddStockModal(product);
    setAddStockQty(1);
    setAddStockVariantIdx(null);
  };

  const closeAddStockModal = () => {
    setAddStockModal(null);
    setAddStockQty(1);
    setAddStockVariantIdx(null);
  };

  const handleAddStock = async () => {
    if (!addStockModal || addStockQty < 1) return;
    
    const hasVariants = addStockModal.hasVariants && Array.isArray(addStockModal.variants) && addStockModal.variants.length > 0;
    
    if (hasVariants && addStockVariantIdx === null) {
      alert('กรุณาเลือก Variant ที่ต้องการเพิ่มสต็อก');
      return;
    }

    setIsAddingStock(true);
    try {
      const docRef = doc(db, 'products', addStockModal.id);
      
      if (hasVariants) {
        // Update variant quantity
        const updatedVariants = [...addStockModal.variants];
        updatedVariants[addStockVariantIdx] = {
          ...updatedVariants[addStockVariantIdx],
          quantity: (updatedVariants[addStockVariantIdx].quantity || 0) + addStockQty
        };
        // Calculate total quantity
        const totalQty = updatedVariants.reduce((sum, v) => sum + (v.quantity || 0), 0);
        
        await updateDoc(docRef, {
          variants: updatedVariants,
          quantity: totalQty,
          updatedAt: Timestamp.now()
        });
      } else {
        // Update simple product quantity
        const newQty = (addStockModal.quantity || 0) + addStockQty;
        await updateDoc(docRef, {
          quantity: newQty,
          updatedAt: Timestamp.now()
        });
      }
      
      // Add inventory history
      await addInventoryHistory(addStockModal.id, {
        type: 'add',
        quantity: addStockQty,
        costPrice: hasVariants && addStockVariantIdx !== null 
          ? addStockModal.variants[addStockVariantIdx].costPrice 
          : addStockModal.costPrice,
        source: 'เพิ่มสต็อก',
        variantSize: hasVariants ? addStockModal.variants[addStockVariantIdx]?.size : null,
        variantColor: hasVariants ? addStockModal.variants[addStockVariantIdx]?.color : null,
      });

      // Reload products
      const productsData = await getAllProducts();
      setProducts(productsData);
      setFilteredProducts(productsData);
      
      closeAddStockModal();
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsAddingStock(false);
    }
  };

  return (
    <div style={{ padding: '32px 24px', background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)', minHeight: '100vh', boxSizing: 'border-box', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', padding: '20px 24px', borderRadius: 18, marginBottom: 20, boxShadow: '0 8px 32px rgba(15,23,42,0.12)', border: '1px solid rgba(255,255,255,0.9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: '#1e40af', fontSize: 24, fontWeight: 700 }}>{t('product.product_list')}</h1>
          <div style={{ fontSize: 14, color: '#3b82f6', marginTop: 6 }}>{t('admin.system_management')}</div>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input type="text" placeholder={t('product.search_products')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px 40px 10px 16px', borderRadius: 999, border: '2px solid #e2e8f0', fontSize: 14, width: 240, background: '#fff', outline: 'none' }} />
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#3b82f6', fontSize: 16 }}>🔍</span>
          </div>
          <button type="button" onClick={() => navigate('/admin/addproduct')} style={{ padding: '10px 20px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 6px 20px rgba(37,99,235,0.4)' }}>+ {t('product.add_product')}</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', padding: '16px 24px', borderRadius: 14, marginBottom: 16, boxShadow: '0 4px 16px rgba(15,23,42,0.08)', border: '1px solid rgba(255,255,255,0.9)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{t('common.filter')}:</span>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 14, background: '#fff', cursor: 'pointer', minWidth: 140 }}
        >
          <option value="">{t('common.all_categories')}</option>
          {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        {categoryFilter && (
          <button onClick={() => setCategoryFilter('')} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {t('common.clear')}
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#6b7280' }}>
          {filteredProducts.length} / {products.length} {t('common.items')}
        </span>
      </div>

      {/* Low stock banner - ลิงก์ไปหน้าแจ้งเตือน */}
      {lowStock.length > 0 && (
        <div 
          onClick={() => navigate('/admin/alerts')}
          style={{ 
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
            border: '1px solid #f59e0b', 
            borderRadius: 14, 
            padding: '14px 20px', 
            marginBottom: 16, 
            boxShadow: '0 4px 12px rgba(245,158,11,0.2)',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ color: '#92400e', fontWeight: 600, fontSize: 15 }}>
            ⚠️ <strong>{t('admin.low_stock_alert')}:</strong> {lowStock.length} {t('common.items')}
          </div>
          <span style={{ 
            background: '#f59e0b', 
            color: '#fff', 
            padding: '6px 14px', 
            borderRadius: 8, 
            fontSize: 13, 
            fontWeight: 600 
          }}>
            {t('common.details')} →
          </span>
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 50, background: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>
          <p style={{ color: '#64748b', fontSize: 15 }}>{t('common.loading')}</p>
        </div>
      ) : currentProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 50, background: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>
          <p style={{ color: '#64748b', fontSize: 15 }}>{searchTerm ? t('product.no_products_found') : t('product.no_products')}</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 10px 40px rgba(15,23,42,0.12)', overflow: 'hidden', marginBottom: 20, border: '1px solid rgba(255,255,255,0.9)' }}>
          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: 0, padding: '14px 20px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', color: '#1e40af', fontWeight: 600, fontSize: 13 }}>
            <div>{t('common.image')}</div>
            <div>{t('product.product_name')}</div>
            <div>{t('product.date_added')}</div>
            <div>{t('product.cost_price')}</div>
            <div>{t('product.sell_price')}</div>
            <div>{t('common.quantity')}</div>
            <div>{t('common.action')}</div>
          </div>

          {/* Table Rows */}
          {currentProducts.map((product) => {
            const hasVariants = product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0;
            const isExpanded = expandedProduct === product.id;
            const qty = product.quantity ?? 0;
            const unit = product.unit || t('common.piece');
            const low = isLowStock(product);
            const priceRange = hasVariants
              ? (() => {
                  const prices = product.variants.map(v => v.sellPrice || 0);
                  const min = Math.min(...prices);
                  const max = Math.max(...prices);
                  return min === max ? `฿${min.toLocaleString()}` : `฿${min.toLocaleString()} - ฿${max.toLocaleString()}`;
                })()
              : `฿${(product.sellPrice || product.price || 0).toLocaleString()}`;

            return (
              <div key={product.id}>
                {/* Main Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: 0, padding: '12px 20px', alignItems: 'center', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <div>
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f3f4f6', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {product.image ? <img src={product.image} alt={product.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#9ca3af', fontSize: 10 }}>No Image</span>}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {product.productName || t('product.no_name')}
                      {hasVariants && (
                        <button
                          onClick={() => toggleExpand(product.id)}
                          style={{ background: '#e0e7ff', border: 'none', color: '#4338ca', padding: '2px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}
                        >
                          {product.variants.length} variants {isExpanded ? '▲' : '▼'}
                        </button>
                      )}
                    </div>
                    {product.category && (
                      <span style={{ fontSize: 11, color: '#6b7280' }}>{product.category}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {product.addDate ? (typeof product.addDate === 'object' && product.addDate.toDate ? product.addDate.toDate().toLocaleDateString('th-TH') : new Date(product.addDate).toLocaleDateString('th-TH')) : '-'}
                  </div>
                  <div style={{ color: '#dc2626', fontWeight: 600 }}>
                    {hasVariants
                      ? (() => {
                          const costs = product.variants.map(v => v.costPrice || 0);
                          const min = Math.min(...costs);
                          const max = Math.max(...costs);
                          return min === max ? `฿${min.toLocaleString()}` : `฿${min.toLocaleString()} - ฿${max.toLocaleString()}`;
                        })()
                      : `฿${(product.costPrice || 0).toLocaleString()}`}
                  </div>
                  <div style={{ color: '#16a34a', fontWeight: 600 }}>{priceRange}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: low ? '#ea580c' : '#111827' }}>{qty} {unit}</div>
                    {low && <div style={{ fontSize: 10, color: '#ea580c' }}>{t('product.low_stock')}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openAddStockModal(product)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{t('common.add')}</button>
                    <Link to={`/admin/products/${product.id}/edit`} style={{ padding: '6px 12px', borderRadius: 6, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>{t('common.edit')}</Link>
                    <button onClick={() => openDeleteModal(product)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>{t('common.delete')}</button>
                  </div>
                </div>

                {/* Expanded Variants */}
                {hasVariants && isExpanded && (
                  <div style={{ background: '#fefce8', padding: '12px 16px 12px 86px', borderBottom: '1px solid #fde047' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '100px 100px 80px 100px 100px', gap: 8, padding: '6px 0', fontSize: 11, fontWeight: 600, color: '#854d0e', borderBottom: '1px solid #fde68a' }}>
                      <div>{t('product.size')}</div>
                      <div>{t('product.color')}</div>
                      <div>{t('common.quantity')}</div>
                      <div>{t('product.cost_price')}</div>
                      <div>{t('product.sell_price')}</div>
                    </div>
                    {product.variants.map((v, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '100px 100px 80px 100px 100px', gap: 8, padding: '8px 0', fontSize: 12, color: '#374151', borderBottom: '1px solid #fef3c7' }}>
                        <div style={{ fontWeight: 500 }}>{v.size || '-'}</div>
                        <div>{v.color || '-'}</div>
                        <div>{v.quantity || 0} {unit}</div>
                        <div>฿{(v.costPrice || 0).toLocaleString()}</div>
                        <div style={{ color: '#16a34a', fontWeight: 600 }}>฿{(v.sellPrice || 0).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages >= 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '20px 24px', marginTop: 10, background: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(15,23,42,0.12)', border: '1px solid rgba(255,255,255,0.9)' }}>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} style={{ padding: '10px 18px', border: '2px solid #e2e8f0', borderRadius: 10, background: currentPage === 1 ? '#f1f5f9' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#94a3b8' : '#1e40af', fontSize: 14, fontWeight: 600 }}>Previous</button>
          {buildPageRange().map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              style={{
                padding: '10px 16px',
                border: currentPage === page ? 'none' : '2px solid #e2e8f0',
                borderRadius: 10,
                background: currentPage === page ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#fff',
                color: currentPage === page ? '#fff' : '#374151',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                boxShadow: currentPage === page ? '0 2px 8px rgba(37,99,235,0.4)' : 'none',
                minWidth: 44,
              }}
            >
              {page}
            </button>
          ))}
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} style={{ padding: '10px 18px', border: '2px solid #e2e8f0', borderRadius: 10, background: currentPage === totalPages ? '#f1f5f9' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#94a3b8' : '#1e40af', fontSize: 14, fontWeight: 600 }}>Next</button>
        </div>
      )}

      {/* Add Stock Modal */}
      {addStockModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={closeAddStockModal}>
          <div style={{ background: '#fff', borderRadius: 20, maxWidth: 480, width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#166534' }}>{t('product.add_stock')}</h2>
                <button onClick={closeAddStockModal} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280' }}>×</button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Product Info */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 12 }}>
                <div style={{ width: 70, height: 70, borderRadius: 10, background: '#e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                  {addStockModal.image ? <img src={addStockModal.image} alt={addStockModal.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 24 }}>📦</div>}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, color: '#111827', marginBottom: 4 }}>{addStockModal.productName}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{t('inventory.current_stock')}: <strong>{addStockModal.quantity || 0}</strong> {addStockModal.unit || t('common.piece')}</div>
                  {addStockModal.category && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{t('common.category')}: {addStockModal.category}</div>}
                </div>
              </div>

              {/* Variant Selection (if has variants) */}
              {addStockModal.hasVariants && Array.isArray(addStockModal.variants) && addStockModal.variants.length > 0 ? (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 10, fontSize: 14, fontWeight: 600, color: '#374151' }}>{t('product.select_variant_to_add')}:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                    {addStockModal.variants.map((variant, idx) => (
                      <button
                        key={idx}
                        onClick={() => setAddStockVariantIdx(idx)}
                        style={{
                          padding: '12px 10px',
                          borderRadius: 10,
                          border: addStockVariantIdx === idx ? '2px solid #10b981' : '2px solid #e5e7eb',
                          background: addStockVariantIdx === idx ? '#f0fdf4' : '#fff',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 13, color: addStockVariantIdx === idx ? '#166534' : '#111827' }}>{variant.size || '-'}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{variant.color || '-'}</div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{t('product.remaining')}: {variant.quantity || 0}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Quantity Input */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 10, fontSize: 14, fontWeight: 600, color: '#374151' }}>{t('product.quantity_to_add')}:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setAddStockQty(Math.max(1, addStockQty - 1))} style={{ width: 44, height: 44, borderRadius: 10, border: '2px solid #e5e7eb', background: '#fff', fontSize: 20, cursor: 'pointer', color: '#374151' }}>-</button>
                  <input 
                    type="number" 
                    value={addStockQty} 
                    onChange={(e) => setAddStockQty(Math.max(1, parseInt(e.target.value) || 1))} 
                    min="1" 
                    style={{ width: 100, padding: '12px', textAlign: 'center', fontSize: 18, fontWeight: 600, border: '2px solid #e5e7eb', borderRadius: 10 }} 
                  />
                  <button onClick={() => setAddStockQty(addStockQty + 1)} style={{ width: 44, height: 44, borderRadius: 10, border: '2px solid #e5e7eb', background: '#fff', fontSize: 20, cursor: 'pointer', color: '#374151' }}>+</button>
                  <span style={{ fontSize: 14, color: '#6b7280' }}>{addStockModal.unit || t('common.piece')}</span>
                </div>
              </div>

              {/* Summary */}
              <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#374151' }}>{t('product.stock_after_add')}:</span>
                  <span style={{ fontWeight: 700, fontSize: 18, color: '#16a34a' }}>
                    {addStockModal.hasVariants && addStockVariantIdx !== null
                      ? (addStockModal.variants[addStockVariantIdx]?.quantity || 0) + addStockQty
                      : (addStockModal.quantity || 0) + addStockQty
                    } {addStockModal.unit || t('common.piece')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={closeAddStockModal} style={{ flex: 1, padding: '14px', borderRadius: 10, border: '2px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>{t('common.cancel')}</button>
                <button
                  onClick={handleAddStock}
                  disabled={isAddingStock || (addStockModal.hasVariants && addStockVariantIdx === null)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 10,
                    border: 'none',
                    background: (isAddingStock || (addStockModal.hasVariants && addStockVariantIdx === null)) ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: (isAddingStock || (addStockModal.hasVariants && addStockVariantIdx === null)) ? 'not-allowed' : 'pointer',
                    boxShadow: (isAddingStock || (addStockModal.hasVariants && addStockVariantIdx === null)) ? 'none' : '0 6px 20px rgba(16,185,129,0.4)',
                  }}
                >
                  {isAddingStock ? t('product.adding_stock') : t('product.confirm_add_stock')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={closeDeleteModal}>
          <div style={{ background: '#fff', borderRadius: 20, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #fecaca', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', borderRadius: '20px 20px 0 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#dc2626' }}>{t('product.confirm_delete')}</h2>
                <button onClick={closeDeleteModal} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280' }}>×</button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Product Info */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 12 }}>
                <div style={{ width: 60, height: 60, borderRadius: 10, background: '#e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                  {deleteModal.image ? <img src={deleteModal.image} alt={deleteModal.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 20 }}>📦</div>}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 4 }}>{deleteModal.productName}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{t('inventory.current_stock')}: {deleteModal.quantity || 0} {deleteModal.unit || t('common.piece')}</div>
                  {deleteModal.category && <div style={{ fontSize: 12, color: '#6b7280' }}>{t('common.category')}: {deleteModal.category}</div>}
                </div>
              </div>

              <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
                {t('product.delete_confirm_message')}<br/>
                <span style={{ color: '#dc2626', fontWeight: 500 }}>{t('product.delete_warning')}</span>
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={closeDeleteModal} style={{ flex: 1, padding: '14px', borderRadius: 10, border: '2px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>{t('common.cancel')}</button>
                <button
                  onClick={handleDeleteProduct}
                  disabled={isDeleting}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 10,
                    border: 'none',
                    background: isDeleting ? '#9ca3af' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    boxShadow: isDeleting ? 'none' : '0 6px 20px rgba(239,68,68,0.4)',
                  }}
                >
                  {isDeleting ? t('product.deleting') : t('product.confirm_delete_product')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
