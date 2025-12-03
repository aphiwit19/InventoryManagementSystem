import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getWithdrawalsByUser } from '../../services';

const statuses = ['รอดำเนินการ', 'รับของแล้ว', 'กำลังดำเนินการส่ง', 'ส่งสำเร็จ'];

const getStatusStyle = (status) => {
  switch (status) {
    case 'รอดำเนินการ':
      return { background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d' };
    case 'รับของแล้ว':
      return { background: '#d1fae5', color: '#047857', border: '1px solid #6ee7b7' };
    case 'กำลังดำเนินการส่ง':
      return { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' };
    case 'ส่งสำเร็จ':
      return { background: '#d1fae5', color: '#047857', border: '1px solid #6ee7b7' };
    default:
      return { background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' };
  }
};

export default function StaffOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const load = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const list = await getWithdrawalsByUser(user.uid);
      setOrders(list);
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
      (o.requestedBy || '').toLowerCase().includes(search.toLowerCase())
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
    <div style={{ padding: '32px 24px', background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)', minHeight: '100vh', boxSizing: 'border-box' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #0ea5e9 100%)',
          padding: '24px 28px',
          borderRadius: 18,
          marginBottom: 16,
          boxShadow: '0 10px 40px rgba(30,64,175,0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 6px', color: '#fff', fontSize: 26, fontWeight: 700 }}>
            ติดตามสถานะคำสั่งเบิก
          </h1>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
            ตรวจสอบสถานะการจัดส่งและติดตามสถานะคำสั่งเบิกของคุณ
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา (ชื่อลูกค้า/Tracking)"
              style={{
                padding: '12px 44px 12px 16px',
                borderRadius: 12,
                border: 'none',
                width: 260,
                fontSize: 14,
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#3b82f6', fontSize: 16 }}>🔍</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              border: '2px solid #e2e8f0',
              fontSize: 14,
              fontWeight: 500,
              background: '#ffffff',
              color: '#1e40af',
              cursor: 'pointer',
              outline: 'none',
              minWidth: 160,
            }}
          >
            <option value="all" style={{ color: '#374151', background: '#fff' }}>สถานะทั้งหมด</option>
            {statuses.map((s) => (
              <option key={s} value={s} style={{ color: '#374151', background: '#fff' }}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ background: '#fff', padding: 50, borderRadius: 16, textAlign: 'center', boxShadow: '0 4px 20px rgba(15,23,42,0.08)' }}>
          <div style={{ color: '#64748b', fontSize: 15 }}>กำลังโหลด...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', padding: 50, borderRadius: 16, textAlign: 'center', boxShadow: '0 4px 20px rgba(15,23,42,0.08)' }}>
          <div style={{ color: '#64748b', fontSize: 15 }}>ไม่พบรายการ</div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(15,23,42,0.08)' }}>
          {/* Table Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '0.8fr 1fr 0.9fr 1.4fr 1.2fr 0.9fr 1.1fr 1fr 0.9fr',
              padding: '14px 20px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              fontWeight: 600,
              fontSize: 13,
              color: '#1e40af',
              borderBottom: '2px solid #e0e7ff',
            }}
          >
            <div>วันที่เบิก</div>
            <div>ผู้เบิก</div>
            <div>ผู้รับ</div>
            <div>สินค้า / จำนวน</div>
            <div>ที่อยู่รับของ</div>
            <div>ขนส่ง</div>
            <div>TRACKING</div>
            <div>สถานะ</div>
            <div style={{ textAlign: 'right' }}>ราคารวม</div>
          </div>

          {/* Table Rows */}
          {currentOrders.map((o) => {
            const items = o.items || [];
            const itemsText = items.length
              ? items.map((it) => `${it.productName || ''} x${it.quantity || 0}`).join('\n')
              : '-';
            const status = o.shippingStatus || 'รอดำเนินการ';
            const statusStyle = getStatusStyle(status);

            return (
              <div
                key={o.id}
                onClick={() => navigate(`/staff/orders/${o.id}`, { state: { order: o } })}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '0.8fr 1fr 0.9fr 1.4fr 1.2fr 0.9fr 1.1fr 1fr 0.9fr',
                  padding: '16px 20px',
                  borderBottom: '1px solid #f1f5f9',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
              >
                <div style={{ color: '#111827', fontSize: 13 }}>
                  {new Date(o.withdrawDate?.seconds ? o.withdrawDate.seconds * 1000 : o.withdrawDate).toLocaleDateString('th-TH')}
                </div>
                <div style={{ color: '#1e40af', fontWeight: 600, fontSize: 13 }}>{o.requestedBy || '-'}</div>
                <div style={{ color: '#111827', fontSize: 13 }}>{o.receivedBy || '-'}</div>
                <div style={{ whiteSpace: 'pre-wrap', color: '#111827', fontSize: 12, lineHeight: 1.5 }}>{itemsText}</div>
                <div style={{ whiteSpace: 'pre-wrap', color: '#111827', fontSize: 12 }}>{o.receivedAddress || '-'}</div>
                <div style={{ color: '#1e40af', fontWeight: 500, fontSize: 13 }}>{o.shippingCarrier || '-'}</div>
                <div style={{ fontFamily: 'monospace', color: '#111827', fontSize: 12 }}>{o.trackingNumber || '-'}</div>
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      ...statusStyle,
                    }}
                  >
                    {status}
                  </span>
                </div>
                <div style={{ textAlign: 'right', color: '#111827', fontWeight: 700, fontSize: 14 }}>
                  ฿{(o.total || 0).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
  );
}
