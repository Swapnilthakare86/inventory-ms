import { useEffect, useState } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import SkeletonTable from '../../components/SkeletonTable';

const PER_PAGE = 10;

const STATUS_OPTIONS = [
  ['all', 'All'],
  ['placed', 'Placed'],
  ['received', 'Received'],
  ['cancelled', 'Cancelled'],
];

const DATE_OPTIONS = [
  ['all', 'All Time'],
  ['today', 'Today'],
  ['week', 'This Week'],
  ['month', 'This Month'],
];

const formatCurrency = (value) => `Rs. ${parseFloat(value).toFixed(2)}`;

const escapeCsvValue = (value) => {
  const text = String(value ?? '');
  if (text.includes('"') || text.includes(',') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const filterOrdersByDate = (list, dateFilter) => {
  const now = new Date();

  if (dateFilter === 'today') {
    return list.filter((order) => new Date(order.order_date).toDateString() === now.toDateString());
  }

  if (dateFilter === 'week') {
    const weekStart = new Date(now.getTime() - 7 * 86400000);
    return list.filter((order) => new Date(order.order_date) >= weekStart);
  }

  if (dateFilter === 'month') {
    const monthStart = new Date(now.getTime() - 30 * 86400000);
    return list.filter((order) => new Date(order.order_date) >= monthStart);
  }

  return list;
};

export default function SharedOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState({ show: false, id: null, status: '' });
  const [detailOrder, setDetailOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await API.get('/orders');
      setOrders(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async () => {
    try {
      await API.patch(`/orders/${confirm.id}/status`, { status: confirm.status });
      toast.success(`Order marked as ${confirm.status}.`);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setConfirm({ show: false, id: null, status: '' });
    }
  };

  const statusBadge = (status) => {
    const map = { placed: 'warning', received: 'success', cancelled: 'danger' };
    return <span className={`badge bg-${map[status] || 'secondary'}`}>{status}</span>;
  };

  const statusFiltered =
    filter === 'all' ? orders : orders.filter((order) => order.status === filter);
  const filtered = filterOrdersByDate(statusFiltered, dateFilter);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const countOf = (status) => orders.filter((order) => order.status === status).length;

  const handleExport = async () => {
    if (filtered.length === 0) {
      toast.error('No orders available for the selected filters.');
      return;
    }

    setExporting(true);

    try {
      const rows = [
        [
          'Order ID',
          'Customer',
          'Address',
          'Product',
          'Category',
          'Quantity',
          'Total',
          'Order Date',
          'Status',
        ],
        ...filtered.map((order) => [
          order.id,
          order.user_name,
          order.address,
          order.product_name,
          order.category_name,
          order.quantity,
          parseFloat(order.total_price).toFixed(2),
          new Date(order.order_date).toLocaleString(),
          order.status,
        ]),
      ];

      const csvContent = rows
        .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.download = `orders-${filter}-${dateFilter}-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Orders CSV downloaded.');
    } catch {
      toast.error('Failed to export orders.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4">
      <h4 className="fw-semibold mb-4">Orders</h4>

      <div className="mb-3 d-flex gap-2 flex-wrap align-items-center">
        {STATUS_OPTIONS.map(([status, label]) => (
          <button
            key={status}
            className={`btn btn-sm ${filter === status ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => {
              setFilter(status);
              setPage(1);
            }}
          >
            {label}{' '}
            {status !== 'all' && (
              <span className="badge bg-white text-dark ms-1">{countOf(status)}</span>
            )}
          </button>
        ))}

        <div className="ms-auto d-flex gap-2 flex-wrap justify-content-end">
          {DATE_OPTIONS.map(([value, label]) => (
            <button
              key={value}
              className={`btn btn-sm ${dateFilter === value ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => {
                setDateFilter(value);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}

          <button
            className="btn btn-sm btn-outline-primary"
            onClick={handleExport}
            disabled={exporting || loading || filtered.length === 0}
          >
            {exporting ? 'Exporting...' : 'Export Orders CSV'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>S NO</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Product</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            {loading ? (
              <SkeletonTable cols={10} rows={5} />
            ) : (
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center text-muted py-4">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  paginated.map((order, index) => (
                    <tr
                      key={order.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setDetailOrder(order)}
                    >
                      <td>{(page - 1) * PER_PAGE + index + 1}</td>
                      <td>{order.user_name}</td>
                      <td>{order.address}</td>
                      <td>{order.product_name}</td>
                      <td>{order.category_name}</td>
                      <td>{order.quantity}</td>
                      <td>{formatCurrency(order.total_price)}</td>
                      <td>{new Date(order.order_date).toLocaleDateString()}</td>
                      <td>{statusBadge(order.status)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="d-flex gap-2">
                          {order.status === 'placed' && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() =>
                                setConfirm({ show: true, id: order.id, status: 'received' })
                              }
                            >
                              Received
                            </button>
                          )}
                          {order.status !== 'cancelled' && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() =>
                                setConfirm({ show: true, id: order.id, status: 'cancelled' })
                              }
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            )}
          </table>
        </div>
        <div className="px-3 pb-2">
          <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onChange={setPage} />
        </div>
      </div>

      {detailOrder && (
        <div
          className="modal d-block"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setDetailOrder(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
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
                ['Total', formatCurrency(detailOrder.total_price)],
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
