import { useEffect, useMemo, useState } from 'react';
import { getAllProducts, getInventoryHistory } from '../../services';

export default function InventoryHistoryIndex() {
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all'); // all | in | out
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);

  useEffect(() => {
    const load = async () => {
      setLoadingProducts(true);
      setLoadingHistory(true);
      try {
        const list = await getAllProducts();
        // load inventory history for all products
        const allRows = [];
        for (const p of list) {
          try {
            const rows = await getInventoryHistory(p.id);
            rows.forEach((r) => {
              allRows.push({
                ...r,
                productId: p.id,
                productName: p.productName || '-',
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
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('th-TH');
  };

  // filter by date range and type
  const filteredHistory = useMemo(() => {
    let rows = history;

    // filter by product name search
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

    // sort by date desc (latest first)
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

  // pagination
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, currentPage, pageSize]);

  // reset page when filters change
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

  return (
    <div style={{ padding: '32px 24px', background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)', minHeight: '100vh', boxSizing: 'border-box' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          padding: '20px 24px',
          borderRadius: 18,
          marginBottom: 20,
          boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 4px 12px rgba(37,99,235,0.08)',
          border: '1px solid rgba(255,255,255,0.9)',
        }}
      >
        <h1 style={{ margin: 0, color: '#1e40af', fontSize: 24, fontWeight: 700 }}>ประวัติสินค้าเข้า–ออกคลัง</h1>
        <div style={{ fontSize: 14, color: '#3b82f6', marginTop: 6 }}>ดูประวัติการเคลื่อนไหวสินค้าทั้งหมด</div>
      </div>

      {/* Filters */}
      <div
        style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: 18,
          padding: '20px 24px',
          boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 4px 12px rgba(37,99,235,0.08)',
          border: '1px solid rgba(255,255,255,0.9)',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 14, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: 12,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            onClick={() => { setSearch(''); setFromDate(''); setToDate(''); setTypeFilter('all'); }}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
              color: '#fff',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(100,116,139,0.3)',
            }}
          >
            ล้าง
          </button>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 14,
              outline: 'none',
              color: '#1e40af',
              fontWeight: 500,
            }}
          />
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 14,
              outline: 'none',
              color: '#1e40af',
              fontWeight: 500,
            }}
          />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 14,
              outline: 'none',
              color: '#1e40af',
              fontWeight: 500,
              background: '#fff',
              cursor: 'pointer',
              minWidth: 140,
            }}
          >
            <option value="all">ทุกประเภท</option>
            <option value="in">เข้า (IN)</option>
            <option value="out">ออก (OUT)</option>
          </select>
        </div>
        {loadingProducts && (
          <div style={{ marginTop: 12, color: '#64748b', fontSize: 14 }}>กำลังโหลดสินค้า...</div>
        )}
      </div>

      {/* Summary */}
      {!loadingHistory && filteredHistory.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <span
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
            }}
          >
            📥 IN ฿{totalIn.toLocaleString()}
          </span>
          <span
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
            }}
          >
            📤 OUT ฿{totalOut.toLocaleString()}
          </span>
        </div>
      )}

      {/* List */}
      <div
        style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: 18,
          boxShadow: '0 10px 40px rgba(15,23,42,0.12), 0 4px 16px rgba(37,99,235,0.08)',
          border: '1px solid rgba(255,255,255,0.9)',
          overflow: 'hidden',
        }}
      >
        {loadingHistory ? (
          <div style={{ padding: 20, color:'#666' }}>กำลังโหลดประวัติ...</div>
        ) : pageItems.length === 0 ? (
          <div style={{ padding: 20, color:'#777' }}>ไม่พบข้อมูลตามตัวกรอง</div>
        ) : (
          <>
            <div style={{ padding: '8px 8px 0 8px', color:'#666', textAlign:'right' }}>Page {currentPage} of {totalPages} | Showing {pageItems.length} of {filteredHistory.length}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, padding:8 }}>
              {pageItems.map(h => {
                const isOut = (h.type || 'in') === 'out';
                const sign = isOut ? '-' : '+';
                const color = isOut ? '#e53935' : '#2e7d32';
                const unitCost = (h.costPrice === null || h.costPrice === undefined) ? null : parseFloat(h.costPrice || 0);
                const total = unitCost === null ? 0 : unitCost * parseInt(h.quantity || 0);
                return (
                  <div key={h.id} style={{ display:'grid', gridTemplateColumns:'150px 1fr 120px', alignItems:'center', gap:12, padding:'14px 16px', border:'1px solid #eee', borderRadius:12 }}>
                    <div style={{ color, fontWeight:700, fontSize:18 }}>฿{(isOut ? total : total).toLocaleString(undefined,{minimumFractionDigits:0})}</div>
                    <div>
                      <div style={{ fontWeight:700, marginBottom:6, fontSize:16, color:'#333' }}>{h.productName || '-'}</div>
                      <div style={{ lineHeight:1.5 }}>
                        <span style={{ background: isOut ? '#fdecea' : '#e8f5e9', color, padding:'4px 8px', borderRadius:12, fontSize:12, fontWeight:700 }}>{(h.type || 'in').toUpperCase()}</span>
                        <span style={{ marginLeft:8, color:'#444', fontSize:14 }}>จำนวน {sign}{parseInt(h.quantity || 0).toLocaleString()} | ต้นทุน/หน่วย {unitCost === null ? '-' : `฿${unitCost.toLocaleString()}`}</span>
                      </div>
                      {h.source && <div style={{ marginTop:6, color:'#666', fontSize:13 }}>ที่มา: {h.source}</div>}
                    </div>
                    <div style={{ textAlign:'right', color:'#666', fontSize:13 }}>{formatDate(h.date)}</div>
                  </div>
                );
              })}
            </div>

          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            padding: '20px 24px',
            marginTop: 16,
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: 18,
            boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 4px 12px rgba(37,99,235,0.08)',
            border: '1px solid rgba(255,255,255,0.9)',
          }}
        >
          <button
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            style={{
              padding: '10px 18px',
              border: '2px solid #e2e8f0',
              borderRadius: 10,
              background: currentPage === 1 ? '#f1f5f9' : '#fff',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              color: currentPage === 1 ? '#94a3b8' : '#1e40af',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Previous
          </button>
          {buildPageRange().map((p) => (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              style={{
                padding: '10px 16px',
                border: currentPage === p ? 'none' : '2px solid #e2e8f0',
                borderRadius: 10,
                background: currentPage === p
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  : '#fff',
                color: currentPage === p ? '#fff' : '#374151',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                boxShadow: currentPage === p ? '0 2px 8px rgba(37,99,235,0.4)' : 'none',
                minWidth: 44,
              }}
            >
              {p}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            style={{
              padding: '10px 18px',
              border: '2px solid #e2e8f0',
              borderRadius: 10,
              background: currentPage === totalPages ? '#f1f5f9' : '#fff',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              color: currentPage === totalPages ? '#94a3b8' : '#1e40af',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

