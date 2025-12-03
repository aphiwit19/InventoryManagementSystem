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
    <div style={{ padding: 24, background:'#F3F4F6', minHeight:'100%' }}>
      <div style={{ maxWidth: 1200, margin:'0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight:700, color: '#111827' }}>แดชบอร์ดผู้ดูแล</h1>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>ภาพรวมสินค้า ยอดขาย และคำสั่งซื้อที่ต้องจัดการ</div>
        </div>

        {/* แถวบน: 3 การ์ด */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 14 }}>
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
            // highlight={lowStock.length > 0}
            onClick={() => navigate('/admin/products')}
          />
          <SummaryCard
            title="คำสั่งซื้อที่รอดำเนินการ"
            value={pendingCustomerOrders.length.toLocaleString()}
            subtext="คำสั่งซื้อจากลูกค้า"
            onClick={() => navigate('/admin/orders?source=customer')}
          />
        </div>

        {/* แถวถัดมา: 3 การ์ด */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 20 }}>
          <SummaryCard
            title="คำสั่งเบิกที่รอดำเนินการ"
            value={pendingWithdrawals.length.toLocaleString()}
            subtext="คำสั่งเบิกจากสตาฟ"
            onClick={() => navigate('/admin/orders?source=staff')}
          />
          <SummaryCard
            title="รายได้วันนี้"
            value={`฿${todayRevenue.toLocaleString()}`}
            subtext="ยอดสั่งซื้อจากลูกค้าวันนี้"
          />
          <SummaryCard
            title="รายได้สะสมทั้งหมด"
            value={`฿${totalRevenue.toLocaleString()}`}
            subtext="ยอดสั่งซื้อจากลูกค้าทั้งหมด"
          />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1.3fr', gap: 18, alignItems:'stretch' }}>
          <Panel title="สินค้าสต็อกต่ำ" emptyText="ยังไม่มีสินค้าที่สต็อกต่ำ">
            {lowStock.slice(0, 5).map(p => (
              <div key={p.id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:13 }}>
                <div style={{ maxWidth: 260, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.productName || 'ไม่มีชื่อสินค้า'}</div>
                <div style={{ color:'#EA580C', fontWeight:600 }}>{(p.quantity ?? 0).toLocaleString()} ชิ้น</div>
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

function SummaryCard({ title, value, subtext, highlight, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background:'#fff',
        borderRadius:16,
        padding:'14px 16px',
        boxShadow:'0 2px 8px rgba(15,23,42,0.08)',
        cursor: onClick ? 'pointer' : 'default',
        border: highlight ? '1px solid #F97316' : '1px solid #E5E7EB',
        display:'flex',
        flexDirection:'column',
        justifyContent:'space-between',
        minHeight:88,
      }}
    >
      <div style={{ fontSize:12, color:'#6B7280' }}>{title}</div>
      <div style={{ fontSize:22, fontWeight:700, marginTop:4, color:'#111827' }}>{value}</div>
      <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>{subtext}</div>
    </div>
  );
}

function Panel({ title, emptyText, children }) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0);
  return (
    <div style={{ background:'#fff', borderRadius:16, padding:16, boxShadow:'0 2px 8px rgba(15,23,42,0.06)', height:'100%', display:'flex', flexDirection:'column' }}>
      <div style={{ fontSize:14, fontWeight:600, marginBottom:8, color:'#111827' }}>{title}</div>
      {isEmpty ? (
        <div style={{ fontSize:13, color:'#9CA3AF', padding:'10px 0' }}>{emptyText}</div>
      ) : (
        <div style={{ flex:1 }}>{children}</div>
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
    <div style={{ paddingTop: 4 }}>
      <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:160, padding:'4px 4px 0' }}>
        {data.map((d) => {
          const ratio = d.total <= 0 ? 0 : d.total / max;
          const height = 20 + ratio * 110; // สูงขั้นต่ำ 20px
          return (
            <div key={d.key} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end' }}>
              <div
                style={{
                  width:'65%',
                  height,
                  background:'linear-gradient(to top, #4F46E5, #6366F1)',
                  borderRadius:6,
                  boxShadow:'0 1px 3px rgba(15,23,42,0.25)',
                  transition:'height 0.2s ease-out',
                }}
                title={`฿${d.total.toLocaleString()}`}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:11, color:'#6B7280' }}>
        {data.map(d => (
          <div key={d.key} style={{ flex:1, textAlign:'center' }}>{formatLabel(d)}</div>
        ))}
      </div>
    </div>
  );
}
