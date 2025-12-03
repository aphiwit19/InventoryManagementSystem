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
    <div
      style={{
        padding: '32px 24px',
        background: 'radial-gradient(circle at top left, #dbeafe 0%, #eff6ff 40%, #e0f2fe 80%)',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
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
            แจ้งเตือนสินค้าสต็อกต่ำ
          </h1>
          <div style={{ fontSize: 14, color: '#3b82f6', marginTop: 6 }}>
            รายการสินค้าที่มีจำนวนคงเหลือต่ำกว่าระดับที่กำหนด
          </div>
        </div>


        {loading ? (
          <div
            style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              padding: 40,
              borderRadius: 18,
              textAlign: 'center',
              color: '#64748b',
              boxShadow: '0 8px 32px rgba(15,23,42,0.12)',
            }}
          >
            กำลังโหลดข้อมูล...
          </div>
        ) : lowStock.length === 0 ? (
          <div
            style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              padding: 40,
              borderRadius: 18,
              textAlign: 'center',
              color: '#64748b',
              boxShadow: '0 8px 32px rgba(15,23,42,0.12)',
            }}
          >
            ✅ ยังไม่มีสินค้าที่อยู่ในสถานะสต็อกต่ำ
          </div>
        ) : (
          <div
            style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: 18,
              boxShadow: '0 10px 40px rgba(15,23,42,0.12), 0 4px 16px rgba(37,99,235,0.08)',
              border: '1px solid rgba(255,255,255,0.9)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '3fr 1.2fr 1.2fr 1.2fr',
                padding: '14px 20px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                fontSize: 13,
                fontWeight: 600,
                color: '#1e40af',
              }}
            >
              <div>สินค้า</div>
              <div style={{ textAlign: 'right' }}>จำนวนคงเหลือ</div>
              <div style={{ textAlign: 'right' }}>สต็อกตั้งต้น</div>
              <div style={{ textAlign: 'right' }}>จัดการ</div>
            </div>

            {lowStock.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 1.2fr 1.2fr 1.2fr',
                  padding: '14px 16px',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: 14,
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {p.image && (
                    <img
                      src={p.image}
                      alt={p.productName || ''}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 10,
                        objectFit: 'cover',
                        background: '#f1f5f9',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    />
                  )}
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.productName || 'ไม่มีชื่อสินค้า'}</div>
                    {p.sku && (
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>SKU: {p.sku}</div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>
                  {(p.quantity ?? 0).toLocaleString()} ชิ้น
                </div>
                <div style={{ textAlign: 'right', color: '#64748b' }}>
                  {p.initialQuantity != null ? `${p.initialQuantity.toLocaleString()} ชิ้น` : '-'}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/products?focus=${p.id}`)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 999,
                      border: 'none',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
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
