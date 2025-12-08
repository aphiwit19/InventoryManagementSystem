import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAllWithdrawals } from '../../services';
import { useTranslation } from 'react-i18next';

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
  const [sourceFilter, setSourceFilter] = useState(initialSource); // all | customer | staff
  const [deliveryFilter, setDeliveryFilter] = useState('all'); // all | shipping | pickup
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const headingTitle = sourceFilter === 'customer'
    ? t('order.customer_orders')
    : sourceFilter === 'staff'
      ? t('order.staff_orders')
      : t('order.all_orders');

  const searchPlaceholder = t('common.search');

  // ซิงก์ sourceFilter เมื่อ query string เปลี่ยน (เช่น คลิกเมนู Sidebar คนละประเภท)
  useEffect(() => {
    setSourceFilter(initialSource);
  }, [initialSource]);

  // (UX revert) remove badge styling helper

  const load = async () => {
    setLoading(true);
    try {
      const list = await getAllWithdrawals();
      setOrders(list);
      // initialize edit state
    } finally {
      setLoading(false);
    }
  };

  // โหลดข้อมูลใหม่เมื่อเข้าหน้านี้ครั้งแรกหรือเมื่อกลับมาหน้าด้วย history (location.key เปลี่ยน)
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

  // (UX revert) no counters in filters

  const goDetail = (order) => {
    if (!order?.id) return;
    navigate(`/admin/orders/${order.id}`, { state: { order } });
  };

  return (
    <div style={{ padding: '32px 24px', background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)', minHeight: '100vh', boxSizing: 'border-box' }}>
      <div style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', padding: '20px 24px', borderRadius: 18, marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 4px 12px rgba(37,99,235,0.08)', border: '1px solid rgba(255,255,255,0.9)'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#1e40af', fontSize: 24, fontWeight: 700 }}>{headingTitle}</h1>
          <div style={{ fontSize: 14, color: '#3b82f6', marginTop: 6 }}>{t('admin.system_management')}</div>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input 
              value={search} 
              onChange={e=>setSearch(e.target.value)} 
              placeholder={searchPlaceholder} 
              style={{ 
                padding: '10px 40px 10px 16px', 
                borderRadius: 999, 
                border: '2px solid #e2e8f0', 
                width: 260,
                fontSize: 14,
                outline: 'none',
                background: '#fff',
              }}
            />
            <span style={{ position:'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color:'#3b82f6', fontSize: 16 }}>🔍</span>
          </div>
          {initialSource === 'all' && (
            <select 
              value={sourceFilter} 
              onChange={e=>setSourceFilter(e.target.value)} 
              style={{ 
                padding: '10px 16px', 
                borderRadius: 999, 
                border: '2px solid #e2e8f0',
                fontSize: 14,
                fontWeight: 500,
                color: '#1e40af',
                background: '#fff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">{t('common.all_types')}</option>
              <option value="customer">{t('order.source_customer')}</option>
              <option value="staff">{t('order.source_staff')}</option>
            </select>
          )}
          {sourceFilter === 'staff' && (
            <div style={{ display: 'inline-flex', borderRadius: 999, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,0.1)' }}>
              <button
                type="button"
                onClick={() => setDeliveryFilter('shipping')}
                style={{
                  padding: '10px 18px',
                  border: 'none',
                  background: deliveryFilter === 'shipping' 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                    : '#fff',
                  color: deliveryFilter === 'shipping' ? '#fff' : '#64748b',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                📦 {t('order.shipping')}
              </button>
              <button
                type="button"
                onClick={() => setDeliveryFilter('pickup')}
                style={{
                  padding: '10px 18px',
                  border: 'none',
                  background: deliveryFilter === 'pickup' 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                    : '#fff',
                  color: deliveryFilter === 'pickup' ? '#fff' : '#64748b',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                🏪 {t('order.pickup')}
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', padding: 50, borderRadius: 18, textAlign: 'center', boxShadow: '0 8px 32px rgba(15,23,42,0.12)', color: '#64748b' }}>{t('common.loading')}</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', padding: 50, borderRadius: 18, textAlign: 'center', color:'#64748b', boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>{t('common.no_data')}</div>
      ) : (
        <>
          <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', borderRadius: 18, overflowX:'auto', boxShadow:'0 10px 40px rgba(15,23,42,0.12), 0 4px 16px rgba(37,99,235,0.08)', border: '1px solid rgba(255,255,255,0.9)' }}>
            {sourceFilter === 'customer' ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '0.9fr 1fr 1.6fr 0.9fr 1.4fr 0.7fr',
                  gap: 8,
                  padding: '14px 20px',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#1e40af',
                }}
              >
                <div>{t('common.date')}</div>
                <div>{t('withdraw.requested_by')}</div>
                <div>{t('order.order_items')}</div>
                <div>{t('common.total')}</div>
                <div>{t('common.address')}</div>
                <div style={{ textAlign: 'center' }}>{t('common.action')}</div>
              </div>
              {currentOrders.map((o) => {
                const dateText = new Date(
                  o.withdrawDate?.seconds
                    ? o.withdrawDate.seconds * 1000
                    : o.withdrawDate
                ).toLocaleDateString('th-TH');
                const totalText =
                  typeof o.total === 'number'
                    ? o.total.toLocaleString()
                    : (parseFloat(o.total || 0) || 0).toLocaleString();
                const items = o.items || [];
                const itemsText = items.length
                  ? items
                      .map(
                        (it) =>
                          `${it.productName || ''} x${it.quantity || 0}`
                      )
                      .join('\n')
                  : '-';
                const isProcessed = (o.shippingStatus || 'pending') !== 'pending';

                return (
                  <div
                    key={o.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '0.9fr 1fr 1.6fr 0.9fr 1.4fr 0.7fr',
                      gap: 8,
                      padding: '12px 16px',
                      borderTop: '1px solid #eee',
                      alignItems: 'flex-start',
                      fontSize: 13,
                    }}
                  >
                    <div>{dateText}</div>
                    <div>{o.requestedBy || '-'}</div>
                    <div
                      style={{
                        whiteSpace: 'pre-wrap',
                        color: '#555',
                        fontSize: 12,
                        lineHeight: 1.3,
                      }}
                    >
                      {itemsText}
                    </div>
                    <div style={{ fontWeight: 600 }}>฿{totalText}</div>
                    <div
                      style={{ whiteSpace: 'pre-wrap', color: '#555' }}
                    >
                      {o.requestedAddress || '-'}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => goDetail(o)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: 'none',
                          background: isProcessed 
                            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
                            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                          boxShadow: isProcessed 
                            ? '0 2px 8px rgba(34,197,94,0.3)' 
                            : '0 2px 8px rgba(37,99,235,0.3)',
                          minWidth: 100,
                          whiteSpace: 'nowrap',
                        }}
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
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '0.9fr 1fr 1.4fr 1.4fr 1.2fr 1.4fr 1.3fr 0.7fr',
                  gap: 8,
                  padding: '14px 20px',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#1e40af',
                }}
              >
                <div>{t('common.date')}</div>
                <div>{t('withdraw.requested_by')}</div>
                <div>{t('order.receiver')}</div>
                <div>{t('order.order_items')}</div>
                <div>{t('order.delivery_method')}</div>
                <div>{t('common.address')}</div>
                <div>{t('order.order_note')}</div>
                <div style={{ textAlign: 'center' }}>{t('order.manage')}</div>
              </div>
              {currentOrders.map((o) => {
                // filter ตาม deliveryFilter แต่ตารางเรียบง่ายขึ้น ไม่มี inline shipping fields แล้ว
                if (deliveryFilter === 'shipping' && (o.deliveryMethod || 'shipping') !== 'shipping') return null;
                if (deliveryFilter === 'pickup' && (o.deliveryMethod || 'shipping') !== 'pickup') return null;

                const address = o.receivedAddress || '-';
                const note = o.note || '-';
                const deliveryText = (o.deliveryMethod || 'shipping') === 'pickup' ? t('order.pickup') : t('order.shipping');
                const items = o.items || [];
                const itemsText = items.length
                  ? items
                      .map((it) => `${it.productName || ''} x${it.quantity || 0}`)
                      .join('\n')
                  : '-';
                const isProcessed = (o.shippingStatus || 'pending') !== 'pending';

                return (
                  <div
                    key={o.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '0.9fr 1fr 1.4fr 1.4fr 1.2fr 1.4fr 1.3fr 0.7fr',
                      gap: 8,
                      padding: '12px 16px',
                      borderTop: '1px solid #eee',
                      alignItems: 'center',
                      fontSize: 13,
                    }}
                  >
                    <div>
                      {new Date(
                        o.withdrawDate?.seconds
                          ? o.withdrawDate.seconds * 1000
                          : o.withdrawDate
                      ).toLocaleDateString('th-TH')}
                    </div>
                    <div>{o.requestedBy || '-'}</div>
                    <div>{o.receivedBy || '-'}</div>
                    <div style={{ whiteSpace: 'pre-wrap', color: '#555' }}>{itemsText}</div>
                    <div>{deliveryText}</div>
                    <div style={{ whiteSpace: 'pre-wrap', color: '#555' }}>{address}</div>
                    <div style={{ whiteSpace: 'pre-wrap', color: '#555' }}>{note}</div>
                    <div style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => goDetail(o)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: 'none',
                          background: isProcessed 
                            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
                            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                          boxShadow: isProcessed 
                            ? '0 2px 8px rgba(34,197,94,0.3)' 
                            : '0 2px 8px rgba(37,99,235,0.3)',
                          minWidth: 100,
                          whiteSpace: 'nowrap',
                        }}
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                padding: '18px 22px',
                marginTop: 16,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: 18,
                boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 4px 12px rgba(37,99,235,0.08)',
                border: '1px solid rgba(255,255,255,0.9)',
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
                {t('common.previous')}
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
                {t('common.next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
