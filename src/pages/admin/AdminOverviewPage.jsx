import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts, getAllWithdrawals, isLowStock } from '../../services';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from 'react-i18next';
import styles from './AdminOverviewPage.module.css';

export default function AdminOverviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [userCounts, setUserCounts] = useState({ customers: 0, staff: 0, total: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const [p, w] = await Promise.all([
          getAllProducts(),
          getAllWithdrawals(),
        ]);
        setProducts(p || []);
        setWithdrawals(w || []);

        const usersSnap = await getDocs(collection(db, 'users'));
        let customers = 0;
        let staff = 0;
        usersSnap.forEach(doc => {
          const role = doc.data().role;
          if (role === 'customer') customers++;
          else if (role === 'staff') staff++;
        });
        setUserCounts({ customers, staff, total: customers + staff });
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    load();
  }, []);

  const lowStock = (products || []).filter(isLowStock);
  const allWithdrawals = withdrawals || [];
  const customerOrders = allWithdrawals.filter(w => (w.createdSource || 'customer') === 'customer');
  const staffWithdrawals = allWithdrawals.filter(w => (w.createdSource || 'staff') === 'staff');
  // eslint-disable-next-line no-unused-vars
  const pendingCustomerOrders = customerOrders.filter(o => (o.shippingStatus || 'รอดำเนินการ') === 'รอดำเนินการ');
  // eslint-disable-next-line no-unused-vars
  const pendingWithdrawals = staffWithdrawals.filter(o => (o.shippingStatus || 'รอดำเนินการ') === 'รอดำเนินการ');

  const today = new Date();
  const isSameDay = (ts) => {
    if (!ts) return false;
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  // eslint-disable-next-line no-unused-vars
  const todayRevenue = customerOrders
    .filter(o => isSameDay(o.createdAt))
    .reduce((sum, o) => sum + (parseFloat(o.total || 0) || 0), 0);

  const totalRevenue = customerOrders
    .reduce((sum, o) => sum + (parseFloat(o.total || 0) || 0), 0);

  // Build daily revenue for last 7 days
  const buildDailyRevenue = () => {
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      days.push({ key, date: d, total: 0 });
    }

    const map = new Map(days.map(d => [d.key, d]));

    customerOrders.forEach((o) => {
      const ts = o.createdAt;
      if (!ts) return;
      const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) return;
      const row = map.get(key);
      row.total += (parseFloat(o.total || 0) || 0);
    });

    return days;
  };

  const dailyRevenue = buildDailyRevenue();
  const maxDailyRevenue = dailyRevenue.reduce((m, d) => Math.max(m, d.total), 0) || 1;

  // Recent orders (last 5)
  const recentOrders = [...customerOrders]
    .sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    })
    .slice(0, 5);

  const formatDate = (ts) => {
    if (!ts) return '-';
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'จัดส่งแล้ว':
      case 'shipped':
        return styles.statusShipped;
      case 'รอดำเนินการ':
      case 'pending':
        return styles.statusPending;
      case 'ยกเลิก':
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return styles.statusPaid;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'จัดส่งแล้ว':
        return 'Shipped';
      case 'รอดำเนินการ':
        return 'Pending';
      case 'ยกเลิก':
        return 'Cancelled';
      default:
        return 'Paid';
    }
  };

  const getCustomerInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const avatarColors = [
    styles.customerAvatarBlue,
    styles.customerAvatarOrange,
    styles.customerAvatarPurple,
    styles.customerAvatarTeal,
  ];

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderText}>
          <h1 className={styles.pageTitle}>Overview</h1>
          <p className={styles.pageSubtitle}>Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.addButton} onClick={() => navigate('/admin/products/new')}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>add</span>
            Add Product
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        {/* Card 1: Revenue (Gradient Primary) */}
        <div className={styles.kpiCardPrimary}>
          <div className={styles.kpiCardPrimaryGlow}></div>
          <div className={styles.kpiCardContent}>
            <p className={styles.kpiLabel}>Total Revenue</p>
            <h3 className={styles.kpiValue}>฿{totalRevenue.toLocaleString()}</h3>
          </div>
          <div className={styles.kpiTrend}>
            <span className={styles.kpiTrendBadge}>
              <span className="material-symbols-outlined" style={{ fontSize: '0.875rem', marginRight: '0.25rem' }}>trending_up</span>
              +5.2%
            </span>
            <span className={styles.kpiTrendText}>vs last month</span>
          </div>
        </div>

        {/* Card 2: Orders */}
        <div className={styles.kpiCard} onClick={() => navigate('/admin/orders?source=customer')} style={{ cursor: 'pointer' }}>
          <div className={styles.kpiCardHeader}>
            <div className={styles.kpiCardInfo}>
              <p className={styles.kpiCardLabel}>Total Orders</p>
              <h3 className={styles.kpiCardValue}>{customerOrders.length.toLocaleString()}</h3>
            </div>
            <div className={`${styles.kpiCardIcon} ${styles.kpiCardIconBlue}`}>
              <span className="material-symbols-outlined">shopping_bag</span>
            </div>
          </div>
          <div className={styles.kpiCardTrend}>
            <span className={styles.kpiTrendUp}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_upward</span>
              12.0%
            </span>
            <span className={styles.kpiTrendLabel}>vs last month</span>
          </div>
        </div>

        {/* Card 3: Products */}
        <div className={styles.kpiCard} onClick={() => navigate('/admin/products')} style={{ cursor: 'pointer' }}>
          <div className={styles.kpiCardHeader}>
            <div className={styles.kpiCardInfo}>
              <p className={styles.kpiCardLabel}>Products</p>
              <h3 className={styles.kpiCardValue}>{products.length.toLocaleString()}</h3>
            </div>
            <div className={`${styles.kpiCardIcon} ${styles.kpiCardIconPurple}`}>
              <span className="material-symbols-outlined">inventory</span>
            </div>
          </div>
          <div className={styles.kpiCardTrend}>
            <span className={styles.kpiTrendUp}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_upward</span>
              1.5%
            </span>
            <span className={styles.kpiTrendLabel}>New added</span>
          </div>
        </div>

        {/* Card 4: Low Stock Alerts */}
        <div className={styles.kpiCard} onClick={() => navigate('/admin/alerts')} style={{ cursor: 'pointer' }}>
          <div className={styles.kpiCardHeader}>
            <div className={styles.kpiCardInfo}>
              <p className={styles.kpiCardLabel}>Low Stock Alerts</p>
              <h3 className={styles.kpiCardValue}>{lowStock.length}</h3>
            </div>
            <div className={`${styles.kpiCardIcon} ${styles.kpiCardIconRed}`}>
              <span className="material-symbols-outlined">warning</span>
            </div>
          </div>
          <div className={styles.kpiCardTrend}>
            <span className={styles.kpiTrendWarning}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>priority_high</span>
              Action Needed
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsGrid}>
        {/* Main Area Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartHeaderText}>
              <h3 className={styles.chartTitle}>Revenue Trends</h3>
              <p className={styles.chartSubtitle}>Weekly sales performance</p>
            </div>
            <div className={styles.chartTabs}>
              <button className={styles.chartTabActive}>Weekly</button>
              <button className={styles.chartTab}>Monthly</button>
            </div>
          </div>

          {/* Bar Chart */}
          <div className={styles.barChartContainer}>
            {dailyRevenue.map((d) => {
              const ratio = d.total <= 0 ? 0.05 : d.total / maxDailyRevenue;
              const height = Math.max(20, ratio * 150);
              return (
                <div key={d.key} className={styles.barChartItem}>
                  <div
                    className={styles.barChartBar}
                    style={{ height: `${height}px` }}
                    title={`฿${d.total.toLocaleString()}`}
                  />
                </div>
              );
            })}
          </div>
          <div className={styles.barChartLabels}>
            {dailyRevenue.map((d) => (
              <span key={d.key} className={styles.barChartLabel}>
                {d.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
            ))}
          </div>
        </div>

        {/* Donut Chart */}
        <div className={styles.donutCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartHeaderText}>
              <h3 className={styles.chartTitle}>Sales by Category</h3>
              <p className={styles.chartSubtitle}>Top performing categories</p>
            </div>
          </div>
          <div className={styles.donutChartContainer}>
            <div 
              className={styles.donutChart}
              style={{ background: 'conic-gradient(#135bec 0% 45%, #3b82f6 45% 75%, #93c5fd 75% 90%, #e2e8f0 90% 100%)' }}
            >
              <div className={styles.donutChartCenter}>
                <span className={styles.donutChartValue}>{products.length > 0 ? '85%' : '0%'}</span>
                <span className={styles.donutChartLabel}>Sold</span>
              </div>
            </div>
          </div>
          <div className={styles.donutLegend}>
            <div className={styles.donutLegendItem}>
              <div className={styles.donutLegendLabel}>
                <div className={styles.donutLegendDot} style={{ backgroundColor: '#135bec' }}></div>
                <span className={styles.donutLegendText}>Electronics</span>
              </div>
              <span className={styles.donutLegendValue}>45%</span>
            </div>
            <div className={styles.donutLegendItem}>
              <div className={styles.donutLegendLabel}>
                <div className={styles.donutLegendDot} style={{ backgroundColor: '#3b82f6' }}></div>
                <span className={styles.donutLegendText}>Fashion</span>
              </div>
              <span className={styles.donutLegendValue}>30%</span>
            </div>
            <div className={styles.donutLegendItem}>
              <div className={styles.donutLegendLabel}>
                <div className={styles.donutLegendDot} style={{ backgroundColor: '#93c5fd' }}></div>
                <span className={styles.donutLegendText}>Home</span>
              </div>
              <span className={styles.donutLegendValue}>15%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>Recent Orders</h3>
            <button className={styles.viewAllButton} onClick={() => navigate('/admin/orders?source=customer')}>
              View All
            </button>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.tableHeadCell}>Order ID</th>
                  <th className={styles.tableHeadCell}>Customer</th>
                  <th className={styles.tableHeadCell}>Date</th>
                  <th className={styles.tableHeadCell}>Amount</th>
                  <th className={styles.tableHeadCell}>Status</th>
                  <th className={`${styles.tableHeadCell} ${styles.tableHeadCellRight}`}>Action</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.tableCell} style={{ textAlign: 'center' }}>
                      {t('common.no_data')}
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order, index) => (
                    <tr key={order.id} className={styles.tableRow}>
                      <td className={`${styles.tableCell} ${styles.tableCellBold}`}>
                        #{order.id?.substring(0, 8).toUpperCase() || 'N/A'}
                      </td>
                      <td className={`${styles.tableCell} ${styles.tableCellMuted}`}>
                        <div className={styles.customerCell}>
                          <div className={`${styles.customerAvatar} ${avatarColors[index % avatarColors.length]}`}>
                            {getCustomerInitials(order.requestedBy)}
                          </div>
                          {order.requestedBy || 'Unknown'}
                        </div>
                      </td>
                      <td className={`${styles.tableCell} ${styles.tableCellMuted}`}>
                        {formatDate(order.createdAt)}
                      </td>
                      <td className={`${styles.tableCell} ${styles.tableCellBold}`}>
                        ฿{(order.total || 0).toLocaleString()}
                      </td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.statusBadge} ${getStatusStyle(order.shippingStatus)}`}>
                          {getStatusText(order.shippingStatus)}
                        </span>
                      </td>
                      <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                        <button 
                          className={styles.actionButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/orders/${order.id}`);
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>more_vert</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Footer */}
      <footer className={styles.footer}>
        © 2024 Admin Dashboard. All rights reserved.
      </footer>
    </div>
  );
}
