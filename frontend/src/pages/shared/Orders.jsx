import { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function SharedOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState({ text: '', type: 'info' });

  const fetchOrders = () => API.get('/orders').then(r => setOrders(r.data));
  useEffect(() => { fetchOrders(); }, []);

  const notify = (text, type = 'info') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: 'info' }), 3000); };

  const updateStatus = async (id, status) => {
    try {
      await API.patch(`/orders/${id}/status`, { status });
      notify(`Order marked as ${status}.`, 'success');
      fetchOrders();
    } catch (err) {
      notify(err.response?.data?.message || 'Error', 'danger');
    }
  };

  const statusBadge = (s) => {
    const map = { placed: 'warning', received: 'success', cancelled: 'danger' };
    return <span className={`badge bg-${map[s] || 'secondary'}`}>{s}</span>;
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="p-4">
      <h4 className="fw-semibold mb-4">Orders</h4>

      {msg.text && <div className={`alert alert-${msg.type} py-2 small`} role="alert">{msg.text}</div>}

      <div className="mb-3 d-flex gap-2">
        {['all', 'placed', 'received', 'cancelled'].map(s => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>S NO</th><th>Customer</th><th>Address</th><th>Product</th>
                <th>Category</th><th>Qty</th><th>Total</th><th>Date</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-muted py-3">No orders found</td></tr>
              ) : filtered.map((o, i) => (
                <tr key={o.id}>
                  <td>{i + 1}</td>
                  <td>{o.user_name}</td>
                  <td>{o.address}</td>
                  <td>{o.product_name}</td>
                  <td>{o.category_name}</td>
                  <td>{o.quantity}</td>
                  <td>₹{parseFloat(o.total_price).toFixed(2)}</td>
                  <td>{new Date(o.order_date).toLocaleDateString()}</td>
                  <td>{statusBadge(o.status)}</td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {o.status === 'placed' && (
                        <button className="btn btn-sm btn-success" onClick={() => updateStatus(o.id, 'received')}>Received</button>
                      )}
                      {o.status !== 'cancelled' && (
                        <button className="btn btn-sm btn-danger" onClick={() => updateStatus(o.id, 'cancelled')}>Cancel</button>
                      )}
                    </div>
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
