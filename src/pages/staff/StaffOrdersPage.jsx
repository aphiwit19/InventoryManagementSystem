import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getWithdrawalsByUser } from '../../services';
import { useTranslation } from 'react-i18next';
import styles from './StaffOrdersPage.module.css';

export default function StaffOrdersPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
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
        return bTime - aTime; // newest first
      });
      setOrders(sorted);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  // Normalize Thai status to stable code
  const normalizeStatus = (status) => {
    if (!status) return 'pending';
    if (status === 'pending' || status === 'รอดำเนินการ') return 'pending';
    if (status === 'shipping' || status === 'กำลังดำเนินการส่ง') return 'shipping';
    if (status === 'delivered' || status === 'ส่งสำเร็จ') return 'delivered';
    if (status === 'picked_up' || status === 'รับของแล้ว') return 'picked_up';
    if (status === 'cancelled' || status === 'ยกเลิก') return 'cancelled';
    return 'pending';
  };

  const filtered = orders.filter(o => {
    const hit = (
      (o.orderNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.trackingNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.requestedBy || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.requestedAddress || '').toLowerCase().includes(search.toLowerCase())
    );
    const statusOk = statusFilter === 'all' || normalizeStatus(o.shippingStatus) === statusFilter;
    const method = o.deliveryMethod || 'shipping';
    const deliveryOk = deliveryFilter === 'all' || method === deliveryFilter;
    return hit && statusOk && deliveryOk;
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

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDeliveryFilter('all');
    setCurrentPage(1);
  };

  const getDeliveryText = (method) => {
    const m = method || 'shipping';
    if (m === 'pickup') return t('order.pickup');
    return t('order.shipping');
  };

  const toDateMs = (w) => {
    if (!w) return 0;
    if (w.seconds) return w.seconds * 1000;
    const ms = new Date(w).getTime();
    return Number.isFinite(ms) ? ms : 0;
  };

  const formatDate = (w) => {
    const ms = toDateMs(w);
    if (!ms) return '-';
    const locale = i18n.language?.startsWith('en') ? 'en-US' : 'th-TH';
    return new Date(ms).toLocaleDateString(locale);
  };

  const getStatusClass = (status) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'shipping':
        return styles.statusShipped;
      case 'delivered':
      case 'picked_up':
        return styles.statusDelivered;
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  const getStatusText = (status) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'shipping': return t('order.status_shipping');
      case 'delivered': return t('order.status_delivered');
      case 'picked_up': return t('order.status_picked_up');
      case 'cancelled': return t('order.status_cancelled');
      default: return t('order.status_pending');
    }
  };

  const getStatusCount = (method, statusValue) => {
    const normalizedMethod = method || 'all';
    return orders.filter((o) => {
      const m = o.deliveryMethod || 'shipping';
      const methodOk = normalizedMethod === 'all' || m === normalizedMethod;
      const s = normalizeStatus(o.shippingStatus);
      const statusOk = statusValue === 'all' || s === statusValue;
      return methodOk && statusOk;
    }).length;
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

  const startShowing = filtered.length === 0 ? 0 : startIndex + 1;
  const endShowing = Math.min(endIndex, filtered.length);

  return (
    <div className={styles.container}>
      {/* Page Header with Stats */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderContent}>
          <h1 className={styles.pageTitle}>
            {t('order.track_status') || t('order.my_orders')}
          </h1>
          <p className={styles.pageSubtitle}>
            {t('order.order_history')}
          </p>
        </div>
        <div className={styles.pageHeaderDecor}></div>
      </div>

      {/* Filter Section */}
      <div className={styles.filterToolbar}>
        <div className={styles.filterChips}>
          <button
            type="button"
            className={`${styles.filterChip} ${statusFilter === 'all' ? styles.filterChipActive : ''}`}
            onClick={() => {
              setStatusFilter('all');
              setDeliveryFilter('all');
              setCurrentPage(1);
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>
              list
            </span>
            <span>
              {t('common.all_status') || 'All'} ({getStatusCount(deliveryFilter, 'all')})
            </span>
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${statusFilter === 'pending' ? styles.filterChipActive : ''}`}
            onClick={() => {
              setStatusFilter('pending');
              setCurrentPage(1);
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>
              schedule
            </span>
            <span>
              {t('order.status_pending')} ({getStatusCount(deliveryFilter, 'pending')})
            </span>
          </button>

          {(deliveryFilter || 'all') !== 'pickup' && (
            <>
              <button
                type="button"
                className={`${styles.filterChip} ${statusFilter === 'shipping' ? styles.filterChipActive : ''}`}
                onClick={() => {
                  setStatusFilter('shipping');
                  setCurrentPage(1);
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>
                  local_shipping
                </span>
                <span>
                  {t('order.status_shipping')} ({getStatusCount(deliveryFilter, 'shipping')})
                </span>
              </button>
              <button
                type="button"
                className={`${styles.filterChip} ${statusFilter === 'delivered' ? styles.filterChipActive : ''}`}
                onClick={() => {
                  setStatusFilter('delivered');
                  setCurrentPage(1);
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>
                  check_circle
                </span>
                <span>
                  {t('order.status_delivered')} ({getStatusCount(deliveryFilter, 'delivered')})
                </span>
              </button>
            </>
          )}

          {(deliveryFilter || 'all') === 'pickup' && (
            <button
              type="button"
              className={`${styles.filterChip} ${statusFilter === 'picked_up' ? styles.filterChipActive : ''}`}
              onClick={() => {
                setStatusFilter('picked_up');
                setCurrentPage(1);
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>
                storefront
              </span>
              <span>
                {t('order.status_picked_up')} ({getStatusCount('pickup', 'picked_up')})
              </span>
            </button>
          )}
          {(search || statusFilter !== 'all' || deliveryFilter !== 'all') && (
            <button
              type="button"
              className={styles.filterChip}
              onClick={clearFilters}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>
                filter_alt_off
              </span>
              <span>{t('common.clear_filters')}</span>
            </button>
          )}
        </div>

        <div className={styles.deliveryControls}>
          <div className={styles.searchWrapper}>
            <div className={styles.searchField}>
              <div className={styles.searchIcon}>
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                type="text"
                className={styles.searchInput}
                placeholder={
                  t('common.search')
                }
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className={styles.deliveryTabs}>
            <button
              type="button"
              onClick={() => {
                setDeliveryFilter('shipping');
                setCurrentPage(1);
              }}
              className={`${styles.deliveryTab} ${deliveryFilter === 'shipping' ? styles.deliveryTabActive : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                local_shipping
              </span>
              {t('order.shipping') || 'Shipping'}
            </button>
            <button
              type="button"
              onClick={() => {
                setDeliveryFilter('pickup');
                setCurrentPage(1);
              }}
              className={`${styles.deliveryTab} ${deliveryFilter === 'pickup' ? styles.deliveryTabActive : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                storefront
              </span>
              {t('order.pickup') || 'Pickup'}
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}>{t('common.loading') || 'Loading...'}</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>{t('order.no_orders_found') || 'No orders found'}</div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className={styles.tableHeadCell}>{t('order.order_id') || 'Order ID'}</th>
                    <th className={styles.tableHeadCell}>{t('withdraw.withdraw_date') || t('common.date') || 'Date'}</th>
                    <th className={styles.tableHeadCell}>{t('order.order_items') || 'Items'}</th>
                    <th className={styles.tableHeadCell}>{t('order.tracking') || 'Tracking'}</th>
                    <th className={styles.tableHeadCell}>{t('order.delivery_method') || 'Delivery Method'}</th>
                    <th className={styles.tableHeadCell}>{t('common.total') || 'Total'}</th>
                    <th className={styles.tableHeadCell}>{t('common.status') || 'Status'}</th>
                    <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>{t('common.action') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {currentOrders.map((order) => (
                    <tr key={order.id} className={styles.tableRow}>
                      <td className={styles.tableCell}>
                        <span className={styles.orderId}>
                          {order.orderNumber || `#${order.id?.slice(-8).toUpperCase() || 'N/A'}`}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.orderDate}>{formatDate(order.withdrawDate)}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.orderItems}>
                          {order.items && order.items.length > 0 ? (
                            <span className={styles.itemCount}>
                              {order.items
                                .map((item) => item.productName)
                                .join(', ')
                                .slice(0, 50)}
                              {order.items.map((item) => item.productName).join(', ').length > 50 ? '...' : ''}
                            </span>
                          ) : (
                            <span className={styles.itemCount}>{t('order.no_items')}</span>
                          )}
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#4c669a' }}>
                          {order.trackingNumber || '-'}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.itemCount}>{getDeliveryText(order.deliveryMethod)}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.orderTotal}>฿{(order.total || 0).toLocaleString()}</span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.statusBadge} ${getStatusClass(order.shippingStatus)}`}>
                          <span className={styles.statusDot}></span>
                          {getStatusText(order.shippingStatus)}
                        </span>
                      </td>
                      <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                        <button
                          type="button"
                          className={styles.viewDetailsButton}
                          onClick={() => navigate(`/staff/orders/${order.id}`)}
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
                {t('common.showing')}{' '}
                <span className={styles.paginationInfoHighlight}>{startShowing}</span> '-'{' '}
                <span className={styles.paginationInfoHighlight}>{endShowing}</span> {t('common.of')}{' '}
                <span className={styles.paginationInfoHighlight}>{filtered.length}</span> {t('common.items')}
              </span>
              <div className={styles.paginationButtons}>
                <button
                  type="button"
                  className={styles.paginationButton}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                {buildPageRange().map((page) => (
                  <button
                    key={page}
                    type="button"
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
                      type="button"
                      className={styles.paginationButton}
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  type="button"
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
