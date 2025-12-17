import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getAllProducts, deleteProduct, isLowStock, DEFAULT_CATEGORIES, addInventoryHistory } from '../../services';
import { db } from '../../firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import styles from './ProductsPage.module.css';

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
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
      alert(t('product.delete_failed', { message: error.message || '' }));
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
      alert(t('product.select_variant_to_add'));
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
      alert(t('product.add_stock_failed', { message: error.message || '' }));
    } finally {
      setIsAddingStock(false);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    const lng = i18n.language?.split('-')[0] || 'th';
    const locale = lng === 'th' ? 'th-TH' : 'en-US';
    const d = (typeof dateValue === 'object' && dateValue.toDate)
      ? dateValue.toDate()
      : new Date(dateValue);
    return d.toLocaleDateString(locale);
  };

  const getStockStatus = (product) => {
    const qty = product.quantity ?? 0;
    if (qty === 0) return 'out';
    if (isLowStock(product)) return 'low';
    return 'active';
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>{t('product.product_list')}</h1>
            <p className={styles.pageSubtitle}>{t('admin.system_management')}</p>
          </div>
          <button 
            type="button" 
            onClick={() => navigate('/admin/addproduct')} 
            className={styles.addButton}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add</span>
            <span>{t('product.add_product')}</span>
          </button>
        </div>

        {/* Low Stock Banner */}
        {lowStock.length > 0 && (
          <div 
            className={styles.lowStockBanner}
            onClick={() => navigate('/admin/alerts')}
          >
            <div className={styles.lowStockText}>
              <span>⚠️</span>
              <span><strong>{t('admin.low_stock_alert')}:</strong> {lowStock.length} {t('common.items')}</span>
            </div>
            <span className={styles.lowStockButton}>
              {t('common.details')} →
            </span>
          </div>
        )}

        {/* Filters & Search Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarInner}>
            <div className={styles.searchFilterGroup}>
              {/* Search */}
              <div className={styles.searchWrapper}>
                <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
                <input 
                  type="text" 
                  placeholder={t('product.search_products')} 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className={styles.searchInput}
                />
              </div>

              {/* Category Filter */}
              <div className={styles.selectWrapper}>
                <span className={`material-symbols-outlined ${styles.selectIcon}`}>filter_list</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={styles.selectInput}
                >
                  <option value="">{t('common.all_categories')}</option>
                  {uniqueCategories.map(cat => <option key={cat} value={cat}>{t(`categories.${cat}`, cat)}</option>)}
                </select>
                <span className={`material-symbols-outlined ${styles.selectArrow}`}>expand_more</span>
              </div>

              {categoryFilter && (
                <button 
                  onClick={() => setCategoryFilter('')} 
                  className={styles.clearFilterButton}
                >
                  {t('common.clear')}
                </button>
              )}
            </div>

            {/* Results Count */}
            <div className={styles.paginationInfo}>
              {filteredProducts.length} / {products.length} {t('common.items')}
            </div>
          </div>
        </div>

        {/* Products Table */}
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
          <div className={styles.tableContainer}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className={styles.tableHeadCell} style={{ minWidth: '300px' }}>{t('product.product_name')}</th>
                    <th className={styles.tableHeadCell}>{t('product.category')}</th>
                    <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>{t('product.cost_price')}</th>
                    <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>{t('product.sell_price')}</th>
                    <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>{t('common.quantity')}</th>
                    <th className={`${styles.tableHeadCell} ${styles.tableHeadCellCenter}`}>{t('common.status')}</th>
                    <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>{t('common.action')}</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {currentProducts.map((product) => {
                    const hasVariants = product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0;
                    const isExpanded = expandedProduct === product.id;
                    const qty = product.quantity ?? 0;
                    const unit = product.unit || t('common.piece');
                    const stockStatus = getStockStatus(product);

                    const priceRange = hasVariants
                      ? (() => {
                          const prices = product.variants.map(v => v.sellPrice || 0);
                          const min = Math.min(...prices);
                          const max = Math.max(...prices);
                          return min === max ? `฿${min.toLocaleString()}` : `฿${min.toLocaleString()} - ฿${max.toLocaleString()}`;
                        })()
                      : `฿${(product.sellPrice || product.price || 0).toLocaleString()}`;

                    const costRange = hasVariants
                      ? (() => {
                          const costs = product.variants.map(v => v.costPrice || 0);
                          const min = Math.min(...costs);
                          const max = Math.max(...costs);
                          return min === max ? `฿${min.toLocaleString()}` : `฿${min.toLocaleString()} - ฿${max.toLocaleString()}`;
                        })()
                      : `฿${(product.costPrice || 0).toLocaleString()}`;

                    return (
                      <>
                        <tr key={product.id} className={styles.tableRow}>
                          {/* Product */}
                          <td className={styles.tableCell}>
                            <div className={styles.productCell}>
                              <div className={styles.productImage}>
                                {product.image ? (
                                  <img 
                                    src={product.image} 
                                    alt={product.productName} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                  />
                                ) : (
                                  <span className={styles.productImagePlaceholder}>{t('product.no_image')}</span>
                                )}
                              </div>
                              <div className={styles.productInfo}>
                                <span className={styles.productName}>
                                  {product.productName || t('product.no_name')}
                                  {hasVariants && (
                                    <button
                                      onClick={() => toggleExpand(product.id)}
                                      className={styles.variantsButton}
                                    >
                                      {product.variants.length} {t('product.variants')} {isExpanded ? '▲' : '▼'}
                                    </button>
                                  )}
                                </span>
                                <span className={styles.productSku}>
                                  {formatDate(product.addDate)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className={styles.tableCell}>
                            {product.category && (
                              <span className={styles.categoryBadge}>{product.category}</span>
                            )}
                          </td>

                          {/* Cost Price */}
                          <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                            <span className={styles.priceText}>{costRange}</span>
                          </td>

                          {/* Sell Price */}
                          <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                            <span className={styles.priceText} style={{ color: '#16a34a' }}>{priceRange}</span>
                          </td>

                          {/* Stock */}
                          <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                            <span className={`${styles.stockText} ${stockStatus === 'low' ? styles.stockLow : ''} ${stockStatus === 'out' ? styles.stockOut : ''}`}>
                              {qty} {unit}
                            </span>
                          </td>

                          {/* Status */}
                          <td className={`${styles.tableCell} ${styles.tableCellCenter}`}>
                            {stockStatus === 'active' && (
                              <span className={`${styles.statusBadge} ${styles.statusActive}`}>
                                <span className={`${styles.statusDot} ${styles.statusDotActive}`}></span>
                                {t('product.in_stock')}
                              </span>
                            )}
                            {stockStatus === 'low' && (
                              <span className={`${styles.statusBadge} ${styles.statusLowStock}`}>
                                <span className={`${styles.statusDot} ${styles.statusDotLowStock}`}></span>
                                {t('product.low_stock')}
                              </span>
                            )}
                            {stockStatus === 'out' && (
                              <span className={`${styles.statusBadge} ${styles.statusOutOfStock}`}>
                                <span className={`${styles.statusDot} ${styles.statusDotOutOfStock}`}></span>
                                {t('product.out_of_stock')}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                            <div className={styles.actionButtons}>
                              <button 
                                onClick={() => openAddStockModal(product)} 
                                className={`${styles.actionButton} ${styles.actionButtonAdd}`}
                                title={t('common.add')}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add_circle</span>
                              </button>
                              <Link 
                                to={`/admin/products/${product.id}/edit`} 
                                className={`${styles.actionButton} ${styles.actionButtonEdit}`}
                                title={t('common.edit')}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>edit</span>
                              </Link>
                              <button 
                                onClick={() => openDeleteModal(product)} 
                                className={`${styles.actionButton} ${styles.actionButtonDelete}`}
                                title={t('common.delete')}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Variants */}
                        {hasVariants && isExpanded && (
                          <tr key={`${product.id}-variants`} className={styles.variantsRow}>
                            <td colSpan={7}>
                              <div className={styles.variantsContent}>
                                <div className={styles.variantsHeader}>
                                  <div>{t('product.size')}</div>
                                  <div>{t('product.color')}</div>
                                  <div>{t('common.quantity')}</div>
                                  <div>{t('product.cost_price')}</div>
                                  <div>{t('product.sell_price')}</div>
                                </div>
                                {product.variants.map((v, idx) => (
                                  <div key={idx} className={styles.variantItem}>
                                    <div style={{ fontWeight: 500 }}>{v.size || '-'}</div>
                                    <div>{v.color || '-'}</div>
                                    <div>{v.quantity || 0} {unit}</div>
                                    <div>฿{(v.costPrice || 0).toLocaleString()}</div>
                                    <div style={{ color: '#16a34a', fontWeight: 600 }}>฿{(v.sellPrice || 0).toLocaleString()}</div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages >= 1 && (
              <div className={styles.pagination}>
                <span className={styles.paginationInfo}>
                  {t('common.showing')} <span className={styles.paginationInfoHighlight}>{startIndex + 1}</span>-<span className={styles.paginationInfoHighlight}>{Math.min(endIndex, filteredProducts.length)}</span> {t('common.of')} <span className={styles.paginationInfoHighlight}>{filteredProducts.length}</span> {t('common.items')}
                </span>
                <div className={styles.paginationButtons}>
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1} 
                    className={styles.paginationArrow}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>chevron_left</span>
                  </button>
                  {buildPageRange().map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`${styles.paginationNumber} ${currentPage === page ? styles.paginationNumberActive : ''}`}
                    >
                      {page}
                    </button>
                  ))}
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages} 
                    className={styles.paginationArrow}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Stock Modal */}
      {addStockModal && (
        <div className={styles.modalOverlay} onClick={closeAddStockModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={`${styles.modalHeader} ${styles.modalHeaderAdd}`}>
              <h2 className={`${styles.modalTitle} ${styles.modalTitleAdd}`}>{t('product.add_stock')}</h2>
              <button onClick={closeAddStockModal} className={styles.modalCloseButton}>×</button>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              {/* Product Info */}
              <div className={styles.modalProductInfo}>
                <div className={styles.modalProductImage}>
                  {addStockModal.image ? (
                    <img src={addStockModal.image} alt={addStockModal.productName} />
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '1.5rem' }}>📦</span>
                  )}
                </div>
                <div className={styles.modalProductDetails}>
                  <div className={styles.modalProductName}>{addStockModal.productName}</div>
                  <div className={styles.modalProductStock}>
                    {t('inventory.current_stock')}: <strong>{addStockModal.quantity || 0}</strong> {addStockModal.unit || t('common.piece')}
                  </div>
                  {addStockModal.category && (
                    <div className={styles.modalProductCategory}>{t('common.category')}: {addStockModal.category}</div>
                  )}
                </div>
              </div>

              {/* Variant Selection */}
              {addStockModal.hasVariants && Array.isArray(addStockModal.variants) && addStockModal.variants.length > 0 && (
                <div className={styles.variantSelection}>
                  <label className={styles.variantLabel}>{t('product.select_variant_to_add')}:</label>
                  <div className={styles.variantGrid}>
                    {addStockModal.variants.map((variant, idx) => (
                      <button
                        key={idx}
                        onClick={() => setAddStockVariantIdx(idx)}
                        className={`${styles.variantOption} ${addStockVariantIdx === idx ? styles.variantOptionSelected : ''}`}
                      >
                        <div className={styles.variantOptionSize}>{variant.size || '-'}</div>
                        <div className={styles.variantOptionColor}>{variant.color || '-'}</div>
                        <div className={styles.variantOptionStock}>{t('product.remaining')}: {variant.quantity || 0}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Input */}
              <div className={styles.quantitySection}>
                <label className={styles.quantityLabel}>{t('product.quantity_to_add')}:</label>
                <div className={styles.quantityControl}>
                  <button 
                    onClick={() => setAddStockQty(Math.max(1, addStockQty - 1))} 
                    className={styles.quantityButton}
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    value={addStockQty} 
                    onChange={(e) => setAddStockQty(Math.max(1, parseInt(e.target.value) || 1))} 
                    min="1" 
                    className={styles.quantityInput}
                  />
                  <button 
                    onClick={() => setAddStockQty(addStockQty + 1)} 
                    className={styles.quantityButton}
                  >
                    +
                  </button>
                  <span className={styles.quantityUnit}>{addStockModal.unit || t('common.piece')}</span>
                </div>
              </div>

              {/* Summary */}
              <div className={styles.summaryBox}>
                <span className={styles.summaryLabel}>{t('product.stock_after_add')}:</span>
                <span className={styles.summaryValue}>
                  {addStockModal.hasVariants && addStockVariantIdx !== null
                    ? (addStockModal.variants[addStockVariantIdx]?.quantity || 0) + addStockQty
                    : (addStockModal.quantity || 0) + addStockQty
                  } {addStockModal.unit || t('common.piece')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className={styles.modalActions}>
                <button onClick={closeAddStockModal} className={styles.modalButtonCancel}>
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleAddStock}
                  disabled={isAddingStock || (addStockModal.hasVariants && addStockVariantIdx === null)}
                  className={`${styles.modalButtonConfirm} ${styles.modalButtonAdd}`}
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
        <div className={styles.modalOverlay} onClick={closeDeleteModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={`${styles.modalHeader} ${styles.modalHeaderDelete}`}>
              <h2 className={`${styles.modalTitle} ${styles.modalTitleDelete}`}>{t('product.confirm_delete')}</h2>
              <button onClick={closeDeleteModal} className={styles.modalCloseButton}>×</button>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              {/* Product Info */}
              <div className={styles.modalProductInfo}>
                <div className={styles.modalProductImage}>
                  {deleteModal.image ? (
                    <img src={deleteModal.image} alt={deleteModal.productName} />
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '1.25rem' }}>📦</span>
                  )}
                </div>
                <div className={styles.modalProductDetails}>
                  <div className={styles.modalProductName}>{deleteModal.productName}</div>
                  <div className={styles.modalProductStock}>
                    {t('inventory.current_stock')}: {deleteModal.quantity || 0} {deleteModal.unit || t('common.piece')}
                  </div>
                  {deleteModal.category && (
                    <div className={styles.modalProductCategory}>{t('common.category')}: {deleteModal.category}</div>
                  )}
                </div>
              </div>

              <p className={styles.deleteMessage}>
                {t('product.delete_confirm_message')}<br/>
                <span className={styles.deleteWarning}>{t('product.delete_warning')}</span>
              </p>

              {/* Action Buttons */}
              <div className={styles.modalActions}>
                <button onClick={closeDeleteModal} className={styles.modalButtonCancel}>
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDeleteProduct}
                  disabled={isDeleting}
                  className={`${styles.modalButtonConfirm} ${styles.modalButtonDelete}`}
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
