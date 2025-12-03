import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts, isLowStock } from '../../services';

export default function AdminAlertsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await getAllProducts();
        setProducts(list || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const lowStock = (products || []).filter(isLowStock);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>แจ้งเตือนสินค้าสต็อกต่ำ</h1>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>รายการสินค้าที่มีจำนวนคงเหลือต่ำกว่าระดับที่กำหนด</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid #D1D5DB',
              background: '#fff',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            กลับไปหน้าจัดการสินค้า
          </button>
        </div>

        {loading ? (
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, textAlign: 'center', color: '#6B7280' }}>
            กำลังโหลดข้อมูล...
          </div>
        ) : lowStock.length === 0 ? (
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, textAlign: 'center', color: '#6B7280' }}>
            ยังไม่มีสินค้าที่อยู่ในสถานะสต็อกต่ำ
          </div>
        ) : (
          <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 1px 3px rgba(15,23,42,0.08)' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '3fr 1.2fr 1.2fr 1.2fr',
                padding: '10px 12px',
                borderBottom: '1px solid #E5E7EB',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
              }}
            >
              <div>สินค้า</div>
              <div style={{ textAlign: 'right' }}>จำนวนคงเหลือ</div>
              <div style={{ textAlign: 'right' }}>สต็อกตั้งต้น (ถ้ามี)</div>
              <div style={{ textAlign: 'right' }}>จัดการ</div>
            </div>

            {lowStock.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 1.2fr 1.2fr 1.2fr',
                  padding: '10px 12px',
                  borderBottom: '1px solid #F3F4F6',
                  fontSize: 13,
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {p.image && (
                    <img
                      src={p.image}
                      alt={p.productName || ''}
                      style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', background: '#F3F4F6' }}
                    />
                  )}
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{p.productName || 'ไม่มีชื่อสินค้า'}</div>
                    {p.sku && (
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>SKU: {p.sku}</div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', color: '#B91C1C', fontWeight: 600 }}>
                  {(p.quantity ?? 0).toLocaleString()} ชิ้น
                </div>
                <div style={{ textAlign: 'right', color: '#6B7280' }}>
                  {p.initialQuantity != null ? `${p.initialQuantity.toLocaleString()} ชิ้น` : '-'}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/products?focus=${p.id}`)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      border: '1px solid #D1D5DB',
                      background: '#fff',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    จัดการสินค้า
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
