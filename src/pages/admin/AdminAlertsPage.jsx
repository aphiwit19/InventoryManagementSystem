import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts, isLowStock, getLowStockVariants } from '../../services';

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
                gridTemplateColumns: '2.5fr 2fr 1.2fr 1fr',
                padding: '14px 20px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                fontSize: 13,
                fontWeight: 600,
                color: '#1e40af',
              }}
            >
              <div>สินค้า</div>
              <div>Variant ที่สต๊อกต่ำ</div>
              <div style={{ textAlign: 'right' }}>จำนวนรวม</div>
              <div style={{ textAlign: 'right' }}>จัดการ</div>
            </div>

            {currentItems.map((p) => {
              const lowVariants = getLowStockVariants(p);
              const unit = p.unit || 'ชิ้น';
              
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2.5fr 2fr 1.2fr 1fr',
                    padding: '16px 20px',
                    borderBottom: '1px solid #f1f5f9',
                    fontSize: 14,
                    alignItems: 'center',
                    background: (p.quantity || 0) === 0 ? '#fef2f2' : '#fff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 10, background: '#f1f5f9', overflow: 'hidden', flexShrink: 0 }}>
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.productName || ''}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 20 }}>📦</div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 15 }}>{p.productName || 'ไม่มีชื่อสินค้า'}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        {p.category && <span style={{ background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: 4, marginRight: 6 }}>{p.category}</span>}
                        {p.hasVariants && <span style={{ color: '#6b7280' }}>{p.variants?.length || 0} variants</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    {lowVariants.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {lowVariants.map((v, idx) => (
                          <span 
                            key={idx}
                            style={{ 
                              background: v.available === 0 ? '#dc2626' : v.available <= 5 ? '#f59e0b' : '#fef3c7',
                              color: v.available <= 5 ? '#fff' : '#92400e',
                              padding: '4px 10px', 
                              borderRadius: 6, 
                              fontSize: 12, 
                              fontWeight: 500,
                            }}
                          >
                            {v.size}/{v.color}: {v.available}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ 
                        background: '#dc2626', 
                        color: '#fff', 
                        padding: '4px 10px', 
                        borderRadius: 6, 
                        fontSize: 12, 
                        fontWeight: 500 
                      }}>
                        สต๊อกรวมต่ำ
                      </span>
                    )}
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: (p.quantity || 0) === 0 ? '#dc2626' : '#f59e0b' }}>
                      {(p.quantity ?? 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{unit}</div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/products?focus=${p.id}`)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                      }}
                    >
                      เพิ่มสต๊อก
                    </button>
                  </div>
                </div>
              );
            })}
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
