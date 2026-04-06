import { useEffect, useState } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import SkeletonTable from '../../components/SkeletonTable';

const PER_PAGE = 10;

export default function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [confirmId, setConfirmId] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const r = await API.get('/orders/my');
      setOrders(r.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchOrders(); }, []);

  const cancelOrder = async () => {
    try {
      await API.patch(`/orders/${confirmId}/status`, { status: 'cancelled' });
      toast.success('Order cancelled.');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setConfirmId(null); }
  };

  const statusBadge = (s) => {
    const map = { placed: 'warning', received: 'success', cancelled: 'danger' };
    return <span className={`badge bg-${map[s] || 'secondary'}`}>{s}</span>;
  };

  const totalSpent = orders.filter(o => o.status !== 'cancelled').reduce((a, o) => a + parseFloat(o.total_price), 0);
  const paginated = orders.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="p-4">
      <h4 className="fw-semibold mb-4">My Orders</h4>

      {/* Summary */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Orders', value: orders.length, color: '#3d82f5' },
          { label: 'Total Spent', value: `₹${totalSpent.toFixed(2)}`, color: '#9055d6' },
          { label: 'Placed', value: orders.filter(o => o.status === 'placed').length, color: '#e8a320' },
          { label: 'Received', value: orders.filter(o => o.status === 'received').length, color: '#22b566' },
        ].map(c => (
          <div className="col-6 col-md-3" key={c.label}>
            <div className="rounded-3 p-3 text-white" style={{ background: c.color }}>
              <div className="small mb-1">{c.label}</div>
              <div className="fs-5 fw-semibold">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr><th>S NO</th><th>Product</th><th>Category</th><th>Qty</th><th>Total</th><th>Date</th><th>Status</th><th>Action</th></tr>
            </thead>
            {loading ? <SkeletonTable cols={8} rows={5} /> : (
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-muted py-4">No orders yet</td></tr>
                ) : paginated.map((o, i) => (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setDetailOrder(o)}>
                    <td>{(page - 1) * PER_PAGE + i + 1}</td>
                    <td>{o.product_name}</td>
                    <td>{o.category_name}</td>
                    <td>{o.quantity}</td>
                    <td>₹{parseFloat(o.total_price).toFixed(2)}</td>
                    <td>{new Date(o.order_date).toLocaleDateString()}</td>
                    <td>{statusBadge(o.status)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      {o.status === 'placed' && (
                        <button className="btn btn-sm btn-danger" onClick={() => setConfirmId(o.id)}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        <div className="px-3 pb-2">
          <Pagination total={orders.length} page={page} perPage={PER_PAGE} onChange={setPage} />
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
        show={!!confirmId}
        title="Cancel Order"
        message="Are you sure you want to cancel this order?"
        confirmLabel="Yes, Cancel"
        confirmColor="danger"
        onConfirm={cancelOrder}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
