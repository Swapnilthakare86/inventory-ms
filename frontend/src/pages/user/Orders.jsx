import { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState('');

  const fetchOrders = () => API.get('/orders/my').then(r => setOrders(r.data));
  useEffect(() => { fetchOrders(); }, []);

  const cancelOrder = async (id) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await API.patch(`/orders/${id}/status`, { status: 'cancelled' });
      setMsg('Order cancelled.');
      fetchOrders();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const statusBadge = (s) => {
    const map = { placed: 'warning', received: 'success', cancelled: 'danger' };
    return <span className={`badge bg-${map[s] || 'secondary'}`}>{s}</span>;
  };

  return (
    <div className="p-4">
      <h4 className="fw-semibold mb-4">My Orders</h4>
      {msg && <div className="alert alert-info py-2 small">{msg}</div>}
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr><th>S NO</th><th>Product</th><th>Category</th><th>Qty</th><th>Total</th><th>Date</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={o.id}>
                  <td>{i + 1}</td>
                  <td>{o.product_name}</td>
                  <td>{o.category_name}</td>
                  <td>{o.quantity}</td>
                  <td>${parseFloat(o.total_price).toFixed(2)}</td>
                  <td>{new Date(o.order_date).toLocaleDateString()}</td>
                  <td>{statusBadge(o.status)}</td>
                  <td>
                    {o.status === 'placed' && (
                      <button className="btn btn-sm btn-danger" onClick={() => cancelOrder(o.id)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}