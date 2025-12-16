import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getWithdrawalsByUser } from '../../services';
import { useTranslation } from 'react-i18next';
import styles from './StaffOrdersPage.module.css';

export default function StaffOrdersPage() {
  const { t } = useTranslation();
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
        return bTime - aTime; // ใหม่สุดอยู่บน
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
      (o.orderNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.trackingNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.requestedBy || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.requestedAddress || '').toLowerCase().includes(search.toLowerCase())
    );
    const statusOk = statusFilter === 'all' || (o.shippingStatus || 'รอดำเนินการ') === statusFilter;
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
    if (m === 'pickup') return t('order.pickup') || 'รับเอง';
    return t('order.shipping') || 'จัดส่ง';
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
    return new Date(ms).toLocaleDateString('th-TH');
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'กำลังดำเนินการส่ง':
        return styles.statusShipped;
      case 'ส่งสำเร็จ':
        return styles.statusDelivered;
      case 'รับของแล้ว':
        return styles.statusDelivered;
      case 'ยกเลิก':
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  const getStatusText = (status) => {
    if (status === 'กำลังดำเนินการส่ง') return t('order.status_shipping') || status;
    if (status === 'ส่งสำเร็จ') return t('order.status_delivered') || status;
    if (status === 'รับของแล้ว') return t('order.status_picked_up') || status;
    if (status === 'ยกเลิก') return t('order.status_cancelled') || status;
    return t('order.status_pending') || status || 'รอดำเนินการ';
  };

  const getStatusCount = (method, statusValue) => {
    const normalizedMethod = method || 'all';
    return orders.filter((o) => {
      const m = o.deliveryMethod || 'shipping';
      const methodOk = normalizedMethod === 'all' || m === normalizedMethod;
      const s = o.shippingStatus || 'รอดำเนินการ';
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
            {t('order.order_history') ||
              'จัดการและติดตามสถานะคำสั่งซื้อทั้งหมดของคุณ'}
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
            className={`${styles.filterChip} ${statusFilter === 'รอดำเนินการ' ? styles.filterChipActive : ''}`}
            onClick={() => {
              setStatusFilter('รอดำเนินการ');
              setCurrentPage(1);
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>
              schedule
            </span>
            <span>
              {t('order.status_pending') || 'Pending'} ({getStatusCount(deliveryFilter, 'รอดำเนินการ')})
            </span>
          </button>

          {(deliveryFilter || 'all') !== 'pickup' && (
            <>
              <button
                type="button"
                className={`${styles.filterChip} ${statusFilter === 'กำลังดำเนินการส่ง' ? styles.filterChipActive : ''}`}
                onClick={() => {
                  setStatusFilter('กำลังดำเนินการส่ง');
                  setCurrentPage(1);
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>
                  local_shipping
                </span>
                <span>
                  {t('order.status_shipping') || 'Shipped'} ({getStatusCount(deliveryFilter, 'กำลังดำเนินการส่ง')})
                </span>
              </button>
              <button
                type="button"
                className={`${styles.filterChip} ${statusFilter === 'ส่งสำเร็จ' ? styles.filterChipActive : ''}`}
                onClick={() => {
                  setStatusFilter('ส่งสำเร็จ');
                  setCurrentPage(1);
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>
                  check_circle
                </span>
                <span>
                  {t('order.status_delivered') || 'Delivered'} ({getStatusCount(deliveryFilter, 'ส่งสำเร็จ')})
                </span>
              </button>
            </>
          )}

          {(deliveryFilter || 'all') === 'pickup' && (
            <button
              type="button"
              className={`${styles.filterChip} ${statusFilter === 'รับของแล้ว' ? styles.filterChipActive : ''}`}
              onClick={() => {
                setStatusFilter('รับของแล้ว');
                setCurrentPage(1);
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>
                storefront
              </span>
              <span>
                {t('order.status_picked_up') || 'Picked up'} ({getStatusCount('pickup', 'รับของแล้ว')})
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
              <span>{t('common.clear_filters') || 'Clear'}</span>
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
                  t('ค้นหา') ||
                  t('common.search') ||
                  'Search...'
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
                            <span className={styles.itemCount}>{t('order.no_items') || 'No items'}</span>
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
                        <span className={`${styles.statusBadge} ${getStatusClass(order.shippingStatus || 'รอดำเนินการ')}`}>
                          <span className={styles.statusDot}></span>
                          {getStatusText(order.shippingStatus || 'รอดำเนินการ')}
                        </span>
                      </td>
                      <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                        <button
                          type="button"
                          className={styles.viewDetailsButton}
                          onClick={() => navigate(`/staff/orders/${order.id}`)}
                        >
                          {t('order.view_detail') || t('orderViewDetails') || 'View Details'}
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
                {t('common.showing') || 'Showing'}{' '}
                <span className={styles.paginationInfoHighlight}>{startShowing}</span> {t('common.to') || 'to'}{' '}
                <span className={styles.paginationInfoHighlight}>{endShowing}</span> {t('common.of') || 'of'}{' '}
                <span className={styles.paginationInfoHighlight}>{filtered.length}</span> {t('order.orders') || 'results'}
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
