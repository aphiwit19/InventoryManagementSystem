import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts, isLowStock } from '../../services';

export default function AdminAlertsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

   const totalPages = Math.ceil(lowStock.length / itemsPerPage) || 1;
   const startIndex = (currentPage - 1) * itemsPerPage;
   const endIndex = startIndex + itemsPerPage;
   const currentItems = lowStock.slice(startIndex, endIndex);

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

            {currentItems.map((p) => (
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
      {/* Pagination */}
      {lowStock.length > 0 && totalPages > 1 && (
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
