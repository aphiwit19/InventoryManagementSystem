import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts, getAllWithdrawals, isLowStock } from '../../services';

export default function AdminOverviewPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [p, w] = await Promise.all([
          getAllProducts(),
          getAllWithdrawals(),
        ]);
        setProducts(p || []);
        setWithdrawals(w || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const lowStock = (products || []).filter(isLowStock);
  const allWithdrawals = withdrawals || [];
  const customerOrders = allWithdrawals.filter(w => (w.createdSource || 'customer') === 'customer');
  const staffWithdrawals = allWithdrawals.filter(w => (w.createdSource || 'staff') === 'staff');
  const pendingCustomerOrders = customerOrders.filter(o => (o.shippingStatus || 'รอดำเนินการ') === 'รอดำเนินการ');
  const pendingWithdrawals = staffWithdrawals.filter(o => (o.shippingStatus || 'รอดำเนินการ') === 'รอดำเนินการ');

  const today = new Date();
  const isSameDay = (ts) => {
    if (!ts) return false;
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  const todayRevenue = customerOrders
    .filter(o => isSameDay(o.createdAt))
    .reduce((sum, o) => sum + (parseFloat(o.total || 0) || 0), 0);

  const totalRevenue = customerOrders
    .reduce((sum, o) => sum + (parseFloat(o.total || 0) || 0), 0);

  // เตรียมข้อมูลกราฟรายได้ย้อนหลัง 7 วัน (รวมวันนี้)
  const buildDailyRevenue = () => {
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      days.push({ key, date: d, total: 0 });
    }

    const map = new Map(days.map(d => [d.key, d]));

    customerOrders.forEach((o) => {
      const ts = o.createdAt;
      if (!ts) return;
      const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) return; // นอกช่วง 7 วัน
      const row = map.get(key);
      row.total += (parseFloat(o.total || 0) || 0);
    });

    return days;
  };

  const dailyRevenue = buildDailyRevenue();
  const maxDailyRevenue = dailyRevenue.reduce((m, d) => Math.max(m, d.total), 0) || 1;

  return (
    <div
      style={{
        padding: '32px 24px',
        background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: '#1e40af',
              letterSpacing: '0.02em',
            }}
          >
            แดชบอร์ดผู้ดูแลระบบ
          </h1>
          <div style={{ fontSize: 14, color: '#3b82f6', marginTop: 6 }}>
            ภาพรวมสินค้า ยอดขาย และสถิติข้อมูลสำคัญ
          </div>
        </div>

        {/* แถวบน: 3 การ์ด */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <SummaryCard
            title="จำนวนสินค้าทั้งหมด"
            value={products.length.toLocaleString()}
            subtext="รายการสินค้าในระบบ"
            onClick={() => navigate('/admin/products')}
          />
          <SummaryCard
            title="สินค้าที่สต็อกต่ำ"
            value={lowStock.length.toLocaleString()}
            subtext="ต่ำกว่า 20% ของสต็อกตั้งต้น"
            onClick={() => navigate('/admin/products')}
          />
          <SummaryCard
            title="คำสั่งซื้อที่รอดำเนินการ"
            value={pendingCustomerOrders.length.toLocaleString()}
            subtext="คำสั่งซื้อจากลูกค้า"
            onClick={() => navigate('/admin/orders?source=customer')}
          />
        </div>

        {/* แถวที่ 2: คำสั่งเบิก + รายได้ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <SummaryCard
            title="คำสั่งเบิกที่รอดำเนินการ"
            value={pendingWithdrawals.length.toLocaleString()}
            subtext="คำสั่งเบิกจากสตาฟ"
            onClick={() => navigate('/admin/orders?source=staff')}
          />
          <RevenueCard
            title="รายได้วันนี้"
            value={todayRevenue}
            subtext="ยอดสั่งซื้อจากลูกค้าวันนี้"
          />
          <RevenueCard
            title="รายได้สะสมทั้งหมด"
            value={totalRevenue}
            subtext="ยอดสั่งซื้อจากลูกค้าทั้งหมด"
          />
        </div>

        {/* แถวล่าง: Panel สินค้าต้องสั่งอีก + กราฟ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.4fr',
            gap: 20,
            alignItems: 'stretch',
          }}
        >
          <Panel
            title="สินค้าสต๊อกต่ำ"
            badge={lowStock.length > 0 ? `${lowStock.length} ชิ้น` : null}
            emptyText="ยังไม่มีสินค้าที่สต็อกต่ำ"
          >
            {lowStock.slice(0, 5).map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: 14,
                }}
              >
                <div
                  style={{
                    maxWidth: 200,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: '#1e293b',
                  }}
                >
                  {p.productName || 'ไม่มีชื่อสินค้า'}
                </div>
                <div style={{ color: '#3b82f6', fontWeight: 600 }}>
                  {(p.quantity ?? 0).toLocaleString()} ชิ้น
                </div>
              </div>
            ))}
          </Panel>

          <Panel title="กราฟรายได้ 7 วันที่ผ่านมา" emptyText="ยังไม่มีคำสั่งซื้อในช่วงนี้">
            <RevenueBarChart data={dailyRevenue} max={maxDailyRevenue} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtext, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 18,
        padding: '20px 22px',
        boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 4px 12px rgba(37,99,235,0.08)',
        cursor: onClick ? 'pointer' : 'default',
        border: '1px solid rgba(255,255,255,0.8)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 110,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        backdropFilter: 'blur(8px)',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 16px 48px rgba(15,23,42,0.18), 0 8px 24px rgba(37,99,235,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(15,23,42,0.12), 0 4px 12px rgba(37,99,235,0.08)';
      }}
    >
      <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8, color: '#1e40af' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{subtext}</div>
    </div>
  );
}

function RevenueCard({ title, value, subtext }) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: 18,
        padding: '24px 28px',
        boxShadow: '0 10px 40px rgba(15,23,42,0.14), 0 4px 16px rgba(37,99,235,0.1)',
        border: '1px solid rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>{title}</div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: '#1e40af',
          letterSpacing: '-0.02em',
        }}
      >
        ฿{value.toLocaleString()}
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{subtext}</div>
    </div>
  );
}

function Panel({ title, badge, emptyText, children }) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0);
  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: 18,
        padding: '22px 24px',
        boxShadow: '0 10px 40px rgba(15,23,42,0.12), 0 4px 16px rgba(37,99,235,0.08)',
        border: '1px solid rgba(255,255,255,0.9)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{title}</div>
        {badge && (
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {isEmpty ? (
        <div style={{ fontSize: 13, color: '#94a3b8', padding: '10px 0' }}>{emptyText}</div>
      ) : (
        <div style={{ flex: 1 }}>{children}</div>
      )}
    </div>
  );
}

function RevenueBarChart({ data, max }) {
  if (!data || data.length === 0) return null;

  const formatLabel = (d) => {
    return d.date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
  };

  return (
    <div style={{ paddingTop: 8, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 12,
          flex: 1,
          minHeight: 180,
          padding: '8px 4px 0',
        }}
      >
        {data.map((d) => {
          const ratio = d.total <= 0 ? 0.05 : d.total / max;
          const height = Math.max(20, ratio * 150);
          return (
            <div
              key={d.key}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <div
                style={{
                  width: '60%',
                  height,
                  background: 'linear-gradient(to top, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
                  borderRadius: 6,
                  boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                  transition: 'height 0.3s ease-out',
                  cursor: 'pointer',
                }}
                title={`฿${d.total.toLocaleString()}`}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 12,
          fontSize: 12,
          color: '#64748b',
          borderTop: '1px solid #f1f5f9',
          paddingTop: 10,
        }}
      >
        {data.map((d) => (
          <div key={d.key} style={{ flex: 1, textAlign: 'center' }}>
            {formatLabel(d)}
          </div>
        ))}
      </div>
    </div>
  );
}
