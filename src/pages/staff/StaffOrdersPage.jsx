import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getWithdrawalsByUser } from '../../services';

const statuses = ['รอดำเนินการ', 'กำลังดำเนินการส่ง', 'ส่งสำเร็จ'];

export default function StaffOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const list = await getWithdrawalsByUser(user.uid);
      setOrders(list);
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
    <div style={{ padding: '32px 24px', background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)', minHeight: '100vh', boxSizing: 'border-box' }}>
      <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', padding: '20px 24px', borderRadius: 18, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 4px 12px rgba(37,99,235,0.08)', border: '1px solid rgba(255,255,255,0.9)', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: '#1e40af', fontSize: 24, fontWeight: 700 }}>ติดตามสถานะคำสั่งเบิก</h1>
          <div style={{ fontSize: 14, color: '#3b82f6', marginTop: 6 }}>ตรวจสอบสถานะการจัดส่งและติดตามคำสั่งเบิกของคุณ</div>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหา (ขนส่ง/Tracking)" style={{ padding:'10px 40px 10px 12px', borderRadius:20, border:'1px solid #ddd', width:280 }} />
            <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'#999' }}>🔍</span>
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ padding:'10px 12px', borderRadius:20, border:'1px solid #ddd' }}>
            <option value="all">สถานะทั้งหมด</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', padding: 40, borderRadius: 18, textAlign: 'center', boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', padding: 40, borderRadius: 18, textAlign: 'center', color: '#64748b', boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>ไม่พบรายการ</div>
      ) : (
        <div style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 10px 40px rgba(15,23,42,0.12), 0 4px 16px rgba(37,99,235,0.08)', border: '1px solid rgba(255,255,255,0.9)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1fr 1.4fr 1.4fr 1.6fr 1.1fr 1.1fr 1fr 0.9fr', padding: '14px 20px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', fontWeight: 600, fontSize: 13, color: '#1e40af' }}>
            <div>วันที่เบิก</div>
            <div>ผู้เบิก</div>
            <div>ผู้รับ</div>
            <div>สินค้า / จำนวน</div>
            <div>ที่อยู่รับของ</div>
            <div>ขนส่ง</div>
            <div>Tracking</div>
            <div>สถานะ</div>
            <div>ราคารวม</div>
          </div>
          {filtered.map(o => {
            const items = o.items || [];
            const itemsText = items.length
              ? items.map(it => `${it.productName || ''} x${it.quantity || 0}`).join('\n')
              : '-';
            return (
              <div
                key={o.id}
                onClick={() => navigate(`/staff/orders/${o.id}`, { state: { order: o } })}
                style={{
                  display:'grid',
                  gridTemplateColumns:'0.9fr 1fr 1.4fr 1.4fr 1.6fr 1.1fr 1.1fr 1fr 0.9fr',
                  padding:'12px 16px',
                  borderTop:'1px solid #eee',
                  alignItems:'center',
                  cursor:'pointer',
                  fontSize:13,
                }}
              >
                <div>{new Date(o.withdrawDate?.seconds ? o.withdrawDate.seconds*1000 : o.withdrawDate).toLocaleDateString('th-TH')}</div>
                <div>{o.requestedBy || '-'}</div>
                <div>{o.receivedBy || '-'}</div>
                <div style={{ whiteSpace:'pre-wrap', color:'#555' }}>{itemsText}</div>
                <div style={{ whiteSpace:'pre-wrap', color:'#555' }}>{o.receivedAddress || '-'}</div>
                <div>{o.shippingCarrier || '-'}</div>
                <div style={{ fontFamily:'monospace' }}>{o.trackingNumber || '-'}</div>
                <div>{o.shippingStatus || 'รอดำเนินการ'}</div>
                <div>฿{(o.total || 0).toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
