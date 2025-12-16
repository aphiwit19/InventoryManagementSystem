import { useEffect, useMemo, useState } from 'react';
import { getAllProducts, getInventoryHistory } from '../../services';
import { useTranslation } from 'react-i18next';
import DatePicker, { registerLocale } from 'react-datepicker';
import { th, enUS } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './InventoryHistory.module.css';

// Register locales
registerLocale('th', th);
registerLocale('en', enUS);

export default function InventoryHistoryIndex() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  
  const currentLocale = i18n.language?.startsWith('en') ? 'en' : 'th';
  const dateFormat = currentLocale === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy';
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    const load = async () => {
      setLoadingProducts(true);
      setLoadingHistory(true);
      try {
        const list = await getAllProducts();
        const allRows = [];
        for (const p of list) {
          try {
            const rows = await getInventoryHistory(p.id);
            rows.forEach((r) => {
              allRows.push({
                ...r,
                productId: p.id,
                productName: p.productName || '-',
                productImage: p.image || '',
              });
            });
          } catch (e) {
            console.error('Error loading history for product', p.id, e);
          }
        }
        setHistory(allRows);
      } finally {
        setLoadingProducts(false);
        setLoadingHistory(false);
      }
    };
    load();
  }, []);

  const formatDate = (ts) => {
    if (!ts) return { date: '-', time: '' };
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return {
      date: d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const filteredHistory = useMemo(() => {
    let rows = history;

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => (r.productName || '').toLowerCase().includes(q));
    }
    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      rows = rows.filter(r => {
        const ts = r.date?.toDate ? r.date.toDate().getTime() : new Date(r.date).getTime();
        return ts >= start.getTime();
      });
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      rows = rows.filter(r => {
        const ts = r.date?.toDate ? r.date.toDate().getTime() : new Date(r.date).getTime();
        return ts <= end.getTime();
      });
    }
    if (typeFilter !== 'all') rows = rows.filter(r => (r.type || 'in') === typeFilter);

    const sorted = [...rows].sort((a, b) => {
      const ta = a.date?.toDate ? a.date.toDate().getTime() : new Date(a.date).getTime();
      const tb = b.date?.toDate ? b.date.toDate().getTime() : new Date(b.date).getTime();
      return tb - ta;
    });

    return sorted;
  }, [history, typeFilter, fromDate, toDate, search]);

  const totalIn = useMemo(() => {
    return filteredHistory.reduce((sum, r) => {
      if ((r.type || 'in') === 'in' && r.costPrice !== null && r.costPrice !== undefined) {
        return sum + (parseFloat(r.costPrice || 0) * parseInt(r.quantity || 0));
      }
      return sum;
    }, 0);
  }, [filteredHistory]);

  const totalOut = useMemo(() => {
    return filteredHistory.reduce((sum, r) => {
      if ((r.type || 'in') === 'out' && r.costPrice !== null && r.costPrice !== undefined) {
        return sum + (parseFloat(r.costPrice || 0) * parseInt(r.quantity || 0));
      }
      return sum;
    }, 0);
  }, [filteredHistory]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filteredHistory.slice(startIndex, endIndex);

  useEffect(() => { setPage(1); }, [typeFilter, fromDate, toDate, search]);

  const handlePageChange = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildPageRange = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    let start = currentPage - 2;
    let end = currentPage + 2;
    if (start < 1) { start = 1; end = 5; }
    if (end > totalPages) { end = totalPages; start = totalPages - 4; }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const getTypeBadge = (type) => {
    if (type === 'out') {
      return { class: styles.typeBadgeOut, icon: 'arrow_upward', label: t('inventory.stock_out') };
    }
    return { class: styles.typeBadgeIn, icon: 'arrow_downward', label: t('inventory.stock_in') };
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>{t('inventory.inventory_in_out_history')}</h1>
            <p className={styles.pageSubtitle}>{t('inventory.view_all_movements')}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          {/* Search */}
          <div className={styles.searchWrapper}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('inventory.search_product_name')}
              className={styles.searchInput}
            />
          </div>

          {/* From Date */}
          <div className={styles.datePickerWrapper}>
            <span className={`material-symbols-outlined ${styles.datePickerIcon}`}>calendar_today</span>
            <DatePicker
              selected={fromDate}
              onChange={(date) => setFromDate(date)}
              locale={currentLocale}
              dateFormat={dateFormat}
              placeholderText={t('common.from_date')}
              isClearable
              className={styles.dateInput}
            />
          </div>

          {/* To Date */}
          <div className={styles.datePickerWrapper}>
            <span className={`material-symbols-outlined ${styles.datePickerIcon}`}>calendar_today</span>
            <DatePicker
              selected={toDate}
              onChange={(date) => setToDate(date)}
              locale={currentLocale}
              dateFormat={dateFormat}
              placeholderText={t('common.to_date')}
              isClearable
              className={styles.dateInput}
            />
          </div>

          {/* Type Filter */}
          <div className={styles.selectWrapper}>
            <span className={`material-symbols-outlined ${styles.selectIcon}`}>tune</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="all">{t('common.all_types')}</option>
              <option value="in">{t('inventory.stock_in')}</option>
              <option value="out">{t('inventory.stock_out')}</option>
            </select>
            <span className={`material-symbols-outlined ${styles.selectArrow}`}>expand_more</span>
          </div>

        </div>

        {/* Summary Cards */}
        {!loadingHistory && filteredHistory.length > 0 && (
          <div className={styles.summaryCards}>
            <div className={`${styles.summaryCard} ${styles.summaryCardIn}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>arrow_downward</span>
              Stock In: ฿{totalIn.toLocaleString()}
            </div>
            <div className={`${styles.summaryCard} ${styles.summaryCardOut}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>arrow_upward</span>
              Stock Out: ฿{totalOut.toLocaleString()}
            </div>
          </div>
        )}

        {/* Table */}
        <div className={styles.tableContainer}>
          {loadingHistory || loadingProducts ? (
            <div className={styles.loadingState}>
              <p className={styles.loadingText}>{t('inventory.loading_history')}</p>
            </div>
          ) : pageItems.length === 0 ? (
            <div className={styles.emptyState}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1rem', display: 'block' }}>inventory_2</span>
              {t('inventory.no_data_found')}
            </div>
          ) : (
            <>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead className={styles.tableHead}>
                    <tr>
                      <th className={styles.tableHeadCell}>{t('common.date')}</th>
                      <th className={styles.tableHeadCell}>{t('product.product')}</th>
                      <th className={styles.tableHeadCell}>Type</th>
                      <th className={styles.tableHeadCell}>{t('inventory.history_source')}</th>
                      <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>{t('common.quantity')}</th>
                      <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>{t('inventory.cost_per_unit')}</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {pageItems.map((h) => {
                      const isOut = (h.type || 'in') === 'out';
                      const typeInfo = getTypeBadge(h.type || 'in');
                      const { date } = formatDate(h.date);
                      const unitCost = (h.costPrice === null || h.costPrice === undefined) ? null : parseFloat(h.costPrice || 0);

                      return (
                        <tr key={h.id} className={styles.tableRow}>
                          <td className={styles.tableCell}>
                            <span className={styles.dateText}>{date}</span>
                          </td>
                          <td className={styles.tableCell}>
                            <div className={styles.productCell}>
                              <div className={styles.productImage}>
                                {h.productImage ? (
                                  <img src={h.productImage} alt={h.productName} />
                                ) : (
                                  <span className="material-symbols-outlined" style={{ color: '#cbd5e1', fontSize: '1.25rem' }}>inventory_2</span>
                                )}
                              </div>
                              <div className={styles.productInfo}>
                                <span className={styles.productName}>{h.productName}</span>
                                <span className={styles.productSku}>{h.productId?.slice(0, 8) || '-'}</span>
                              </div>
                            </div>
                          </td>
                          <td className={styles.tableCell}>
                            <span className={`${styles.typeBadge} ${typeInfo.class}`}>
                              <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>{typeInfo.icon}</span>
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className={styles.tableCell}>
                            <span className={styles.reasonText}>
                              {h.source || '-'}
                            </span>
                          </td>
                          <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                            <span className={isOut ? styles.quantityNegative : styles.quantityPositive}>
                              {isOut ? '-' : '+'}{parseInt(h.quantity || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                            <span className={styles.stockLevel}>
                              {unitCost === null ? '-' : `฿${unitCost.toLocaleString()}`}
                            </span>
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
                  <div className={styles.paginationInfo}>
                    Showing <span className={styles.paginationInfoHighlight}>{startIndex + 1}</span> to <span className={styles.paginationInfoHighlight}>{Math.min(endIndex, filteredHistory.length)}</span> of <span className={styles.paginationInfoHighlight}>{filteredHistory.length}</span> results
                  </div>
                  <div className={styles.paginationButtons}>
                    <button
                      className={styles.paginationArrow}
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>chevron_left</span>
                    </button>
                    {buildPageRange().map((p) => (
                      <button
                        key={p}
                        className={`${styles.paginationNumber} ${currentPage === p ? styles.paginationNumberActive : ''}`}
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </button>
                    ))}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className={styles.paginationEllipsis}>...</span>
                        <button
                          className={styles.paginationNumber}
                          onClick={() => handlePageChange(totalPages)}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    <button
                      className={styles.paginationArrow}
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
