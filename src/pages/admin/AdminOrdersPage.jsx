import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAllWithdrawals } from '../../services';
import { useTranslation } from 'react-i18next';
import styles from './AdminOrdersPage.module.css';

export default function AdminOrdersPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const initialSource = params.get('source') || 'all';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState(initialSource);
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const headingTitle = sourceFilter === 'customer'
    ? t('order.customer_orders')
    : sourceFilter === 'staff'
      ? t('order.staff_orders')
      : t('order.all_orders');

  const searchPlaceholder = t('common.search');

  useEffect(() => {
    setSourceFilter(initialSource);
  }, [initialSource]);

  const load = async () => {
    setLoading(true);
    try {
      const list = await getAllWithdrawals();
      setOrders(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [location.key]);

  const filtered = orders.filter(o => {
    const hit = (
      o.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.requestedBy?.toLowerCase().includes(search.toLowerCase()) ||
      o.receivedBy?.toLowerCase().includes(search.toLowerCase())
    );
    const statusOk = statusFilter === 'all' || (o.shippingStatus || 'pending') === statusFilter;
    const sourceOk = sourceFilter === 'all' || (o.createdSource || '') === sourceFilter;
    const deliveryOk = deliveryFilter === 'all' || ((o.deliveryMethod || 'shipping') === deliveryFilter);
    return hit && statusOk && sourceOk && deliveryOk;
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

  const goDetail = (order) => {
    if (!order?.id) return;
    navigate(`/admin/orders/${order.id}`, { state: { order } });
  };

  const formatDate = (dateValue) => {
    return new Date(
      dateValue?.seconds ? dateValue.seconds * 1000 : dateValue
    ).toLocaleDateString('th-TH');
  };

  const formatItems = (items) => {
    if (!items || items.length === 0) return '-';
    return items.map((it) => `${it.productName || ''} x${it.quantity || 0}`).join('\n');
  };

  const formatTotal = (total) => {
    return typeof total === 'number'
      ? total.toLocaleString()
      : (parseFloat(total || 0) || 0).toLocaleString();
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerInfo}>
            <h1 className={styles.pageTitle}>{headingTitle}</h1>
            <p className={styles.pageSubtitle}>{t('admin.system_management')}</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.searchWrapper}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className={styles.searchInput}
              />
              <span className={styles.searchIcon}>🔍</span>
            </div>
            {initialSource === 'all' && (
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">{t('common.all_types')}</option>
                <option value="customer">{t('order.source_customer')}</option>
                <option value="staff">{t('order.source_staff')}</option>
              </select>
            )}
            {sourceFilter === 'staff' && (
              <div className={styles.deliveryTabs}>
                <button
                  type="button"
                  onClick={() => setDeliveryFilter('shipping')}
                  className={`${styles.deliveryTab} ${deliveryFilter === 'shipping' ? styles.deliveryTabActive : ''}`}
                >
                  📦 {t('order.shipping')}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryFilter('pickup')}
                  className={`${styles.deliveryTab} ${deliveryFilter === 'pickup' ? styles.deliveryTabActive : ''}`}
                >
                  🏪 {t('order.pickup')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.loadingState}>{t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>{t('common.no_data')}</div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              {sourceFilter === 'customer' ? (
                <>
                  {/* Customer Orders Table */}
                  <div className={styles.tableHeaderCustomer}>
                    <div>{t('common.date')}</div>
                    <div>{t('withdraw.requested_by')}</div>
                    <div>{t('order.order_items')}</div>
                    <div>{t('common.total')}</div>
                    <div>{t('common.address')}</div>
                    <div>{t('common.action')}</div>
                  </div>
                  {currentOrders.map((o) => {
                    const isProcessed = (o.shippingStatus || 'pending') !== 'pending';
                    return (
                      <div key={o.id} className={styles.tableRowCustomer}>
                        <div>{formatDate(o.withdrawDate)}</div>
                        <div>{o.requestedBy || '-'}</div>
                        <div className={styles.cellItems}>{formatItems(o.items)}</div>
                        <div className={styles.cellTotal}>฿{formatTotal(o.total)}</div>
                        <div className={styles.cellAddress}>{o.requestedAddress || '-'}</div>
                        <div className={styles.cellAction}>
                          <button
                            type="button"
                            onClick={() => goDetail(o)}
                            className={`${styles.actionButton} ${isProcessed ? styles.actionButtonCompleted : ''}`}
                          >
                            {isProcessed ? t('order.status_completed') : t('order.manage')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  {/* Staff Orders Table */}
                  <div className={styles.tableHeaderStaff}>
                    <div>{t('common.date')}</div>
                    <div>{t('withdraw.requested_by')}</div>
                    <div>{t('order.receiver')}</div>
                    <div>{t('order.order_items')}</div>
                    <div>{t('order.delivery_method')}</div>
                    <div>{t('common.address')}</div>
                    <div>{t('order.order_note')}</div>
                    <div>{t('order.manage')}</div>
                  </div>
                  {currentOrders.map((o) => {
                    if (deliveryFilter === 'shipping' && (o.deliveryMethod || 'shipping') !== 'shipping') return null;
                    if (deliveryFilter === 'pickup' && (o.deliveryMethod || 'shipping') !== 'pickup') return null;

                    const deliveryText = (o.deliveryMethod || 'shipping') === 'pickup' ? t('order.pickup') : t('order.shipping');
                    const isProcessed = (o.shippingStatus || 'pending') !== 'pending';

                    return (
                      <div key={o.id} className={styles.tableRowStaff}>
                        <div>{formatDate(o.withdrawDate)}</div>
                        <div>{o.requestedBy || '-'}</div>
                        <div>{o.receivedBy || '-'}</div>
                        <div className={styles.cellItems}>{formatItems(o.items)}</div>
                        <div>{deliveryText}</div>
                        <div className={styles.cellAddress}>{o.receivedAddress || '-'}</div>
                        <div className={styles.cellNote}>{o.note || '-'}</div>
                        <div className={styles.cellAction}>
                          <button
                            type="button"
                            onClick={() => goDetail(o)}
                            className={`${styles.actionButton} ${isProcessed ? styles.actionButtonCompleted : ''}`}
                          >
                            {isProcessed ? t('order.status_completed') : t('order.manage')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={styles.paginationButton}
                >
                  {t('common.previous')}
                </button>
                {buildPageRange().map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(page)}
                    className={`${styles.pageNumber} ${currentPage === page ? styles.pageNumberActive : ''}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={styles.paginationButton}
                >
                  {t('common.next')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
