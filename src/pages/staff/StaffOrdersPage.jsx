import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getWithdrawalsByUser } from '../../services';
import { useTranslation } from 'react-i18next';

export default function StaffOrdersPage() {
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

  const totalOrders = orders.length;
  const completedCount = orders.filter(
    (o) => (o.shippingStatus || 'รอดำเนินการ') === 'ส่งสำเร็จ',
  ).length;
  const inProgressCount = totalOrders - completedCount;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F1F5F9',
        padding: '24px 24px 32px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Page Header with Stats */}
        <section
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '24px 28px',
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: 'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
                fontSize: 24,
                fontWeight: 700,
                color: '#2563EB',
              }}
            >
              {t('order.my_orders')}
            </h1>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 14,
                color: '#64748B',
              }}
            >
              {t('order.order_history') ||
                'จัดการและติดตามสถานะคำสั่งซื้อทั้งหมดของคุณ'}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily:
                    'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#0F172A',
                }}
              >
                {totalOrders}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                {t('order.all_orders')}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily:
                    'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#0F172A',
                }}
              >
                {inProgressCount}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                {t('order.processing')}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily:
                    'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#0F172A',
                }}
              >
                {completedCount}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                {t('order.success')}
              </div>
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section
          style={{
            background: '#FFFFFF',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
            border: '1px solid #E2E8F0',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.4fr) 220px',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('order.search_orders_placeholder') ||
                t('common.search')}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '2px solid #E2E8F0',
                fontSize: 14,
                background: '#F9FAFB',
                outline: 'none',
              }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '2px solid #E2E8F0',
                fontSize: 14,
                background: '#FFFFFF',
                cursor: 'pointer',
                minWidth: 0,
              }}
            >
              <option value="all">{t('common.all_status')}</option>
              <option value="รอดำเนินการ">{t('order.status_pending')}</option>
              <option value="กำลังดำเนินการส่ง">
                {t('order.status_shipping')}
              </option>
              <option value="ส่งสำเร็จ">{t('order.status_delivered')}</option>
            </select>
          </div>
        </section>

        {/* Orders Table */}
        <section
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
            border: '1px solid #E2E8F0',
          }}
        >
          {loading ? (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: '#6B7280',
              }}
            >
              {t('common.loading')}
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: '#6B7280',
              }}
            >
              {t('order.no_orders_found')}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: 800,
                }}
              >
                <thead
                  style={{
                    background: '#F1F5F9',
                  }}
                >
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      รหัสคำสั่งซื้อ
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      วันที่เบิก
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      ผู้ขอเบิก
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      รายการสินค้า
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      ที่อยู่จัดส่ง
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      TRACKING
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      สถานะ
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      รวม
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.map((o) => {
                    const date = new Date(
                      o.withdrawDate?.seconds
                        ? o.withdrawDate.seconds * 1000
                        : o.withdrawDate,
                    );
                    const dateStr = date.toLocaleDateString('th-TH');
                    const timeStr = date.toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const status = o.shippingStatus || 'รอดำเนินการ';
                    const items = o.items || [];

                    let statusClassColor = '#EA580C';
                    let statusBg = 'rgba(249,115,22,0.1)';
                    if (status === 'ส่งสำเร็จ') {
                      statusClassColor = '#059669';
                      statusBg = 'rgba(16,185,129,0.1)';
                    } else if (status === 'กำลังดำเนินการส่ง') {
                      statusClassColor = '#2563EB';
                      statusBg = 'rgba(59,130,246,0.1)';
                    }

                    const itemsTitle = items
                      .map((it) => `${it.productName || ''}`)
                      .filter(Boolean)
                      .join(', ');
                    const itemsDetail = `${items.length || 0} ${
                      t('common.items')
                    }`;

                    return (
                      <tr key={o.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        {/* 1. รหัสคำสั่งซื้อ */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          <div style={{ fontFamily: 'Kanit, system-ui, -apple-system, BlinkMacSystemFont', fontWeight: 700, color: '#2563EB', fontSize: 14 }}>
                            {o.orderNumber || (o.id ? `#${o.id.slice(0, 8).toUpperCase()}` : '-')}
                          </div>
                        </td>
                        {/* 2. วันที่เบิก */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          <div style={{ fontSize: 13, color: '#475569' }}>{dateStr}</div>
                          <div style={{ fontSize: 12, color: '#94A3B8' }}>{timeStr}</div>
                        </td>
                        {/* 3. ผู้ขอเบิก */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>
                            {o.requestedBy || '-'}
                          </div>
                        </td>
                        {/* 4. รายการสินค้า */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>
                            {itemsTitle || '-'}
                          </div>
                          <div style={{ marginTop: 2, fontSize: 12, color: '#94A3B8' }}>
                            {itemsDetail}
                          </div>
                        </td>
                        {/* 5. ที่อยู่จัดส่ง */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top', maxWidth: 200 }}>
                          <div style={{ fontSize: 13, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {o.requestedAddress || '-'}
                          </div>
                        </td>
                        {/* 6. TRACKING */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          <div style={{ fontSize: 13, color: '#475569', fontFamily: 'monospace' }}>
                            {o.trackingNumber || '-'}
                          </div>
                        </td>
                        {/* 7. สถานะ */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 999, background: statusBg, color: statusClassColor, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {status}
                          </span>
                        </td>
                        {/* 8. รวม */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                          <div style={{ fontFamily: 'Kanit, system-ui, -apple-system, BlinkMacSystemFont', fontWeight: 700, fontSize: 16, color: '#0F172A' }}>
                            ฿{(o.total || 0).toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Pagination */}
        {filtered.length > 0 && totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              padding: '16px 18px',
              marginTop: 20,
              background: '#FFFFFF',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
              border: '1px solid #E2E8F0',
            }}
          >
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                minWidth: 40,
                height: 40,
                padding: '0 12px',
                borderRadius: 8,
                border: '2px solid #E2E8F0',
                background:
                  currentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                cursor:
                  currentPage === 1 ? 'not-allowed' : 'pointer',
                color: currentPage === 1 ? '#94A3B8' : '#1D4ED8',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {t('common.previous')}
            </button>
            {buildPageRange().map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                style={{
                  minWidth: 40,
                  height: 40,
                  padding: '0 10px',
                  borderRadius: 8,
                  border:
                    currentPage === page
                      ? 'none'
                      : '2px solid #E2E8F0',
                  background:
                    currentPage === page
                      ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
                      : '#FFFFFF',
                  color: currentPage === page ? '#FFFFFF' : '#111827',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
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
                minWidth: 40,
                height: 40,
                padding: '0 12px',
                borderRadius: 8,
                border: '2px solid #E2E8F0',
                background:
                  currentPage === totalPages ? '#F1F5F9' : '#FFFFFF',
                cursor:
                  currentPage === totalPages ? 'not-allowed' : 'pointer',
                color:
                  currentPage === totalPages ? '#94A3B8' : '#1D4ED8',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {t('common.next')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
