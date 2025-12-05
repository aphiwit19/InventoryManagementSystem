import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

const AdminLayout = () => {
  const { profile } = useAuth();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const currentOrdersSource = params.get('source') || 'customer';

  const isActiveLink = (path) => {
    if (path === '/admin/products') {
      return location.pathname === '/admin/products' || location.pathname.startsWith('/admin/products/');
    }
    return location.pathname === path;
  };

  const isOrdersActive = (source) => {
    return location.pathname === '/admin/orders' && currentOrdersSource === source;
  };

  // Style สำหรับ Link ที่ active
  const getLinkStyle = (isActive) => ({
    marginTop: 4,
    padding: '10px 14px',
    borderRadius: 999,
    background: isActive
      ? 'linear-gradient(135deg, #2563eb, #4f46e5)'
      : 'transparent',
    color: isActive ? '#f9fafb' : '#111827',
    textDecoration: 'none',
    display: 'block',
    fontWeight: 500,
    fontSize: 14,
    transition: 'background 0.18s ease, color 0.18s ease, transform 0.18s ease',
    boxShadow: isActive
      ? '0 8px 18px rgba(37,99,235,0.5)'
      : 'none',
  });

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, #ffffff 0%, #e5f0ff 40%, #d6e4ff 70%, #c7d2fe 100%)'
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: '240px',
          padding: '22px 18px 24px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          height: '100vh',
          overflowY: 'auto',
          flexShrink: 0,
          borderRight: '1px solid rgba(148,163,184,0.35)',
          boxShadow: '6px 0 18px rgba(148,163,184,0.25)',
          backgroundColor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(6px)',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            background:
              'linear-gradient(145deg, #1d4ed8 0%, #2563eb 35%, #38bdf8 80%, #4f46e5 100%)',
            borderRadius: 20,
            padding: '18px 16px',
            marginBottom: 18,
            boxShadow: '0 14px 28px rgba(15,23,42,0.35)',
            color: '#f9fafb',
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              opacity: 0.9,
              marginBottom: 4,
            }}
          >
            ADMIN SPACE
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
            ADMIN
          </div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            {profile?.displayName || 'ผู้ดูแลระบบ'}
          </div>
        </div>

        {/* Menu Links */}
        <Link to="/admin/dashboard" style={getLinkStyle(isActiveLink('/admin/dashboard'))}>
          แดชบอร์ด
        </Link>
        <Link to="/admin/products" style={getLinkStyle(isActiveLink('/admin/products'))}>
          จัดการสินค้า
        </Link>
        <Link to="/admin/orders?source=customer" style={getLinkStyle(isOrdersActive('customer'))}>
          รายการคำสั่งซื้อ
        </Link>
        <Link to="/admin/orders?source=staff" style={getLinkStyle(isOrdersActive('staff'))}>
          รายการคำสั่งเบิก
        </Link>
        <Link to="/admin/inventory_history" style={getLinkStyle(isActiveLink('/admin/inventory_history'))}>
          ประวัติสินค้าเข้า–ออกคลัง
        </Link>
        <Link to="/admin/payment-account" style={getLinkStyle(isActiveLink('/admin/payment-account'))}>
          จัดการบัญชีรับโอนเงิน
        </Link>
        <Link to="/admin/alerts" style={getLinkStyle(isActiveLink('/admin/alerts'))}>
          แจ้งเตือนสต็อกต่ำ
        </Link>
        <Link to="/admin/users" style={getLinkStyle(isActiveLink('/admin/users'))}>
          จัดการสิทธิ์ผู้ใช้
        </Link>
        <Link to="/admin/profile" style={getLinkStyle(isActiveLink('/admin/profile'))}>
          โปรไฟล์
        </Link>

        {/* Logout Button */}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <button
            onClick={() => signOut(auth)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 999,
              border: 'none',
              background:
                'linear-gradient(135deg, #f97373 0%, #ef4444 40%, #b91c1c 100%)',
              color: '#fef2f2',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 8px 18px rgba(248,113,113,0.55)',
            }}
          >
            <span>🚪</span>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          height: '100vh',
          overflowY: 'auto',
          padding: '0 20px 20px 20px',
          boxSizing: 'border-box',
          borderLeft: '1px solid rgba(229,231,235,0.7)',
          boxShadow: 'inset 8px 0 18px rgba(148,163,184,0.18)',
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;