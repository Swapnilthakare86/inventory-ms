import { useEffect, useState } from 'react';
import { MICRO } from '../../api/axios';
import API from '../../api/axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#3d82f5', '#22b566', '#e8a320', '#e24b4a'];

export default function SharedDashboard({ isAdmin = false }) {
  const [stats, setStats] = useState({ products: 0, stock: 0, ordersToday: 0, revenue: 0, lowStock: 0 });
  const [ordersPerDay, setOrdersPerDay] = useState([]);
  const [stockByCategory, setStockByCategory] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [showStockAlert, setShowStockAlert] = useState(true);

  const fetchData = () => {
    API.get('/products').then(r => {
      const prods = r.data;
      const low = prods.filter(p => p.stock <= 5);
      setLowStockProducts(low);
      setStats(s => ({
        ...s,
        products: prods.length,
        stock: prods.reduce((a, p) => a + p.stock, 0),
        lowStock: low.length,
      }));
    });
    API.get('/orders').then(r => {
      const today = new Date().toDateString();
      const todayOrders = r.data.filter(o => new Date(o.order_date).toDateString() === today);
      const revenue = r.data.filter(o => o.status !== 'cancelled').reduce((a, o) => a + parseFloat(o.total_price), 0);
      setRecentOrders(r.data.slice(0, 5));
      setStats(s => ({ ...s, ordersToday: todayOrders.length, revenue: revenue.toFixed(2) }));
    });
    MICRO.get('/charts/orders-per-day').then(r => setOrdersPerDay(r.data)).catch(() => {});
    MICRO.get('/charts/stock-by-category').then(r => setStockByCategory(r.data)).catch(() => {});
    MICRO.get('/charts/top-products').then(r => setTopProducts(r.data)).catch(() => {});
    MICRO.get('/charts/order-status').then(r => setOrderStatus(r.data)).catch(() => {});
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleExport = async (type) => {
    try {
      const res = await MICRO.get(`/export/${type}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed. Make sure the microservice is running on port 5001.');
    }
  };

  const statusBadge = (s) => {
    const map = { placed: 'warning', received: 'success', cancelled: 'danger' };
    return <span className={`badge bg-${map[s] || 'secondary'}`}>{s}</span>;
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-semibold mb-0">Dashboard</h4>
      </div>

      {showStockAlert && stats.lowStock > 0 && (
        <div className="alert alert-warning alert-dismissible py-2 small d-flex align-items-center gap-2 mb-4" role="alert">
          ⚠️ <strong>{stats.lowStock} product(s)</strong> are low on stock or out of stock.
          <button type="button" className="btn-close ms-auto" onClick={() => setShowStockAlert(false)} />
        </div>
      )}

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Products',  value: stats.products,             color: '#3d82f5' },
          { label: 'Total Stock',     value: stats.stock,                color: '#22b566' },
          { label: 'Orders Today',    value: stats.ordersToday,          color: '#e8a320' },
          { label: 'Revenue',         value: `₹${stats.revenue}`,       color: '#9055d6' },
          { label: 'Low Stock Items', value: stats.lowStock,             color: stats.lowStock > 0 ? '#e24b4a' : '#6c757d' },
        ].map(c => (
          <div className="col-md-2 col-sm-4" key={c.label}>
            <div className="rounded-3 p-3 text-white" style={{ background: c.color }}>
              <div className="small mb-1">{c.label}</div>
              <div className="fs-4 fw-semibold">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 — admin only shows orders/revenue line chart */}
      <div className="row g-3 mb-3">
        {isAdmin && (
          <div className="col-md-8">
            <div className="card p-3">
              <div className="small fw-medium mb-2 text-muted">Orders & Revenue (Last 30 days)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={ordersPerDay}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip /><Legend />
                  <Line type="monotone" dataKey="count" stroke="#3d82f5" name="Orders" />
                  <Line type="monotone" dataKey="revenue" stroke="#22b566" name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        <div className={isAdmin ? 'col-md-4' : 'col-md-4'}>
          <div className="card p-3">
            <div className="small fw-medium mb-2 text-muted">Order Status</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={orderStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label>
                  {orderStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <div className="card p-3">
            <div className="small fw-medium mb-2 text-muted">Stock by Category</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stockByCategory}>
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total_stock" fill="#3d82f5" name="Stock" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card p-3">
            <div className="small fw-medium mb-2 text-muted">Top 5 Products by Sales</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topProducts} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                <Tooltip />
                <Bar dataKey="total_sold" fill="#22b566" name="Sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders + Low Stock */}
      <div className="row g-3">
        <div className="col-md-7">
          <div className="card p-3">
            <div className="small fw-medium mb-2 text-muted">Recent Orders</div>
            <table className="table table-sm mb-0">
              <thead className="table-light">
                <tr><th>Customer</th><th>Product</th><th>Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-muted">No orders yet</td></tr>
                ) : recentOrders.map(o => (
                  <tr key={o.id}>
                    <td>{o.user_name}</td>
                    <td>{o.product_name}</td>
                    <td>₹{parseFloat(o.total_price).toFixed(2)}</td>
                    <td>{statusBadge(o.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-md-5">
          <div className="card p-3">
            <div className="small fw-medium mb-2 text-muted">Low Stock Products</div>
            <table className="table table-sm mb-0">
              <thead className="table-light">
                <tr><th>Product</th><th>Stock</th><th>Status</th></tr>
              </thead>
              <tbody>
                {lowStockProducts.length === 0 ? (
                  <tr><td colSpan={3} className="text-center text-muted">All products in stock ✅</td></tr>
                ) : lowStockProducts.map(p => (
                  <tr key={p.id} className={p.stock === 0 ? 'table-danger' : 'table-warning'}>
                    <td>{p.name}</td>
                    <td>{p.stock}</td>
                    <td><span className={`badge bg-${p.stock === 0 ? 'danger' : 'warning'}`}>
                      {p.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                    </span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
