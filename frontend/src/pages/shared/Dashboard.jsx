import { useEffect, useState } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  HiOutlineCube,
  HiOutlineArchiveBox,
  HiOutlineShoppingCart,
  HiOutlineCurrencyRupee,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';

const STATUS_COLORS = {
  cancelled: '#DC2626',
  received: '#16A34A',
  placed: '#2563EB',
};

const C = {
  primary: '#2563EB',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  purple: '#7C3AED',
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#64748B',
  label: '#94A3B8',
};

const card = {
  background: C.card,
  borderRadius: 10,
  border: `1px solid ${C.border}`,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  padding: '10px',
};

const chartCard = {
  ...card,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  minWidth: 0,
  width: '100%',
};

const formatDateKey = (value) => new Date(value).toISOString().slice(0, 10);

const buildOrdersPerDay = (orders) => {
  const last30 = new Date();
  last30.setDate(last30.getDate() - 30);

  const grouped = orders.reduce((acc, order) => {
    const orderDate = new Date(order.order_date);
    if (orderDate < last30) return acc;

    const key = formatDateKey(order.order_date);
    if (!acc[key]) acc[key] = { date: key, count: 0, revenue: 0 };

    acc[key].count += 1;
    if (order.status === 'received') {
      acc[key].revenue += parseFloat(order.total_price || 0);
    }

    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
};

const buildStockByCategory = (products) => {
  const grouped = products.reduce((acc, product) => {
    const key = product.category_name || 'Uncategorized';
    acc[key] = (acc[key] || 0) + Number(product.stock || 0);
    return acc;
  }, {});

  return Object.entries(grouped).map(([category, total_stock]) => ({ category, total_stock }));
};

const buildTopProducts = (orders) => {
  const grouped = orders.reduce((acc, order) => {
    if (order.status === 'cancelled') return acc;
    const key = order.product_name || 'Unknown';
    acc[key] = (acc[key] || 0) + Number(order.quantity || 0);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([name, total_sold]) => ({ name, total_sold }))
    .sort((a, b) => b.total_sold - a.total_sold)
    .slice(0, 5);
};

const buildOrderStatus = (orders) => {
  const grouped = orders.reduce((acc, order) => {
    const key = order.status || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([status, count]) => ({ status, count }));
};

const StatCard = ({ label, value, icon: Icon, color, compact = false, mobile = false }) => (
  <div
    style={{
      ...card,
      padding: mobile ? '8px 10px' : compact ? '10px 12px' : '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: mobile ? 8 : compact ? 10 : 14,
      minHeight: mobile ? 62 : compact ? 72 : 80,
      height: '100%',
    }}
  >
    <div
      style={{
        width: mobile ? 30 : compact ? 34 : 38,
        height: mobile ? 30 : compact ? 34 : 38,
        borderRadius: mobile ? 9 : compact ? 10 : 8,
        background: `${color}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={mobile ? 16 : compact ? 18 : 20} color={color} />
    </div>
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: mobile ? 10 : compact ? 11 : 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          color: C.muted,
          lineHeight: 1.3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: mobile ? 14 : compact ? 18 : 22,
          fontWeight: 700,
          color: C.text,
          lineHeight: 1.2,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </div>
    </div>
  </div>
);

const CardTitle = ({ children, compact = false }) => (
  <div style={{ fontSize: compact ? 13 : 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
    {children}
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    placed: [C.warning, '#FFFBEB'],
    received: [C.success, '#F0FDF4'],
    cancelled: [C.danger, '#FFF5F5'],
  };
  const [color, bg] = map[status] || [C.muted, '#F8FAFC'];

  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 20,
        background: bg,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
};

export default function Dashboard({ isAdmin = false }) {
  const { user } = useAuth();
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const [stats, setStats] = useState({
    products: 0,
    stock: 0,
    ordersToday: 0,
    revenue: 0,
    lowStock: 0,
  });
  const [ordersPerDay, setOrdersPerDay] = useState([]);
  const [stockByCategory, setStockByCategory] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [showAlert, setShowAlert] = useState(true);

  const fetchData = () => {
    API.get('/products')
      .then((r) => {
        const prods = r.data;
        const low = prods.filter((p) => p.stock <= 5);
        setStockByCategory(buildStockByCategory(prods));
        setLowStockProducts(low);
        setStats((s) => ({
          ...s,
          products: prods.length,
          stock: prods.reduce((a, p) => a + p.stock, 0),
          lowStock: low.length,
        }));
      })
      .catch(() => {});

    API.get('/orders')
      .then((r) => {
        const orders = r.data;
        const today = new Date().toDateString();
        const revenue = orders
          .filter((o) => o.status === 'received')
          .reduce((a, o) => a + parseFloat(o.total_price || 0), 0);

        setOrdersPerDay(buildOrdersPerDay(orders));
        setTopProducts(buildTopProducts(orders));
        setOrderStatus(buildOrderStatus(orders));
        setRecentOrders(orders.slice(0, 4));
        setStats((s) => ({
          ...s,
          ordersToday: orders.filter((o) => new Date(o.order_date).toDateString() === today).length,
          revenue: revenue.toFixed(2),
        }));
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = viewportWidth <= 768;
  const isTablet = viewportWidth > 768 && viewportWidth <= 1100;
  const compact = viewportWidth <= 1100;
  const chartHeight = isMobile ? 240 : isTablet ? 220 : 180;
  const pieHeight = isMobile ? 220 : isTablet ? 210 : 170;

  const statsCards = [
    { label: 'Total Products', value: stats.products, icon: HiOutlineCube, color: C.primary },
    { label: 'Total Stock', value: stats.stock, icon: HiOutlineArchiveBox, color: C.success },
    { label: 'Orders Today', value: stats.ordersToday, icon: HiOutlineShoppingCart, color: C.warning },
    { label: 'Revenue', value: `${stats.revenue}`, icon: HiOutlineCurrencyRupee, color: C.purple },
    { label: 'Low Stock', value: stats.lowStock, icon: HiOutlineExclamationTriangle, color: stats.lowStock > 0 ? C.danger : C.muted },
  ];

  return (
    <div
      style={{
        background: C.bg,
        padding: isMobile ? '10px' : compact ? '12px' : '12px 10px 12px 16px',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 12 : 10,
        boxSizing: 'border-box',
        width: '100%',
        overflowX: 'hidden',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, flexShrink: 0 }}>
        {(isAdmin || user?.role === 'staff') && (
          <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 500, color: C.muted }}>
            Welcome back, {user?.name || (isAdmin ? 'Admin' : 'Staff')}
          </span>
        )}
        <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: C.text }}>Dashboard</span>
      </div>

      {showAlert && stats.lowStock > 0 && (
        <div
          style={{
            flexShrink: 0,
            minHeight: isMobile ? 34 : 36,
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 8,
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: 8,
            fontSize: isMobile ? 12 : 14,
            color: '#92400E',
            width: isMobile ? '100%' : 'fit-content',
            maxWidth: '100%',
          }}
        >
          <HiOutlineExclamationTriangle size={15} />
          <strong>{stats.lowStock} product(s)</strong> are low on stock or out of stock.
          <button
            onClick={() => setShowAlert(false)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 15,
              color: '#92400E',
              lineHeight: 1,
            }}
          >
            x
          </button>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile
            ? 'repeat(2, minmax(0, 1fr))'
            : isTablet
              ? 'repeat(3, minmax(0, 1fr))'
              : 'repeat(5, minmax(0, 1fr))',
          gap: isMobile ? 8 : 8,
        }}
      >
        {statsCards.map((item, index) => (
          <div key={item.label} style={isMobile && index === statsCards.length - 1 ? { gridColumn: '1 / -1' } : undefined}>
            <StatCard label={item.label} value={item.value} icon={item.icon} color={item.color} compact={compact} mobile={isMobile} />
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '54% 22% 20%',
          gap: isMobile ? 10 : 8,
          minWidth: 0,
        }}
      >
        <div style={chartCard}>
          <CardTitle compact={compact}>Orders & Revenue - Last 30 Days</CardTitle>
          <div style={{ minHeight: chartHeight, width: '100%' }}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={ordersPerDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="count" stroke={C.primary} strokeWidth={2} dot={false} name="Orders" />
                <Line type="monotone" dataKey="revenue" stroke={C.success} strokeWidth={2} dot={false} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={chartCard}>
          <CardTitle compact={compact}>Order Status</CardTitle>
          <div style={{ minHeight: pieHeight, width: '100%' }}>
            <ResponsiveContainer width="100%" height={pieHeight}>
              <PieChart>
                <Pie data={orderStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius="65%" label={({ count }) => count}>
                  {orderStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || '#2563EB'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          style={{
            ...card,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'hidden',
            ...(isTablet ? { gridColumn: '1 / -1' } : null),
          }}
        >
          <CardTitle compact={compact}>Low Stock</CardTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: isMobile ? 320 : '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Product', 'Qty', 'Status'].map((h) => (
                    <th
                      key={h}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: C.label,
                        padding: '4px 6px',
                        textAlign: 'left',
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ fontSize: 12, color: C.muted, padding: '12px 6px', textAlign: 'center' }}>
                      All in stock
                    </td>
                  </tr>
                ) : (
                  lowStockProducts.slice(0, 4).map((p) => (
                    <tr key={p.id} style={{ height: 34 }}>
                      <td style={{ fontSize: 12, padding: '3px 6px', color: C.text, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </td>
                      <td style={{ fontSize: 12, padding: '3px 6px', fontWeight: 700, color: p.stock === 0 ? C.danger : C.warning }}>
                        {p.stock}
                      </td>
                      <td style={{ padding: '3px 6px' }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: 20,
                            background: p.stock === 0 ? '#FFF5F5' : '#FFFBEB',
                            color: p.stock === 0 ? C.danger : C.warning,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.stock === 0 ? 'Out' : 'Low'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '26% 26% 28% 16%',
          gap: isMobile ? 10 : 8,
          minWidth: 0,
        }}
      >
        <div style={chartCard}>
          <CardTitle compact={compact}>Stock by Category</CardTitle>
          <div style={{ minHeight: chartHeight, width: '100%' }}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={stockByCategory} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="total_stock" name="Stock" radius={[4, 4, 0, 0]}>
                  {stockByCategory.map((entry, index) => (
                    <Cell key={`stock-cell-${index}`} fill={entry.total_stock <= 5 ? C.danger : C.primary} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={chartCard}>
          <CardTitle compact={compact}>Top 5 Products by Sales</CardTitle>
          <div style={{ minHeight: chartHeight, width: '100%' }}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={78} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="total_sold" fill={C.success} name="Sold" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          style={{
            ...card,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'hidden',
            ...(isTablet ? { gridColumn: '1 / -1' } : null),
          }}
        >
          <CardTitle compact={compact}>Recent Orders</CardTitle>
          <div style={{ overflowX: 'hidden' }}>
            <table
              style={{
                width: '100%',
                minWidth: '100%',
                borderCollapse: 'collapse',
                tableLayout: isMobile ? 'fixed' : 'auto',
              }}
            >
              <thead>
                <tr>
                  {['Customer', 'Product', 'Total', 'Status'].map((h) => (
                    <th
                      key={h}
                      style={{
                        fontSize: isMobile ? 10 : 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: C.label,
                        padding: isMobile ? '4px 4px' : '4px 6px',
                        textAlign: 'left',
                        borderBottom: `1px solid ${C.border}`,
                        width: isMobile
                          ? h === 'Customer'
                            ? '31%'
                            : h === 'Product'
                              ? '29%'
                              : h === 'Total'
                                ? '22%'
                                : '18%'
                          : 'auto',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ fontSize: 12, color: C.muted, padding: '12px 6px', textAlign: 'center' }}>
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.id} style={{ height: 34 }}>
                      <td style={{ fontSize: isMobile ? 11 : 12, padding: isMobile ? '3px 4px' : '3px 6px', color: C.text, maxWidth: isMobile ? 74 : 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.user_name}
                      </td>
                      <td style={{ fontSize: isMobile ? 11 : 12, padding: isMobile ? '3px 4px' : '3px 6px', color: C.muted, maxWidth: isMobile ? 72 : 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.product_name}
                      </td>
                      <td style={{ fontSize: isMobile ? 11 : 12, padding: isMobile ? '3px 4px' : '3px 6px', color: C.text, whiteSpace: 'nowrap' }}>
                        {isMobile ? `Rs.${parseFloat(o.total_price).toFixed(0)}` : `Rs. ${parseFloat(o.total_price).toFixed(0)}`}
                      </td>
                      <td style={{ padding: isMobile ? '3px 4px' : '3px 6px' }}>
                        {isMobile ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 9,
                              fontWeight: 600,
                              padding: '2px 5px',
                              borderRadius: 999,
                              background: o.status === 'received' ? '#F0FDF4' : o.status === 'cancelled' ? '#FFF5F5' : '#FFFBEB',
                              color: o.status === 'received' ? C.success : o.status === 'cancelled' ? C.danger : C.warning,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {o.status}
                          </span>
                        ) : (
                          <StatusBadge status={o.status} />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div
          style={{
            ...card,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            justifyContent: 'center',
            alignItems: 'flex-start',
            minWidth: 0,
            overflow: 'hidden',
            ...(isTablet ? { gridColumn: '1 / -1' } : null),
          }}
        >
          <CardTitle compact={compact}>Quick Summary</CardTitle>
          {[
            { label: 'Placed', count: orderStatus.find((o) => o.status === 'placed')?.count || 0, color: C.warning },
            { label: 'Received', count: orderStatus.find((o) => o.status === 'received')?.count || 0, color: C.success },
            { label: 'Cancelled', count: orderStatus.find((o) => o.status === 'cancelled')?.count || 0, color: C.danger },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: compact ? 12 : 13, color: C.muted }}>{label}</span>
              </div>
              <span style={{ fontSize: compact ? 15 : 16, fontWeight: 700, color: C.text }}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
