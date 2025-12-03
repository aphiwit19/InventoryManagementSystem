import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getWithdrawalsByUser } from '../../services';

const statuses = ['รอดำเนินการ', 'กำลังดำเนินการส่ง', 'ส่งสำเร็จ'];

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const load = async () => {
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
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.uid]);

  const filtered = orders.filter(o => {
    const hit = (
      (o.trackingNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.shippingCarrier || '').toLowerCase().includes(search.toLowerCase())
    );
    const statusOk = statusFilter === 'all' || (o.shippingStatus || 'รอดำเนินการ') === statusFilter;
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

  return (
    <div style={{ padding: '30px', background: '#f0f4ff', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto 24px',
          background:
            'linear-gradient(135deg, #1D4ED8 0%, #2563EB 40%, #1D9BF0 75%, #4F46E5 100%)',
          borderRadius: 28,
          padding: '18px 24px 18px',
          boxShadow: '0 12px 28px rgba(15,23,42,0.28)',
          color: '#fff',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 220 }}>
            <div
              style={{
                fontSize: 12,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                opacity: 0.85,
              }}
            >
              MY ORDERS
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.03em',
                marginTop: 4,
              }}
            >
              คำสั่งซื้อของฉัน
            </div>
            <div style={{ fontSize: 14, opacity: 0.9, marginTop: 6 }}>
              ดูสถานะการจัดส่งและรายละเอียดคำสั่งซื้อทั้งหมดของคุณ
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flex: '1 1 260px',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 18,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                position: 'relative',
                flex: '2 1 260px',
                minWidth: 220,
                maxWidth: 360,
              }}
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหา (ขนส่ง / Tracking)"
                style={{
                  width: '100%',
                  padding: '8px 34px 8px 14px',
                  borderRadius: 999,
                  border: '1px solid rgba(15,23,42,0.12)',
                  fontSize: 13,
                  outline: 'none',
                  background: '#F9FAFB',
                  color: '#0F172A',
                  boxShadow: '0 2px 6px rgba(15,23,42,0.18)',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#4B5563',
                  fontSize: 15,
                }}
              >
                🔍
              </span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '10px 18px',
                borderRadius: 12,
                border: '2px solid #e2e8f0',
                fontSize: 14,
                fontWeight: 500,
                minWidth: 160,
                background: '#ffffff',
                color: '#1e40af',
                flexShrink: 0,
                marginLeft: 'auto',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all" style={{ color: '#374151', background: '#fff' }}>สถานะทั้งหมด</option>
              {statuses.map((s) => (
                <option key={s} value={s} style={{ color: '#374151', background: '#fff' }}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders list */}
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div
          style={{
            borderRadius: 26,
            padding: 16,
            background: 'rgba(15,23,42,0.04)',
            boxShadow: '0 10px 30px rgba(15,23,42,0.06)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 12,
                padding: '6px 12px',
                borderRadius: 999,
                background: '#fff',
                border: '1px solid #E5E7EB',
                color: '#111827',
                boxShadow: '0 2px 6px rgba(15,23,42,0.08)',
                whiteSpace: 'nowrap',
              }}
            >
              รวม {filtered.length} รายการ
            </div>
          </div>
          {loading ? (
            <div
              style={{
                background: '#fff',
                borderRadius: 20,
                padding: 40,
                textAlign: 'center',
                color: '#6B7280',
                boxShadow: '0 4px 12px rgba(15,23,42,0.08)'
              }}
            >
              กำลังโหลดคำสั่งซื้อของคุณ...
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                background: '#fff',
                borderRadius: 20,
                padding: 40,
                textAlign: 'center',
                color: '#6B7280',
                boxShadow: '0 4px 12px rgba(15,23,42,0.08)'
              }}
            >
              ยังไม่มีคำสั่งซื้อที่ตรงกับเงื่อนไข
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {currentOrders.map((o) => {
              const dateStr = new Date(
                o.withdrawDate?.seconds ? o.withdrawDate.seconds * 1000 : o.withdrawDate
              ).toLocaleDateString('th-TH');
              const status = o.shippingStatus || 'รอดำเนินการ';
              const statusColor =
                status === 'ส่งสำเร็จ'
                  ? '#16A34A'
                  : status === 'กำลังดำเนินการส่ง'
                  ? '#2563EB'
                  : '#F97316';
              const items = o.items || [];
              const itemsText = items.length
                ? items
                    .map((it) => `${it.productName || ''} x${it.quantity || 0}`)
                    .join('\n')
                : '-';

              return (
                <div
                  key={o.id}
                  onClick={() => navigate(`/customer/orders/${o.id}`, { state: { order: o } })}
                  style={{
                    background: '#fff',
                    borderRadius: 18,
                    padding: '14px 18px',
                    boxShadow: '0 4px 10px rgba(15,23,42,0.06)',
                    border: '1px solid #E5E7EB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 16,
                    alignItems: 'stretch',
                    flexWrap: 'wrap',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>เลขคำสั่งซื้อ</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      {o.trackingNumber || '-'}
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>วันที่สั่งซื้อ</div>
                    <div style={{ fontSize: 14, marginBottom: 6 }}>{dateStr}</div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>สินค้า / จำนวน</div>
                    <div
                      style={{
                        fontSize: 13,
                        color: '#374151',
                        marginTop: 2,
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {itemsText}
                    </div>
                  </div>

                  <div style={{ flex: '1.4 1 260px', minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>ที่อยู่จัดส่ง</div>
                    <div
                      style={{
                        fontSize: 14,
                        color: '#374151',
                        marginTop: 2,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {o.requestedAddress || '-'}
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>ขนส่ง</div>
                      <div style={{ fontSize: 14, color: '#374151' }}>
                        {o.shippingCarrier || '-'}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      flex: '0 0 190px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      gap: 6
                    }}
                  >
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>สถานะการจัดส่ง</div>
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: 4,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: `${statusColor}14`,
                          color: statusColor,
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      >
                        {status}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>ยอดรวม</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
                        ฿{(o.total || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filtered.length > 0 && totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              padding: '18px 22px',
              marginTop: 16,
              background: '#ffffff',
              borderRadius: 18,
              boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
              border: '1px solid #e5e7eb',
            }}
          >
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: '2px solid #e2e8f0',
                background: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                color: currentPage === 1 ? '#94a3b8' : '#1e40af',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Previous
            </button>
            {buildPageRange().map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: currentPage === page ? 'none' : '2px solid #e2e8f0',
                  background:
                    currentPage === page
                      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                      : '#ffffff',
                  color: currentPage === page ? '#ffffff' : '#374151',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow:
                    currentPage === page
                      ? '0 2px 8px rgba(37,99,235,0.4)'
                      : 'none',
                  minWidth: 40,
                }}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: '2px solid #e2e8f0',
                background: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                color: currentPage === totalPages ? '#94a3b8' : '#1e40af',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
