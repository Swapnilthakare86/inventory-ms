import { useEffect, useState } from 'react';
import API from '../../api/axios';
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

// Map status to color for pie chart
const STATUS_COLORS = {
  cancelled: '#DC2626', // red
  received: '#16A34A', // green
  placed: '#2563EB',   // blue (default for placed)
  // add more statuses if needed
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
  height: '100%',
};

const chartArea = {
  flex: 1,
  minHeight: 0,
  minWidth: 0,
  width: '100%',
};

const topChartArea = {
  ...chartArea,
  height: 110,
  overflow: 'hidden',
};

const bottomChartArea = {
  ...chartArea,
  height: 110,
  overflow: 'hidden',
};

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div
    style={{
      ...card,
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      height: 80,
    }}
  >
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 8,
        background: `${color}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={20} color={color} />
    </div>
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          color: C.muted,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{value}</div>
    </div>
  </div>
);

const CardTitle = ({ children }) => (
  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>{children}</div>
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
      }}
    >
      {status}
    </span>
  );
};

const formatDateKey = (value) => new Date(value).toISOString().slice(0, 10);

const buildOrdersPerDay = (orders) => {
  const last30 = new Date();
  last30.setDate(last30.getDate() - 30);

  const grouped = orders.reduce((acc, order) => {
    const orderDate = new Date(order.order_date);
    if (orderDate < last30) return acc;

    const key = formatDateKey(order.order_date);
    if (!acc[key]) {
      acc[key] = { date: key, count: 0, revenue: 0 };
    }

    acc[key].count += 1;
    if (order.status !== 'cancelled') {
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

export default function Dashboard({ isAdmin = false }) {
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
          .filter((o) => o.status !== 'cancelled')
          .reduce((a, o) => a + parseFloat(o.total_price), 0);

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
    const t = setInterval(fetchData, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        background: C.bg,
        padding: '12px 10px 12px 16px',
        height: 'calc(100vh - 92px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Dashboard</span>
      </div>

      {showAlert && stats.lowStock > 0 && (
        <div
          style={{
            flexShrink: 0,
            minHeight: 36,
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 8,
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: 8,
            fontSize: 14,
            color: '#92400E',
            width: 'fit-content',
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 140px))', gap: 8, flexShrink: 0 }}>
        <StatCard label="Total Products" value={stats.products} icon={HiOutlineCube} color={C.primary} />
        <StatCard label="Total Stock" value={stats.stock} icon={HiOutlineArchiveBox} color={C.success} />
        <StatCard label="Orders Today" value={stats.ordersToday} icon={HiOutlineShoppingCart} color={C.warning} />
        <StatCard label="Revenue" value={`${stats.revenue}`} icon={HiOutlineCurrencyRupee} color={C.purple} />
        <StatCard
          label="Low Stock"
          value={stats.lowStock}
          icon={HiOutlineExclamationTriangle}
          color={stats.lowStock > 0 ? C.danger : C.muted}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '54% 22% 20%', gap: 8, flex: '0 0 34%', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
        <div style={chartCard}>
          <CardTitle>Orders & Revenue - Last 30 Days</CardTitle>
          <div style={topChartArea}>
            <ResponsiveContainer width="100%" height={90}>
              <LineChart data={ordersPerDay} margin={{ top: 4, right: 8, left: 3, bottom: 0 }}>
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
          <CardTitle>Order Status</CardTitle>
          <div style={topChartArea}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={orderStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius="65%" label={({ count }) => count}>
                  {orderStatus.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={STATUS_COLORS[entry.status] || '#2563EB'}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ ...card, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
          <CardTitle>Low Stock</CardTitle>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                    <tr key={p.id} style={{ height: 32 }}>
                      <td style={{ fontSize: 12, padding: '3px 6px', color: C.text, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '26% 26% 28% 16%', gap: 8, flex: '0 0 34%', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
        <div style={chartCard}>
          <CardTitle>Stock by Category</CardTitle>
          <div style={bottomChartArea}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stockByCategory} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="total_stock" name="Stock" radius={[4, 4, 0, 0]}>
                  {stockByCategory.map((entry, index) => (
                    <Cell
                      key={`stock-cell-${index}`}
                      fill={entry.total_stock <= 5 ? C.danger : C.primary}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={chartCard}>
          <CardTitle>Top 5 Products by Sales</CardTitle>
          <div style={bottomChartArea}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={78} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="total_sold" fill={C.success} name="Sold" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ ...card, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
          <CardTitle>Recent Orders</CardTitle>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Customer', 'Product', 'Total', 'Status'].map((h) => (
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
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ fontSize: 12, color: C.muted, padding: '12px 6px', textAlign: 'center' }}>
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.id} style={{ height: 32 }}>
                      <td style={{ fontSize: 12, padding: '3px 6px', color: C.text, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.user_name}
                      </td>
                      <td style={{ fontSize: 12, padding: '3px 6px', color: C.muted, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.product_name}
                      </td>
                      <td style={{ fontSize: 12, padding: '3px 6px', color: C.text, whiteSpace: 'nowrap' }}>
                        Rs. {parseFloat(o.total_price).toFixed(0)}
                      </td>
                      <td style={{ padding: '3px 6px' }}>
                        <StatusBadge status={o.status} />
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
            minHeight: 0,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <CardTitle>Quick Summary</CardTitle>
          {[
            { label: 'Placed', count: orderStatus.find((o) => o.status === 'placed')?.count || 0, color: C.warning },
            { label: 'Received', count: orderStatus.find((o) => o.status === 'received')?.count || 0, color: C.success },
            { label: 'Cancelled', count: orderStatus.find((o) => o.status === 'cancelled')?.count || 0, color: C.danger },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: 13, color: C.muted }}>{label}</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
