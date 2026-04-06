import { useEffect, useState } from 'react';
import { MICRO } from '../../api/axios';
import API from '../../api/axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#3d82f5', '#22b566', '#e8a320', '#e24b4a'];

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, stock: 0, ordersToday: 0, revenue: 0 });
  const [ordersPerDay, setOrdersPerDay] = useState([]);
  const [stockByCategory, setStockByCategory] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);

  useEffect(() => {
    API.get('/products').then(r => {
      const prods = r.data;
      setStats(s => ({
        ...s,
        products: prods.length,
        stock: prods.reduce((a, p) => a + p.stock, 0)
      }));
    });
    API.get('/orders').then(r => {
      const today = new Date().toDateString();
      const todayOrders = r.data.filter(o => new Date(o.order_date).toDateString() === today);
      const revenue = r.data.filter(o => o.status !== 'cancelled').reduce((a, o) => a + parseFloat(o.total_price), 0);
      setStats(s => ({ ...s, ordersToday: todayOrders.length, revenue: revenue.toFixed(2) }));
    });
    MICRO.get('/charts/orders-per-day').then(r => setOrdersPerDay(r.data));
    MICRO.get('/charts/stock-by-category').then(r => setStockByCategory(r.data));
    MICRO.get('/charts/top-products').then(r => setTopProducts(r.data));
    MICRO.get('/charts/order-status').then(r => setOrderStatus(r.data));
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
    } catch (err) {
      alert('Export failed. Make sure the microservice is running on port 5001.');
    }
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-semibold mb-0">Dashboard</h4>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-primary" onClick={() => handleExport('orders')}>
            Export Orders CSV
          </button>
          <button className="btn btn-sm btn-outline-success" onClick={() => handleExport('stock')}>
            Export Stock CSV
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Products', value: stats.products, color: '#3d82f5' },
          { label: 'Total Stock',    value: stats.stock,    color: '#22b566' },
          { label: 'Orders Today',   value: stats.ordersToday, color: '#e8a320' },
          { label: 'Revenue',        value: `$${stats.revenue}`, color: '#9055d6' },
        ].map(c => (
          <div className="col-md-3" key={c.label}>
            <div className="rounded-3 p-3 text-white" style={{ background: c.color }}>
              <div className="small mb-1">{c.label}</div>
              <div className="fs-4 fw-semibold">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="row g-3 mb-3">
        <div className="col-md-8">
          <div className="card p-3">
            <div className="small fw-medium mb-2 text-muted">Orders & Revenue (Last 30 days)</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ordersPerDay}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3d82f5" name="Orders" />
                <Line type="monotone" dataKey="revenue" stroke="#22b566" name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-md-4">
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
      <div className="row g-3">
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
    </div>
  );
}