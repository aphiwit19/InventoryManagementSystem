import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProductById, getInventoryHistory } from '../../services';
import { useTranslation } from 'react-i18next';

export default function InventoryHistoryPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productData, historyData] = await Promise.all([
          getProductById(id),
          getInventoryHistory(id)
        ]);
        setProduct(productData);
        setHistory(historyData);
      } catch (error) {
        console.error('Error loading data:', error);
        alert(t('common.error_loading_data'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, t]); // Added 't' as a dependency

  const formatDateOnly = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#666' }}>{t('common.loading')}</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    // Removed the sidebar and adjusted the main content styling
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{
          margin: '0 0 10px 0',
          fontSize: '28px',
          fontWeight: '700',
          color: '#333'
        }}>
          {t('admin.inventory_history')}
        </h1>
        {product && (
          <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
            {t('product.products')}: <strong>{product.productName}</strong>
          </p>
        )}
      </div>

      {/* Product Info Card */}
      {product && (
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <div>
            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>{t('inventory.current_stock')}</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
              {product.quantity || 0} {t('common.piece')}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>{t('product.sell_price')}</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
              ฿{product.price?.toLocaleString() || '0'}
            </p>
          </div>
          {product.costPrice && (
            <div>
              <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>{t('inventory.latest_cost_price')}</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                ฿{product.costPrice.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* History Table */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {history.length === 0 ? (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#999'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
            <p style={{ fontSize: '16px', margin: 0 }}>{t('inventory.no_history')}</p>
          </div>
        ) : (
          <>
            <div style={{
              padding: '20px',
              borderBottom: '2px solid #e0e0e0',
              backgroundColor: '#f8f9fa'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: '#333'
              }}>
                {t('inventory.history_list')} ({history.length} {t('common.items')})
              </h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#f8f9fa',
                    borderBottom: '2px solid #e0e0e0'
                  }}>
                    <th style={{ padding: '16px', textAlign: 'left' }}>{t('common.number')}</th>
                    <th style={{ padding: '16px', textAlign: 'left' }}>{t('common.date')}</th>
                    <th style={{ padding: '16px', textAlign: 'left' }}>{t('inventory.history_type')}</th>
                    <th style={{ padding: '16px', textAlign: 'left' }}>{t('inventory.history_source')}</th>
                    <th style={{ padding: '16px', textAlign: 'right' }}>{t('inventory.history_quantity')} (+/−)</th>
                    <th style={{ padding: '16px', textAlign: 'right' }}>{t('product.cost_price')}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => {
                    const isOut = (item.type || 'in') === 'out';
                    const sign = isOut ? '-' : '+';
                    const color = isOut ? '#e53935' : '#2e7d32';
                    return (
                      <tr
                        key={item.id}
                        style={{ borderBottom: '1px solid #eee', transition: 'background-color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '16px', fontSize: '14px', color: '#333' }}>{index + 1}</td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#333' }}>{formatDateOnly(item.date)}</td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#333' }}>{(item.type || 'in').toUpperCase()}</td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#333' }}>{item.source || '-'}</td>
                        <td style={{ padding: '16px', fontSize: '14px', color, textAlign: 'right' }}>{sign}{parseInt(item.quantity || 0).toLocaleString()}</td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#333', textAlign: 'right' }}>{isOut ? '-' : `฿${parseFloat(item.costPrice || 0).toLocaleString()}`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}