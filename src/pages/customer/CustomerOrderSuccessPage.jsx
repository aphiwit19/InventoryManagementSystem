import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { getWithdrawalsByUser } from '../../services';

export default function CustomerOrderSuccessPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [latestOrder, setLatestOrder] = useState(null);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const loadLatest = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const list = await getWithdrawalsByUser(user.uid);
        if (!Array.isArray(list) || list.length === 0) {
          setLatestOrder(null);
        } else {
          const sorted = [...list].sort((a, b) => {
            const toDate = (w) => {
              if (!w) return 0;
              if (w.seconds) return w.seconds * 1000;
              return new Date(w).getTime() || 0;
            };
            return toDate(b.withdrawDate) - toDate(a.withdrawDate);
          });
          setLatestOrder(sorted[0]);
        }
      } catch (e) {
        console.error('load latest order failed:', e);
        setLatestOrder(null);
      } finally {
        setLoading(false);
      }
    };
    loadLatest();
  }, [user?.uid]);

  const orderId = latestOrder?.orderNumber || latestOrder?.id || null;
  const itemsCount = Array.isArray(latestOrder?.items)
    ? latestOrder.items.length
    : null;
  const totalAmount = latestOrder?.total ?? null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F1F5F9',
        padding: '32px 24px 40px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Success Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 24,
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(15,23,42,0.12)',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 56,
              margin: '0 auto 24px',
              boxShadow: '0 8px 32px rgba(16,185,129,0.35)',
            }}
          >
            ✓
          </div>

          <h1
            style={{
              fontFamily: 'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
              fontSize: 32,
              fontWeight: 800,
              color: '#10B981',
              margin: '0 0 12px',
            }}
          >
            {t('message.order_success_title') || 'ดำเนินการสำเร็จ!'}
          </h1>

          <p
            style={{
              fontSize: 16,
              color: '#64748B',
              margin: '0 0 20px',
              lineHeight: 1.7,
            }}
          >
            {t('message.order_success_message') ||
              'คำสั่งซื้อของคุณได้รับการยืนยันแล้ว เราจะดำเนินการจัดเตรียมสินค้าและจัดส่งให้โดยเร็วที่สุด'}
          </p>

          {/* Order number box (uses latest order if available) */}
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(59,130,246,0.04)',
              border: '2px dashed #3B82F6',
              borderRadius: 16,
              padding: '14px 20px',
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}>
              {t('order.order_id')}
            </div>
            <div
              style={{
                fontFamily: 'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
                fontSize: 22,
                fontWeight: 800,
                color: '#2563EB',
                letterSpacing: 1,
              }}
            >
              {orderId ? `#${orderId}` : '#ORD-XXXX'}
            </div>
          </div>

          {/* Brief summary for this order if data is available */}
          {(itemsCount != null || totalAmount != null) && (
            <div
              style={{
                fontSize: 13,
                color: '#64748B',
                marginBottom: 8,
              }}
            >
              {itemsCount != null && (
                <span>
                  {itemsCount} {t('common.items')}
                </span>
              )}
              {itemsCount != null && totalAmount != null && ' · '}
              {totalAmount != null && (
                <span>
                  {t('common.total')} ฿{totalAmount.toLocaleString()}
                </span>
              )}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
              gap: 12,
              marginTop: 8,
            }}
          >
            <Link
              to="/customer/orders"
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                border: '2px solid #3B82F6',
                color: '#3B82F6',
                textDecoration: 'none',
                fontFamily: 'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
                fontWeight: 700,
                fontSize: 14,
                textAlign: 'center',
              }}
            >
              📋 {t('message.view_orders')}
            </Link>

            <Link
              to="/customer"
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                background: 'linear-gradient(135deg,#2563EB,#1D4ED8)',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontFamily: 'Kanit, system-ui, -apple-system, BlinkMacSystemFont',
                fontWeight: 700,
                fontSize: 14,
                boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
                textAlign: 'center',
              }}
            >
              🏠 {t('cart.continue_shopping')}
            </Link>
          </div>
        </div>

        {/* Removed follow-up steps card as requested */}
      </div>
    </div>
  );
}

