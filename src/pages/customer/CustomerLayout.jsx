import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../auth/AuthContext';
import { getCart, migrateLocalStorageCart } from '../../services';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setCartCount(0);
      return;
    }

    const loadCart = async () => {
      try {
        const legacyKey = 'customerCart';
        const perUserKey = `customerCart_${user.uid}`;
        await migrateLocalStorageCart(user.uid, legacyKey, 'customer');
        await migrateLocalStorageCart(user.uid, perUserKey, 'customer');

        const cartItems = await getCart(user.uid, 'customer');
        const totalItems = cartItems.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        );
        setCartCount(totalItems);
      } catch (err) {
        console.warn('load customer cart failed:', err);
      }
    };

    loadCart();

    const handler = () => {
      loadCart();
    };

    window.addEventListener('customer-cart-updated', handler);
    return () => {
      window.removeEventListener('customer-cart-updated', handler);
    };
  }, [user?.uid]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, #ffffff 0%, #e5f0ff 40%, #d6e4ff 70%, #c7d2fe 100%)',
      }}
    >
      {/* Top Header - shared for all customer pages */}
      <div style={{ padding: '24px 24px 14px', display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: '100%',
            maxWidth: 1200,
            background:
              'linear-gradient(135deg, #1D4ED8 0%, #2563EB 28%, #22c1f1 60%, #4F46E5 100%)',
            padding: '22px 36px',
            borderRadius: '24px',
            boxShadow:
              '0 18px 40px rgba(15,23,42,0.45), 0 0 0 1px rgba(255,255,255,0.12)',
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.22) 0, transparent 55%),' +
                'radial-gradient(circle at 80% 0%, rgba(255,255,255,0.12) 0, transparent 50%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Left: Logo and Store Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img 
                src="/Inventory Hub .png" 
                alt="Inventory Hub" 
                style={{
                  width: '48px',
                  height: '48px',
                  objectFit: 'contain',
                  borderRadius: '10px',
                  background: '#fff',
                  padding: '4px',
                }}
              />
              <div>
                <button
                  type="button"
                  onClick={() => navigate('/customer')}
                  style={{
                    color: '#fff',
                    fontSize: '26px',
                    fontWeight: '800',
                    marginBottom: 4,
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  Inventory Hub
                </button>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: 13,
                    fontWeight: 400,
                  }}
                >
                  ระบบจัดการสต็อกสินค้า
                </div>
              </div>
            </div>

            {/* Right: Cart, Profile, Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
              {/* Cart Icon (no badge here, logic handled per page if needed) */}
              <Link
                to="/customer/withdraw"
                style={{
                  position: 'relative',
                  width: '44px',
                  height: '44px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '22px',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                🛒
                {cartCount > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      backgroundColor: '#f97316',
                      color: '#fff',
                      borderRadius: '999px',
                      minWidth: 20,
                      height: 20,
                      padding: '0 4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 'bold',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    }}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </div>
                )}
              </Link>

              {/* Profile Icon + Menu */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowMenu((prev) => !prev)}
                  style={{
                    width: '44px',
                    height: '44px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '22px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: 'none',
                    padding: 0,
                  }}
                  title={profile?.displayName || 'โปรไฟล์ลูกค้า'}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  👤
                </button>
                {showMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      marginTop: 8,
                      background: '#fff',
                      borderRadius: 12,
                      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                      minWidth: 170,
                      zIndex: 2100,
                      overflow: 'hidden',
                    }}
                  >
                    <Link
                      to="/customer/profile"
                      onClick={() => setShowMenu(false)}
                      style={{
                        display: 'block',
                        padding: '10px 14px',
                        fontSize: 14,
                        color: '#111827',
                        textDecoration: 'none',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      โปรไฟล์
                    </Link>
                    <Link
                      to="/customer/orders"
                      onClick={() => setShowMenu(false)}
                      style={{
                        display: 'block',
                        padding: '10px 14px',
                        fontSize: 14,
                        color: '#111827',
                        textDecoration: 'none',
                      }}
                    >
                      ติดตามสถานะ
                    </Link>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={() => signOut(auth)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  border: 'none',
                  borderRadius: '999px',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)';
                }}
              >
                <span>🚪</span>
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Page content wrapper */}
      <div
        style={{
          padding: '0 24px 24px',
          marginTop: 0,
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default CustomerLayout;
