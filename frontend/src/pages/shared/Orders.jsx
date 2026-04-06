import { useEffect, useState } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import SkeletonTable from '../../components/SkeletonTable';

const PER_PAGE = 10;

export default function SharedOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState({ show: false, id: null, status: '' });
  const [detailOrder, setDetailOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const r = await API.get('/orders');
      setOrders(r.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async () => {
    try {
      await API.patch(`/orders/${confirm.id}/status`, { status: confirm.status });
      toast.success(`Order marked as ${confirm.status}.`);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setConfirm({ show: false, id: null, status: '' }); }
  };

  const statusBadge = (s) => {
    const map = { placed: 'warning', received: 'success', cancelled: 'danger' };
    return <span className={`badge bg-${map[s] || 'secondary'}`}>{s}</span>;
  };

  const filterByDate = (list) => {
    const now = new Date();
    if (dateFilter === 'today') return list.filter(o => new Date(o.order_date).toDateString() === now.toDateString());
    if (dateFilter === 'week') { const w = new Date(now - 7 * 86400000); return list.filter(o => new Date(o.order_date) >= w); }
    if (dateFilter === 'month') { const m = new Date(now - 30 * 86400000); return list.filter(o => new Date(o.order_date) >= m); }
    return list;
  };

  const statusFiltered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const filtered = filterByDate(statusFiltered);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const countOf = (s) => orders.filter(o => o.status === s).length;

  return (
    <div className="p-4">
      <h4 className="fw-semibold mb-4">Orders</h4>

      {/* Status filter with count badges */}
      <div className="mb-3 d-flex gap-2 flex-wrap">
        {[['all', 'All'], ['placed', 'Placed'], ['received', 'Received'], ['cancelled', 'Cancelled']].map(([s, label]) => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => { setFilter(s); setPage(1); }}>
            {label} {s !== 'all' && <span className="badge bg-white text-dark ms-1">{countOf(s)}</span>}
          </button>
        ))}
        <div className="ms-auto d-flex gap-2">
          {[['all', 'All Time'], ['today', 'Today'], ['week', 'This Week'], ['month', 'This Month']].map(([d, label]) => (
            <button key={d} className={`btn btn-sm ${dateFilter === d ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => { setDateFilter(d); setPage(1); }}>
              {label}
            </button>
          ))}
        </div>
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
            {loading ? <SkeletonTable cols={10} rows={5} /> : (
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={10} className="text-center text-muted py-4">No orders found</td></tr>
                ) : paginated.map((o, i) => (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setDetailOrder(o)}>
                    <td>{(page - 1) * PER_PAGE + i + 1}</td>
                    <td>{o.user_name}</td>
                    <td>{o.address}</td>
                    <td>{o.product_name}</td>
                    <td>{o.category_name}</td>
                    <td>{o.quantity}</td>
                    <td>₹{parseFloat(o.total_price).toFixed(2)}</td>
                    <td>{new Date(o.order_date).toLocaleDateString()}</td>
                    <td>{statusBadge(o.status)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="d-flex gap-2">
                        {o.status === 'placed' && (
                          <button className="btn btn-sm btn-success"
                            onClick={() => setConfirm({ show: true, id: o.id, status: 'received' })}>Received</button>
                        )}
                        {o.status !== 'cancelled' && (
                          <button className="btn btn-sm btn-danger"
                            onClick={() => setConfirm({ show: true, id: o.id, status: 'cancelled' })}>Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        <div className="px-3 pb-2">
          <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onChange={setPage} />
        </div>
      </div>

      {/* Order Detail Modal */}
      {detailOrder && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setDetailOrder(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-semibold mb-0">Order Details</h5>
                <button className="btn-close" onClick={() => setDetailOrder(null)} />
              </div>
              {[
                ['Order ID', `#${detailOrder.id}`],
                ['Customer', detailOrder.user_name],
                ['Address', detailOrder.address],
                ['Product', detailOrder.product_name],
                ['Category', detailOrder.category_name],
                ['Quantity', detailOrder.quantity],
                ['Total', `₹${parseFloat(detailOrder.total_price).toFixed(2)}`],
                ['Date', new Date(detailOrder.order_date).toLocaleString()],
                ['Status', detailOrder.status],
              ].map(([label, value]) => (
                <div key={label} className="d-flex justify-content-between py-1 border-bottom small">
                  <span className="text-muted">{label}</span>
                  <span className="fw-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={confirm.show}
        title={confirm.status === 'cancelled' ? 'Cancel Order' : 'Mark as Received'}
        message={`Are you sure you want to mark this order as ${confirm.status}?`}
        confirmLabel={confirm.status === 'cancelled' ? 'Cancel Order' : 'Mark Received'}
        confirmColor={confirm.status === 'cancelled' ? 'danger' : 'success'}
        onConfirm={updateStatus}
        onCancel={() => setConfirm({ show: false, id: null, status: '' })}
      />
    </div>
  );
}
