import { useEffect, useState } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  HiOutlineCube, HiOutlineArchiveBox, HiOutlineShoppingCart,
  HiOutlineCurrencyRupee, HiOutlineExclamationTriangle,
  HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown,
  HiXMark, HiOutlineEye,
} from 'react-icons/hi2';

/* ─── Design tokens ─────────────────────────────────────────────── */
const T = {
  bg:      '#F5F6FA',
  card:    '#FFFFFF',
  border:  '#EAECF0',
  text:    '#101828',
  sub:     '#344054',
  muted:   '#667085',
  label:   '#98A2B3',
  blue:    '#2563EB',
  teal:    '#0D9488',
  orange:  '#EA580C',
  purple:  '#7C3AED',
  red:     '#DC2626',
  green:   '#16A34A',
  shadow:  '0 1px 3px rgba(16,24,40,0.08), 0 1px 2px rgba(16,24,40,0.04)',
  shadowHover: '0 4px 16px rgba(16,24,40,0.12)',
};

const STAT_CARDS = (stats) => [
  { label: 'Total Products',  value: stats.products,        icon: HiOutlineCube,                color: T.blue,   bg: '#EFF6FF', trend: '+2',  up: true  },
  { label: 'Total Stock',     value: stats.stock,           icon: HiOutlineArchiveBox,          color: T.teal,   bg: '#F0FDFA', trend: '+5%', up: true  },
  { label: 'Orders Today',    value: stats.ordersToday,     icon: HiOutlineShoppingCart,        color: T.orange, bg: '#FFF7ED', trend: '+12%',up: true  },
  { label: 'Revenue',         value: `₹${stats.revenue}`,  icon: HiOutlineCurrencyRupee,       color: T.purple, bg: '#F5F3FF', trend: '+8%', up: true  },
  { label: 'Low Stock Items', value: stats.lowStock,        icon: HiOutlineExclamationTriangle, color: stats.lowStock > 0 ? T.red : T.muted, bg: stats.lowStock > 0 ? '#FEF2F2' : '#F9FAFB', trend: stats.lowStock > 0 ? '↑' : '—', up: false },
];

const STATUS_COLOR = {
  placed:    { color: '#B45309', bg: '#FFFBEB', dot: '#F59E0B' },
  received:  { color: '#15803D', bg: '#F0FDF4', dot: '#22C55E' },
  cancelled: { color: '#B91C1C', bg: '#FEF2F2', dot: '#EF4444' },
};

const PIE_COLORS = ['#F59E0B', '#22C55E', '#EF4444'];

/* ─── Helpers ───────────────────────────────────────────────────── */
const fmtDate = (v) => new Date(v).toISOString().slice(0, 10);

const buildOrdersPerDay = (orders) => {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
  const map = {};
  orders.forEach((o) => {
    if (new Date(o.order_date) < cutoff) return;
    const k = fmtDate(o.order_date);
    if (!map[k]) map[k] = { date: k, count: 0, revenue: 0 };
    map[k].count += 1;
    if (o.status === 'received') map[k].revenue += parseFloat(o.total_price || 0);
  });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
};

const buildStockByCategory = (products) => {
  const map = {};
  products.forEach((p) => { const k = p.category_name || 'Other'; map[k] = (map[k] || 0) + Number(p.stock || 0); });
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

/* ─── Sub-components ────────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted, marginBottom: 12 }}>
    {children}
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, boxShadow: T.shadow, padding: 20, transition: 'box-shadow 0.2s', ...style }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadowHover}
    onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadow}>
    {children}
  </div>
);

const StatCard = ({ label, value, icon: Icon, color, bg, trend, up }) => (
  <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, boxShadow: T.shadow, padding: '18px 20px', borderLeft: `4px solid ${color}`, transition: 'box-shadow 0.2s', cursor: 'default' }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadowHover}
    onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadow}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={color} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: up ? T.green : T.red, background: up ? '#F0FDF4' : '#FEF2F2', padding: '2px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 2 }}>
        {up ? <HiOutlineArrowTrendingUp size={11} /> : <HiOutlineArrowTrendingDown size={11} />}
        {trend}
      </span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 600, color: T.text, lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
    <div style={{ fontSize: 13, color: T.muted, fontWeight: 500 }}>{label}</div>
  </div>
);

const StatusPill = ({ status }) => {
  const s = STATUS_COLOR[status] || { color: T.muted, bg: '#F9FAFB', dot: T.muted };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', boxShadow: T.shadow, fontSize: 12 }}>
      <div style={{ fontWeight: 600, color: T.text, marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  );
};

const DonutLabel = ({ cx, cy, total }) => (
  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
    <tspan x={cx} dy="-6" style={{ fontSize: 20, fontWeight: 700, fill: T.text }}>{total}</tspan>
    <tspan x={cx} dy="20" style={{ fontSize: 11, fill: T.muted }}>Total</tspan>
  </text>
);

/* ─── Main component ────────────────────────────────────────────── */
export default function Dashboard({ isAdmin = false }) {
  const { user } = useAuth();
  const [stats, setStats]               = useState({ products: 0, stock: 0, ordersToday: 0, revenue: 0, lowStock: 0 });
  const [ordersPerDay, setOrdersPerDay] = useState([]);
  const [stockByCategory, setStockByCategory] = useState([]);
  const [topProducts, setTopProducts]   = useState([]);
  const [orderStatus, setOrderStatus]   = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [showAlert, setShowAlert]       = useState(true);
  const [orderSearch, setOrderSearch]   = useState('');

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
      setOrdersPerDay(buildOrdersPerDay(orders));
      setTopProducts(buildTopProducts(orders));
      setOrderStatus(buildOrderStatus(orders));
      setRecentOrders(orders.slice(0, 8));
      setStats((s) => ({ ...s, ordersToday: orders.filter((o) => new Date(o.order_date).toDateString() === today).length, revenue: revenue.toFixed(2) }));
    }).catch(() => {});
  };

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 60000); return () => clearInterval(t); }, []);

  const totalOrders = orderStatus.reduce((a, o) => a + o.count, 0);
  const filteredOrders = recentOrders.filter((o) =>
    !orderSearch || o.user_name?.toLowerCase().includes(orderSearch.toLowerCase()) || o.product_name?.toLowerCase().includes(orderSearch.toLowerCase())
  );

  return (
    <div style={{ background: T.bg, minHeight: '100%', padding: '24px 24px 32px', fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif", boxSizing: 'border-box' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 2 }}>Dashboard</div>
        <div style={{ fontSize: 14, color: T.muted }}>Welcome back, <strong style={{ color: T.sub }}>{user?.name}</strong> — here's what's happening today.</div>
      </div>

      {/* ── Low stock alert ── */}
      {showAlert && stats.lowStock > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HiOutlineExclamationTriangle size={18} color="#D97706" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>
              <strong>{stats.lowStock} product{stats.lowStock > 1 ? 's' : ''}</strong> are running low on stock
            </div>
            <div style={{ fontSize: 12, color: '#B45309', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <HiOutlineEye size={13} /> View affected products below
            </div>
          </div>
          <button onClick={() => setShowAlert(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400E', padding: 4, borderRadius: 6, display: 'flex' }}>
            <HiXMark size={18} />
          </button>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {STAT_CARDS(stats).map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* ── Charts row 1 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 16 }}>

        {/* Area chart */}
        <Card>
          <SectionLabel>Orders & Revenue — Last 30 Days</SectionLabel>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={ordersPerDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={T.blue}  stopOpacity={0.15} />
                  <stop offset="95%" stopColor={T.blue}  stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={T.teal}  stopOpacity={0.15} />
                  <stop offset="95%" stopColor={T.teal}  stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: T.muted }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.muted }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area type="monotone" dataKey="count"   stroke={T.blue} strokeWidth={2} fill="url(#gradOrders)"  name="Orders"  dot={false} />
              <Area type="monotone" dataKey="revenue" stroke={T.teal} strokeWidth={2} fill="url(#gradRevenue)" name="Revenue" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Donut pie */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <SectionLabel>Order Status</SectionLabel>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={orderStatus} dataKey="count" nameKey="status" cx="50%" cy="50%"
                innerRadius="52%" outerRadius="75%">
                {orderStatus.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                <DonutLabel cx="50%" cy="50%" total={totalOrders} />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {[
              { label: 'Placed',    key: 'placed',    color: PIE_COLORS[0] },
              { label: 'Received',  key: 'received',  color: PIE_COLORS[1] },
              { label: 'Cancelled', key: 'cancelled', color: PIE_COLORS[2] },
            ].map(({ label, key, color }) => {
              const count = orderStatus.find((o) => o.status === key)?.count || 0;
              const pct   = totalOrders ? Math.round((count / totalOrders) * 100) : 0;
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: 12, color: T.muted }}>{label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{count}</span>
                    <span style={{ fontSize: 11, color: T.label }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Charts row 2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <SectionLabel>Stock by Category</SectionLabel>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stockByCategory} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: T.muted }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: T.muted }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total_stock" name="Stock" radius={[6, 6, 0, 0]}>
                {stockByCategory.map((e, i) => <Cell key={i} fill={e.total_stock <= 5 ? T.red : T.blue} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionLabel>Top 5 Products by Sales</SectionLabel>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: T.muted }} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: T.muted }} tickLine={false} axisLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total_sold" fill={T.teal} name="Sold" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Bottom row: Recent Orders + Low Stock ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

        {/* Recent Orders table */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted }}>Recent Orders</div>
            <input
              placeholder="Search orders..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              style={{ height: 32, borderRadius: 8, border: `1px solid ${T.border}`, padding: '0 12px', fontSize: 12, color: T.text, outline: 'none', width: 180, background: T.bg }}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Customer', 'Product', 'Total', 'Date', 'Status'].map((h) => (
                    <th key={h} style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.label, padding: '10px 16px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: T.muted, fontSize: 13 }}>No orders found</td></tr>
                ) : filteredOrders.map((o, i) => (
                  <tr key={o.id} style={{ background: i % 2 === 0 ? T.card : '#FAFAFA', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: T.text, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.user_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: T.muted, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.product_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: 'nowrap' }}>₹{parseFloat(o.total_price).toFixed(0)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: T.muted, whiteSpace: 'nowrap' }}>{new Date(o.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                    <td style={{ padding: '12px 16px' }}><StatusPill status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Low Stock */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted }}>Low Stock Products</div>
          </div>
          {lowStockProducts.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: T.muted, fontSize: 13 }}>✅ All products in stock</div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {lowStockProducts.slice(0, 6).map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{p.category_name || 'Uncategorized'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: p.stock === 0 ? T.red : T.orange }}>{p.stock}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: p.stock === 0 ? '#FEF2F2' : '#FFFBEB', color: p.stock === 0 ? T.red : T.orange }}>
                      {p.stock === 0 ? 'Out' : 'Low'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
