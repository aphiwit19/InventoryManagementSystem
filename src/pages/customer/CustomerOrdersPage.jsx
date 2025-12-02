import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { getWithdrawalsByUser } from '../../services';

const statuses = ['รอดำเนินการ', 'กำลังดำเนินการส่ง', 'ส่งสำเร็จ'];

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
          padding: '22px 28px',
          boxShadow: '0 12px 28px rgba(15,23,42,0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#fff'
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              opacity: 0.85
            }}
          >
            MY ORDERS
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '0.03em',
              marginTop: 4
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
            fontSize: 12,
            padding: '6px 12px',
            borderRadius: 999,
            background: 'rgba(15,23,42,0.25)',
            border: '1px solid rgba(255,255,255,0.25)'
          }}
        >
          รวม {orders.length} รายการ
        </div>
      </div>

      {/* Filters bar */}
      <div
        style={{
          maxWidth: 920,
          margin: '0 auto 12px',
          background: '#fff',
          borderRadius: 18,
          padding: '10px 20px',
          boxShadow: '0 3px 10px rgba(15,23,42,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap'
        }}
      >
        <div style={{ paddingTop: 2, flex: '0 0 auto' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', letterSpacing: '0.06em' }}>
            ตัวกรองรายการ
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>ค้นหาจากขนส่งหรือเลข Tracking และกรองตามสถานะคำสั่งซื้อ</div>
        </div>
        <div
          style={{
            display: 'flex',
            flex: 1,
            maxWidth: 520,
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 28
          }}
        >
          <div
            style={{
              position: 'relative',
              flex: '1 1 200px',
              maxWidth: 220,
              marginRight: 24
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
                border: '1px solid #e5e7eb',
                fontSize: 13,
                outline: 'none',
                background: '#F9FAFB'
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6366F1',
                fontSize: 15
              }}
            >
              🔍
            </span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: '1px solid #e5e7eb',
              fontSize: 13,
              minWidth: 150,
              background: '#F9FAFB',
              color: '#111827'
            }}
          >
            <option value="all">สถานะทั้งหมด</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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
            {filtered.map((o) => {
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
                    flexWrap: 'wrap'
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
      </div>
    </div>
  );
}
