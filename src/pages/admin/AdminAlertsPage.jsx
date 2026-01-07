import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts, isLowStock } from '../../services';
import { useTranslation } from 'react-i18next';
import styles from './AdminAlertsPage.module.css';

export default function AdminAlertsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await getAllProducts();
        setProducts(list || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const lowStock = (products || []).filter(isLowStock);

  // Filter by search
  const filteredLowStock = lowStock.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (p.productName || '').toLowerCase().includes(q) ||
           (p.category || '').toLowerCase().includes(q);
  });

  // Stats
  const criticalCount = lowStock.filter(p => (p.quantity || 0) === 0).length;
  const totalAlerts = lowStock.length;

  const totalPages = Math.ceil(filteredLowStock.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredLowStock.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset page when search changes
  useEffect(() => { setCurrentPage(1); }, [search]);

  const getStockStatus = (available, initial) => {
    if (available === 0) return { status: 'critical', label: t('admin.critical'), percent: 0 };
    const percent = initial > 0 ? Math.min((available / initial) * 100, 100) : 0;
    if (percent <= 10) return { status: 'critical', label: t('admin.critical'), percent };
    return { status: 'warning', label: t('product.low_stock'), percent };
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>{t('admin.low_stock_alert')}</h1>
            <p className={styles.pageSubtitle}>{t('product.low_stock_products')}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statCardDecor} ${styles.statCardDecorBlue}`}></div>
            <div className={styles.statCardContent}>
              <span className={styles.statLabel}>{t('admin.total_alerts')}</span>
              <div className={styles.statValue}>
                <span className={styles.statNumber}>{totalAlerts}</span>
              </div>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.statCardCritical}`}>
            <div className={`${styles.statCardDecor} ${styles.statCardDecorRed}`}></div>
            <div className={styles.statCardContent}>
              <span className={styles.statLabel}>{t('admin.critical_items')}</span>
              <div className={styles.statValue}>
                <span className={styles.statNumber}>{criticalCount}</span>
                {criticalCount > 0 && (
                  <span className={`${styles.statBadge} ${styles.statBadgeRed}`}>{t('admin.urgent')}</span>
                )}
              </div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statCardDecor} ${styles.statCardDecorIndigo}`}></div>
            <div className={styles.statCardContent}>
              <span className={styles.statLabel}>{t('admin.low_stock_items')}</span>
              <div className={styles.statValue}>
                <span className={styles.statNumber}>{totalAlerts - criticalCount}</span>
                <span className={styles.statSubtext}>{t('admin.need_attention')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('product.search_products')}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className={styles.loadingState}>
            {t('common.loading')}
          </div>
        ) : filteredLowStock.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={`material-symbols-outlined ${styles.emptyIcon}`}>check_circle</span>
            {search ? t('common.no_data') : `✅ ${t('common.no_data')}`}
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className={styles.tableHeadCell}>{t('product.product')}</th>
                    <th className={styles.tableHeadCell}>{t('product.category')}</th>
                    <th className={`${styles.tableHeadCell} ${styles.tableHeadCellStock}`}>{t('product.stock_level')}</th>
                    <th className={styles.tableHeadCell}>{t('common.status')}</th>
                    <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>{t('common.action')}</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {currentItems.map((p) => {
                    const quantity = p.quantity || 0;
                    const reserved = p.reserved || 0;
                    const staffReserved = p.staffReserved || 0;
                    const available = Math.max(0, quantity - reserved);
                    const initial = (p.initialQuantity && p.initialQuantity > 0)
                      ? p.initialQuantity
                      : Math.max(0, quantity + reserved + staffReserved);
                    const threshold = Math.floor(initial * 0.2);
                    const stockStatus = getStockStatus(available, initial);
                    const isCritical = stockStatus.status === 'critical';

                    return (
                      <tr key={p.id} className={`${styles.tableRow} ${isCritical ? styles.tableRowCritical : ''}`}>
                        <td className={styles.tableCell}>
                          <div className={styles.productCell}>
                            <div className={styles.productImage}>
                              {p.image ? (
                                <img src={p.image} alt={p.productName || ''} />
                              ) : (
                                <span className="material-symbols-outlined" style={{ color: '#cbd5e1', fontSize: '1.25rem' }}>inventory_2</span>
                              )}
                            </div>
                            <div className={styles.productInfo}>
                              <span className={styles.productName}>{p.productName || t('product.no_name')}</span>
                              <span className={styles.productSku}>{p.id?.slice(0, 8) || '-'}</span>
                            </div>
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          <span className={styles.categoryText}>{p.category || '-'}</span>
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.stockLevelWrapper}>
                            <div className={styles.stockLevelInfo}>
                              <span className={isCritical ? styles.stockLevelCurrent : styles.stockLevelCurrentWarning}>
                                {available} {p.unit || t('common.piece')}
                              </span>
                              <span className={styles.stockLevelThreshold}>{t('admin.threshold')}: {threshold}</span>
                            </div>
                            <div className={styles.stockLevelBar}>
                              <div 
                                className={`${styles.stockLevelFill} ${isCritical ? styles.stockLevelFillCritical : styles.stockLevelFillWarning}`}
                                style={{ width: `${stockStatus.percent}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          <span className={`${styles.statusBadge} ${isCritical ? styles.statusBadgeCritical : styles.statusBadgeWarning}`}>
                            {stockStatus.label}
                          </span>
                        </td>
                        <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                          <div className={styles.actionButtons}>
                            <button
                              className={styles.restockButton}
                              onClick={() => navigate(`/admin/products?focus=${p.id}`)}
                            >
                              {t('product.add_stock')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <span className={styles.paginationInfo}>
                  Showing <span className={styles.paginationInfoHighlight}>{startIndex + 1}-{Math.min(endIndex, filteredLowStock.length)}</span> of <span className={styles.paginationInfoHighlight}>{filteredLowStock.length}</span> alerts
                </span>
                <div className={styles.paginationButtons}>
                  <button
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    {t('common.previous')}
                  </button>
                  <button
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    {t('common.next')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
