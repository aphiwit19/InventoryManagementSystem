import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getWithdrawalsByUser } from '../../services';
import { useTranslation } from 'react-i18next';
import styles from './CustomerOrdersPage.module.css';

export default function CustomerOrdersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const list = await getWithdrawalsByUser(user.uid);
      const sorted = [...list].sort((a, b) => {
        const toDate = (w) => {
          if (!w) return 0;
          if (w.seconds) return w.seconds * 1000;
          return new Date(w).getTime() || 0;
        };
        const aTime = toDate(a.withdrawDate);
        const bTime = toDate(b.withdrawDate);
        return bTime - aTime;
      });
      setOrders(sorted);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = orders.filter(o => {
    const hit = (
      (o.trackingNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.shippingCarrier || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.id || '').toLowerCase().includes(search.toLowerCase())
    );
    const statusOk = statusFilter === 'all' || (o.shippingStatus || 'pending') === statusFilter;
    return hit && statusOk;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filtered.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
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

  const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    let date;
    if (dateValue.seconds) {
      date = new Date(dateValue.seconds * 1000);
    } else {
      date = new Date(dateValue);
    }
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'shipped':
      case 'กำลังดำเนินการส่ง':
        return styles.statusShipped;
      case 'delivered':
      case 'ส่งสำเร็จ':
        return styles.statusDelivered;
      case 'cancelled':
      case 'ยกเลิก':
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'shipped':
      case 'กำลังดำเนินการส่ง':
        return t('order.status_shipped');
      case 'delivered':
      case 'ส่งสำเร็จ':
        return t('order.status_delivered');
      case 'cancelled':
      case 'ยกเลิก':
        return t('order.status_cancelled');
      default:
        return t('order.status_pending');
    }
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderContent}>
          <h1 className={styles.pageTitle}>{t('order.order_history')}</h1>
          <p className={styles.pageSubtitle}>{t('order.order_history_desc')}</p>
        </div>
        <div className={styles.pageHeaderDecor}></div>
      </div>

      {/* Filter Toolbar */}
      <div className={styles.filterToolbar}>
        {/* Filter Chips */}
        <div className={styles.filterChips}>
          <button 
            className={`${styles.filterChip} ${statusFilter === 'all' ? styles.filterChipActive : ''}`}
            onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>list</span>
            <span>{t('order.all_orders')}</span>
          </button>
          <button 
            className={`${styles.filterChip} ${statusFilter === 'pending' ? styles.filterChipActive : ''}`}
            onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>schedule</span>
            <span>{t('order.status_pending')}</span>
          </button>
          <button 
            className={`${styles.filterChip} ${statusFilter === 'shipped' ? styles.filterChipActive : ''}`}
            onClick={() => { setStatusFilter('shipped'); setCurrentPage(1); }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>local_shipping</span>
            <span>{t('order.status_shipped')}</span>
          </button>
          <button 
            className={`${styles.filterChip} ${statusFilter === 'delivered' ? styles.filterChipActive : ''}`}
            onClick={() => { setStatusFilter('delivered'); setCurrentPage(1); }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>check_circle</span>
            <span>{t('order.status_delivered')}</span>
          </button>
        </div>

        {/* Search Field */}
        <div className={styles.searchWrapper}>
          <div className={styles.searchField}>
            <div className={styles.searchIcon}>
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={t('order.search_order')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}>
            {t('common.loading')}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            {t('order.no_orders_found')}
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className={styles.tableHeadCell}>{t('order.order_id')}</th>
                    <th className={styles.tableHeadCell}>{t('order.order_date')}</th>
                    <th className={styles.tableHeadCell}>{t('common.items')}</th>
                    <th className={styles.tableHeadCell}>{t('common.status')}</th>
                    <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {currentOrders.map((order) => (
                    <tr key={order.id} className={styles.tableRow}>
                      <td className={styles.tableCell}>
                        <span className={styles.orderId}>#{order.id?.slice(-8).toUpperCase() || 'N/A'}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.orderDate}>{formatDate(order.withdrawDate)}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.orderItems}>
                          {order.items && order.items.length > 0 ? (
                            <span className={styles.itemCount}>
                              {order.items.map(item => item.productName).join(', ').slice(0, 50)}
                              {order.items.map(item => item.productName).join(', ').length > 50 ? '...' : ''}
                            </span>
                          ) : (
                            <span className={styles.itemCount}>{t('order.no_items')}</span>
                          )}
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.statusBadge} ${getStatusClass(order.shippingStatus)}`}>
                          <span className={styles.statusDot}></span>
                          {getStatusText(order.shippingStatus)}
                        </span>
                      </td>
                      <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                        <button 
                          className={styles.viewDetailsButton}
                          onClick={() => navigate(`/customer/orders/${order.id}`, { state: { order } })}
                        >
                          {t('order.view_detail')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                {t('common.showing')} <span className={styles.paginationInfoHighlight}>{startIndex + 1}</span> {t('common.to')}{' '}
                <span className={styles.paginationInfoHighlight}>{Math.min(endIndex, filtered.length)}</span> {t('common.of')}{' '}
                <span className={styles.paginationInfoHighlight}>{filtered.length}</span> {t('common.results')}
              </span>
              <div className={styles.paginationButtons}>
                <button 
                  className={styles.paginationButton}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                {buildPageRange().map((page) => (
                  <button
                    key={page}
                    className={`${styles.paginationButton} ${currentPage === page ? styles.paginationButtonActive : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className={styles.paginationEllipsis}>...</span>
                    <button
                      className={styles.paginationButton}
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button 
                  className={styles.paginationButton}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
