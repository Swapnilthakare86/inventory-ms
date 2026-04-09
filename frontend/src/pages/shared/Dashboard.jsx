import { useEffect, useState, useMemo } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  HiOutlineCube, HiOutlineArchiveBox, HiOutlineShoppingCart,
  HiOutlineCurrencyRupee, HiOutlineExclamationTriangle,
  HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown,
} from 'react-icons/hi2';

const STATUS_COLORS = { cancelled: '#DC2626', received: '#16A34A', placed: '#2563EB' };

const C = {
  primary: '#2563EB', success: '#16A34A', warning: '#D97706',
  danger: '#DC2626', purple: '#7C3AED',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', muted: '#64748B', label: '#94A3B8',
};

const card = {
  background: C.card, borderRadius: 10,
  border: `1px solid ${C.border}`,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: '12px',
};

const chartCard = { ...card, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, width: '100%' };

const fmtKey = (v) => new Date(v).toISOString().slice(0, 10);

// ── Date filter helpers ──────────────────────────────────────────
const DATE_FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'month', label: 'This Month' },
  { key: 'all',   label: 'All' },
];

const filterOrdersByDate = (orders, filter) => {
  const now = new Date();
  if (filter === 'today') {
    return orders.filter((o) => new Date(o.order_date).toDateString() === now.toDateString());
  }
  if (filter === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - 7);
    return orders.filter((o) => new Date(o.order_date) >= start);
  }
  if (filter === 'month') {
    const start = new Date(now); start.setDate(now.getDate() - 30);
    return orders.filter((o) => new Date(o.order_date) >= start);
  }
  return orders;
};

// ── Chart builders ───────────────────────────────────────────────
const buildOrdersPerDay = (orders) => {
  const map = {};
  orders.forEach((o) => {
    const k = fmtKey(o.order_date);
    if (!map[k]) map[k] = { date: k, count: 0, revenue: 0 };
    map[k].count += 1;
    if (o.status === 'received') map[k].revenue += parseFloat(o.total_price || 0);
  });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
};

const buildStockByCategory = (products) => {
  const map = {};
  products.forEach((p) => { const k = p.category_name || 'Uncategorized'; map[k] = (map[k] || 0) + Number(p.stock || 0); });
  return Object.entries(map).map(([category, total_stock]) => ({ category, total_stock }));
};

const buildTopProducts = (orders) => {
  const map = {};
  orders.forEach((o) => { if (o.status === 'cancelled') return; const k = o.product_name || 'Unknown'; map[k] = (map[k] || 0) + Number(o.quantity || 0); });
  return Object.entries(map).map(([name, total_sold]) => ({ name, total_sold })).sort((a, b) => b.total_sold - a.total_sold).slice(0, 5);
};

const buildOrderStatus = (orders) => {
  const map = {};
  orders.forEach((o) => { const k = o.status || 'unknown'; map[k] = (map[k] || 0) + 1; });
  return Object.entries(map).map(([status, count]) => ({ status, count }));
};

// ── Revenue trend helper ─────────────────────────────────────────
const calcRevenueTrend = (allOrders) => {
  const now = new Date();
  const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - 7);
  const lastWeekStart = new Date(now); lastWeekStart.setDate(now.getDate() - 14);

  const thisWeek = allOrders
    .filter((o) => o.status === 'received' && new Date(o.order_date) >= thisWeekStart)
    .reduce((a, o) => a + parseFloat(o.total_price || 0), 0);

  const lastWeek = allOrders
    .filter((o) => o.status === 'received' && new Date(o.order_date) >= lastWeekStart && new Date(o.order_date) < thisWeekStart)
    .reduce((a, o) => a + parseFloat(o.total_price || 0), 0);

  if (lastWeek === 0) return { pct: null, up: true };
  const pct = (((thisWeek - lastWeek) / lastWeek) * 100).toFixed(1);
  return { pct, up: parseFloat(pct) >= 0 };
};

// ── Sub-components ───────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, trend }) => (
  <div style={{ ...card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, height: '100%' }}>
    <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} color={color} />
    </div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: C.muted, lineHeight: 1.3 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{value}</div>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
          {trend.up
            ? <HiOutlineArrowTrendingUp size={12} color={C.success} />
            : <HiOutlineArrowTrendingDown size={12} color={C.danger} />}
          <span style={{ fontSize: 11, fontWeight: 600, color: trend.up ? C.success : C.danger }}>
            {trend.up ? '+' : ''}{trend.pct}% vs last week
          </span>
        </div>
      )}
    </div>
  </div>
);

const CardTitle = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>{children}</div>
);

const StatusBadge = ({ status }) => {
  const map = { placed: [C.warning, '#FFFBEB'], received: [C.success, '#F0FDF4'], cancelled: [C.danger, '#FFF5F5'] };
  const [color, bg] = map[status] || [C.muted, '#F8FAFC'];
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: bg, color, whiteSpace: 'nowrap' }}>{status}</span>;
};

const FilterBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    padding: '4px 10px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
    border: `1px solid ${active ? C.primary : C.border}`,
    background: active ? C.primary : C.card,
    color: active ? '#fff' : C.muted,
    transition: 'all 0.15s',
  }}>
    {children}
  </button>
);

// ── Main component ───────────────────────────────────────────────
export default function Dashboard({ isAdmin = false }) {
  const { user } = useAuth();
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const [allOrders, setAllOrders] = useState([]);
  const [stats, setStats] = useState({ products: 0, stock: 0, ordersToday: 0, revenue: 0, lowStock: 0 });
  const [stockByCategory, setStockByCategory] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [showAlert, setShowAlert] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  const [revenueTrend, setRevenueTrend] = useState({ pct: null, up: true });

  const fetchData = () => {
    API.get('/products').then((r) => {
      const prods = r.data;
      const low = prods.filter((p) => p.stock <= 5);
      setStockByCategory(buildStockByCategory(prods));
      setLowStockProducts(low);
      setStats((s) => ({ ...s, products: prods.length, stock: prods.reduce((a, p) => a + p.stock, 0), lowStock: low.length }));
    }).catch(() => {});

    API.get('/orders').then((r) => {
      const orders = r.data;
      const today = new Date().toDateString();
      const revenue = orders.filter((o) => o.status === 'received').reduce((a, o) => a + parseFloat(o.total_price || 0), 0);
      setAllOrders(orders);
      setRevenueTrend(calcRevenueTrend(orders));
      setStats((s) => ({
        ...s,
        ordersToday: orders.filter((o) => new Date(o.order_date).toDateString() === today).length,
        revenue: revenue.toFixed(2),
      }));
    }).catch(() => {});
  };

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 60000); return () => clearInterval(t); }, []);
  useEffect(() => { const fn = () => setVw(window.innerWidth); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn); }, []);

  // ── Derived data from date filter ──────────────────────────────
  const filteredOrders = useMemo(() => filterOrdersByDate(allOrders, dateFilter), [allOrders, dateFilter]);

  const ordersPerDay   = useMemo(() => buildOrdersPerDay(filteredOrders),  [filteredOrders]);
  const topProducts    = useMemo(() => buildTopProducts(filteredOrders),    [filteredOrders]);
  const orderStatus    = useMemo(() => buildOrderStatus(filteredOrders),    [filteredOrders]);
  const recentOrders   = useMemo(() => filteredOrders.slice(0, 5),          [filteredOrders]);

  const filteredRevenue = useMemo(() =>
    filteredOrders.filter((o) => o.status === 'received').reduce((a, o) => a + parseFloat(o.total_price || 0), 0).toFixed(2),
    [filteredOrders]
  );

  const isMobile = vw <= 768;
  const isTablet = vw > 768 && vw <= 1100;
  const areaChartH  = isMobile ? 240 : isTablet ? 220 : 260;
  const smallChartH = isMobile ? 200 : isTablet ? 190 : 200;

  const orderSummaryItems = [
    { label: 'Placed',    count: orderStatus.find((o) => o.status === 'placed')?.count    || 0, color: C.warning },
    { label: 'Received',  count: orderStatus.find((o) => o.status === 'received')?.count  || 0, color: C.success },
    { label: 'Cancelled', count: orderStatus.find((o) => o.status === 'cancelled')?.count || 0, color: C.danger  },
  ];

  // filtered orders count for stat card
  const filteredOrdersCount = filteredOrders.length;

  const statsCards = [
    { label: 'Total Products',  value: stats.products,         icon: HiOutlineCube,                color: C.primary },
    { label: 'Total Stock',     value: stats.stock,            icon: HiOutlineArchiveBox,          color: C.success },
    { label: 'Orders',          value: filteredOrdersCount,    icon: HiOutlineShoppingCart,        color: C.warning },
    {
      label: 'Revenue',
      value: `₹${filteredRevenue}`,
      icon: HiOutlineCurrencyRupee,
      color: C.purple,
      trend: revenueTrend.pct !== null ? revenueTrend : null,
    },
    { label: 'Low Stock', value: stats.lowStock, icon: HiOutlineExclamationTriangle, color: stats.lowStock > 0 ? C.danger : C.muted },
  ];

  return (
    <div style={{ background: C.bg, padding: isMobile ? '10px' : '14px', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 10, boxSizing: 'border-box', width: '100%', overflowX: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {(isAdmin || user?.role === 'staff') && (
            <span style={{ fontSize: 12, fontWeight: 500, color: C.muted }}>Welcome back, {user?.name}</span>
          )}
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Dashboard</span>
        </div>

        {/* Global date filter */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>Show:</span>
          {DATE_FILTERS.map((f) => (
            <FilterBtn key={f.key} active={dateFilter === f.key} onClick={() => setDateFilter(f.key)}>
              {f.label}
            </FilterBtn>
          ))}
        </div>
      </div>

      {/* Alert */}
      {showAlert && stats.lowStock > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, display: 'flex', alignItems: 'center', padding: '8px 12px', gap: 8, fontSize: 13, color: '#92400E' }}>
          <HiOutlineExclamationTriangle size={15} />
          <strong>{stats.lowStock} product(s)</strong>&nbsp;are low on stock or out of stock.
          <button onClick={() => setShowAlert(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#92400E', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: 10 }}>
        {statsCards.map((item, i) => (
          <div key={item.label} style={isMobile && i === statsCards.length - 1 ? { gridColumn: '1 / -1' } : undefined}>
            <StatCard {...item} />
          </div>
        ))}
      </div>

      {/* Row 1 — Chart + Order Summary + Low Stock */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '3fr 1.2fr 1fr', gap: 10, minWidth: 0 }}>

        {/* Line chart with filter label */}
        <div style={chartCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Orders & Revenue</div>
            <span style={{ fontSize: 11, color: C.muted }}>
              {DATE_FILTERS.find((f) => f.key === dateFilter)?.label}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={areaChartH}>
            <LineChart data={ordersPerDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="count"   stroke={C.primary} strokeWidth={2} dot={false} name="Orders" />
              <Line type="monotone" dataKey="revenue" stroke={C.success} strokeWidth={2} dot={false} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Summary */}
        <div style={{ ...chartCard, justifyContent: 'space-between' }}>
          <CardTitle>Order Summary</CardTitle>
          <ResponsiveContainer width="100%" height={smallChartH}>
            <PieChart>
              <Pie data={orderStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius="65%" label={({ count }) => count}>
                {orderStatus.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.status] || C.primary} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 8 }}>
            {orderSummaryItems.map(({ label, count, color }) => (
              <div key={label} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', ...(isTablet ? { gridColumn: '1 / -1' } : {}) }}>
          <CardTitle>Low Stock</CardTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Product', 'Qty', 'Status'].map((h) => (
                  <th key={h} style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: C.label, padding: '4px 6px', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.length === 0 ? (
                <tr><td colSpan={3} style={{ fontSize: 12, color: C.muted, padding: '12px 6px', textAlign: 'center' }}>All in stock ✅</td></tr>
              ) : lowStockProducts.slice(0, 5).map((p) => (
                <tr key={p.id} style={{ height: 32 }}>
                  <td style={{ fontSize: 12, padding: '3px 6px', color: C.text, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                  <td style={{ fontSize: 12, padding: '3px 6px', fontWeight: 700, color: p.stock === 0 ? C.danger : C.warning }}>{p.stock}</td>
                  <td style={{ padding: '3px 6px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: p.stock === 0 ? '#FFF5F5' : '#FFFBEB', color: p.stock === 0 ? C.danger : C.warning }}>
                      {p.stock === 0 ? 'Out' : 'Low'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 2 — Stock by Category + Top Products + Recent Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 10, minWidth: 0 }}>

        <div style={chartCard}>
          <CardTitle>Stock by Category</CardTitle>
          <ResponsiveContainer width="100%" height={smallChartH}>
            <BarChart data={stockByCategory} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="total_stock" name="Stock" radius={[4, 4, 0, 0]}>
                {stockByCategory.map((e, i) => <Cell key={i} fill={e.total_stock <= 5 ? C.danger : C.primary} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={chartCard}>
          <CardTitle>Top 5 Products by Sales</CardTitle>
          <ResponsiveContainer width="100%" height={smallChartH}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={78} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="total_sold" fill={C.success} name="Sold" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders — filtered by date */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', ...(isTablet ? { gridColumn: '1 / -1' } : {}) }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Recent Orders</div>
            <span style={{ fontSize: 11, color: C.muted, background: C.bg, padding: '2px 8px', borderRadius: 6, border: `1px solid ${C.border}` }}>
              {filteredOrders.length} orders
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                {['Customer', 'Product', 'Total', 'Status'].map((h) => (
                  <th key={h} style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: C.label, padding: '4px 6px', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={4} style={{ fontSize: 12, color: C.muted, padding: '16px 6px', textAlign: 'center' }}>
                  No orders for {DATE_FILTERS.find((f) => f.key === dateFilter)?.label.toLowerCase()}
                </td></tr>
              ) : recentOrders.map((o) => (
                <tr key={o.id} style={{ height: 32 }}>
                  <td style={{ fontSize: 12, padding: '3px 6px', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.user_name}</td>
                  <td style={{ fontSize: 12, padding: '3px 6px', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.product_name}</td>
                  <td style={{ fontSize: 12, padding: '3px 6px', color: C.text, whiteSpace: 'nowrap' }}>₹{parseFloat(o.total_price).toFixed(0)}</td>
                  <td style={{ padding: '3px 6px' }}><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
