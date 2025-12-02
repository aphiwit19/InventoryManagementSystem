import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

const StaffLayout = () => {
  const { profile } = useAuth();
  const location = useLocation();

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
            STAFF SPACE
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
            แผงควบคุมสตาฟ
          </div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            {profile?.displayName || 'ผู้ใช้งานสตาฟ'}
          </div>
        </div>

        <Link
          to="/staff"
          style={{
            marginTop: 4,
            padding: '10px 14px',
            borderRadius: 999,
            background:
              location.pathname === '/staff'
                ? 'linear-gradient(135deg,#2563eb,#4f46e5)'
                : 'transparent',
            color: location.pathname === '/staff' ? '#f9fafb' : '#111827',
            textDecoration: 'none',
            display: 'block',
            fontWeight: 500,
            fontSize: 14,
            transition: 'background 0.18s ease, color 0.18s ease, transform 0.18s ease',
            boxShadow:
              location.pathname === '/staff'
                ? '0 8px 18px rgba(37,99,235,0.5)'
                : 'none',
          }}
        >
          รายการสินค้า
        </Link>
        <Link
          to="/staff/withdraw"
          style={{
            marginTop: 4,
            padding: '10px 14px',
            borderRadius: 999,
            background:
              location.pathname === '/staff/withdraw'
                ? 'linear-gradient(135deg,#2563eb,#4f46e5)'
                : 'transparent',
            color: location.pathname === '/staff/withdraw' ? '#f9fafb' : '#111827',
            textDecoration: 'none',
            display: 'block',
            fontWeight: 500,
            fontSize: 14,
            transition: 'background 0.18s ease, color 0.18s ease, transform 0.18s ease',
            boxShadow:
              location.pathname === '/staff/withdraw'
                ? '0 8px 18px rgba(37,99,235,0.5)'
                : 'none',
          }}
        >
          คำสั่งเบิก
        </Link>
        <Link
          to="/staff/orders"
          style={{
            marginTop: 4,
            padding: '10px 14px',
            borderRadius: 999,
            background:
              location.pathname === '/staff/orders'
                ? 'linear-gradient(135deg,#2563eb,#4f46e5)'
                : 'transparent',
            color: location.pathname === '/staff/orders' ? '#f9fafb' : '#111827',
            textDecoration: 'none',
            display: 'block',
            fontWeight: 500,
            fontSize: 14,
            transition: 'background 0.18s ease, color 0.18s ease, transform 0.18s ease',
            boxShadow:
              location.pathname === '/staff/orders'
                ? '0 8px 18px rgba(37,99,235,0.5)'
                : 'none',
          }}
        >
          ติดตามสถานะ
        </Link>
        <Link
          to="/staff/profile"
          style={{
            marginTop: 4,
            padding: '10px 14px',
            borderRadius: 999,
            background:
              location.pathname === '/staff/profile'
                ? 'linear-gradient(135deg,#2563eb,#4f46e5)'
                : 'transparent',
            color: location.pathname === '/staff/profile' ? '#f9fafb' : '#111827',
            textDecoration: 'none',
            display: 'block',
            fontWeight: 500,
            fontSize: 14,
            transition: 'background 0.18s ease, color 0.18s ease, transform 0.18s ease',
            boxShadow:
              location.pathname === '/staff/profile'
                ? '0 8px 18px rgba(37,99,235,0.5)'
                : 'none',
          }}
        >
          โปรไฟล์
        </Link>

        {/* logout moved to header snackbar */}
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

export default StaffLayout;