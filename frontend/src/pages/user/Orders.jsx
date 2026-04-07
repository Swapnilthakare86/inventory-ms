import { useEffect, useState } from 'react';
import { FiClock, FiPackage, FiShoppingBag } from 'react-icons/fi';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import SkeletonTable from '../../components/SkeletonTable';

const PER_PAGE = 10;
const STATUS_OPTIONS = [['all','All'],['placed','Placed'],['received','Received'],['cancelled','Cancelled']];
const formatCurrency = (v) => `Rs. ${parseFloat(v || 0).toFixed(2)}`;

const statusClass = (s) => {
  if (s === 'placed')    return { color: 'var(--warning)', bg: 'var(--warning-soft)' };
  if (s === 'received')  return { color: 'var(--success)', bg: 'var(--success-soft)' };
  if (s === 'cancelled') return { color: 'var(--danger)',  bg: 'var(--danger-soft)'  };
  return { color: 'var(--muted)', bg: '#f1f5f9' };
};

export default function UserOrders() {
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmId, setConfirmId]     = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try { const r = await API.get('/orders/my'); setOrders(r.data); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchOrders(); }, []);
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cancelOrder = async () => {
    try {
      await API.patch(`/orders/${confirmId}/status`, { status: 'cancelled' });
      toast.success('Order cancelled.'); fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setConfirmId(null); }
  };

  const filtered   = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalSpent = orders.filter(o => o.status !== 'cancelled').reduce((a, o) => a + parseFloat(o.total_price), 0);
  const countOf    = (s) => orders.filter(o => o.status === s).length;
  const isMobile = viewportWidth <= 768;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h3 className="page__title">My Orders</h3>
          <p className="page__subtitle">Track placed items, review totals, and manage active orders.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="row g-2 mb-3">
        {[
          { label: 'Total Orders', value: orders.length,              icon: FiShoppingBag, accent: 'var(--primary)', bg: 'var(--primary-soft)' },
          { label: 'Total Spent',  value: formatCurrency(totalSpent), icon: FiPackage,     accent: '#6d48d7',        bg: '#f3edff' },
          { label: 'Placed',       value: countOf('placed'),          icon: FiClock,       accent: 'var(--warning)', bg: 'var(--warning-soft)' },
          { label: 'Received',     value: countOf('received'),        icon: FiPackage,     accent: 'var(--success)', bg: 'var(--success-soft)' },
        ].map(({ label, value, icon: Icon, accent, bg }) => (
          <div className="col-12 col-sm-6 col-xl-3" key={label}>
            <div className="summary-card" style={{ padding: isMobile ? '10px 12px' : undefined, borderRadius: isMobile ? 16 : undefined }}>
              <div className="d-flex align-items-center" style={{ gap: isMobile ? 10 : 12 }}>
                <div className="summary-card__icon" style={{ background: bg, color: accent, width: isMobile ? 38 : 44, height: isMobile ? 38 : 44, borderRadius: isMobile ? 12 : 14 }}><Icon size={isMobile ? 15 : 18} /></div>
                <div>
                  <div className="summary-card__label" style={{ fontSize: isMobile ? 10.5 : undefined }}>{label}</div>
                  <div className="summary-card__value" style={{ fontSize: isMobile ? 14 : 22 }}>{value}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="filter-bar" style={{ padding: isMobile ? '8px' : undefined, borderRadius: isMobile ? 16 : undefined }}>
        <div
          className="d-flex"
          style={{
            gap: isMobile ? 6 : 10,
            flexWrap: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {STATUS_OPTIONS.map(([s, label]) => (
            <button key={s} type="button" className={`filter-btn filter-btn--${statusFilter === s ? 'active' : 'inactive'}`}
              style={isMobile ? { padding: '6px 9px', fontSize: 10.5, minHeight: 34, borderRadius: 11, flex: '1 1 0', justifyContent: 'center' } : undefined}
              onClick={() => { setStatusFilter(s); setPage(1); }}>
              {label}
              {s !== 'all' && (
                <span className={`filter-count filter-count--${statusFilter === s ? 'active' : 'inactive'}`} style={isMobile ? { minWidth: 16, height: 16, fontSize: 8.5 } : undefined}>{countOf(s)}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        {isMobile ? (
          <div className="table-responsive" style={{ overflowX: 'hidden' }}>
            <table className="table align-middle mb-0" style={{ tableLayout: 'fixed', width: '100%', minWidth: 0 }}>
              <thead>
                <tr>
                  {['Sr No','Product','Category','Qty','Total','Status'].map((l, idx) => (
                    <th
                      key={l}
                      style={{
                        fontSize: 8.4,
                        padding:
                          idx === 0 ? '8px 2px 8px 4px' :
                          idx === 1 ? '8px 3px 8px 2px' :
                          idx === 2 ? '8px 6px 8px 4px' :
                          idx === 3 ? '8px 3px' :
                          idx === 4 ? '8px 6px 8px 4px' :
                          '8px 4px 8px 6px',
                      }}
                    >
                      {l}
                    </th>
                  ))}
                </tr>
              </thead>
              {loading ? <SkeletonTable cols={6} rows={5} /> : (
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={6} className="table-empty">No orders found for the selected filters.</td></tr>
                  ) : paginated.map((order, index) => {
                    const s = statusClass(order.status);
                    return (
                      <tr key={order.id} onClick={() => setDetailOrder(order)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                        <td className="td-bold" style={{ fontSize: 8.4, padding: '8px 2px 8px 4px', width: '10%', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          {(page - 1) * PER_PAGE + index + 1}
                        </td>
                        <td style={{ padding: '8px 3px 8px 2px', width: '27%', verticalAlign: 'top' }}>
                          <div style={{ fontSize: 8.1, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, wordBreak: 'break-word' }}>
                            {order.product_name}
                          </div>
                          <div style={{ fontSize: 7.05, color: 'var(--muted)', lineHeight: 1.2, marginTop: 2 }}>
                            {new Date(order.order_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{ padding: '8px 6px 8px 4px', width: '22%', verticalAlign: 'top' }}>
                          <div style={{ fontSize: 7.35, color: 'var(--text)', lineHeight: 1.2, wordBreak: 'break-word' }}>
                            {order.category_name}
                          </div>
                        </td>
                        <td className="td-bold" style={{ fontSize: 8.3, padding: '8px 3px', width: '10%', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          {order.quantity}
                        </td>
                        <td style={{ padding: '8px 6px 8px 4px', width: '18%', verticalAlign: 'top' }}>
                          <div style={{ fontSize: 7.55, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                            {formatCurrency(order.total_price)}
                          </div>
                          {order.status === 'placed' ? (
                            <button
                              type="button"
                              className="cancel-order-btn"
                              onClick={(e) => { e.stopPropagation(); setConfirmId(order.id); }}
                              style={{ marginTop: 4, padding: '4px 7px', fontSize: 9, borderRadius: 8 }}
                            >
                              Cancel
                            </button>
                          ) : null}
                        </td>
                        <td style={{ padding: '8px 4px 8px 6px', width: '13%', verticalAlign: 'top' }}>
                          <span className="badge-status" style={{ color: s.color, background: s.bg, fontSize: 7.2, padding: '3px 5px', lineHeight: 1.1 }}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              )}
            </table>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>{['S NO','Product','Category','Qty','Total','Date','Status','Action'].map(l => <th key={l}>{l}</th>)}</tr>
              </thead>
              {loading ? <SkeletonTable cols={8} rows={5} /> : (
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={8} className="table-empty">No orders found for the selected filters.</td></tr>
                  ) : paginated.map((order, index) => {
                    const s = statusClass(order.status);
                    return (
                      <tr key={order.id} onClick={() => setDetailOrder(order)}
                        style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                        <td className="td-bold">{(page - 1) * PER_PAGE + index + 1}</td>
                        <td className="td-bold">{order.product_name}</td>
                        <td>{order.category_name}</td>
                        <td className="td-bold">{order.quantity}</td>
                        <td className="td-bold">{formatCurrency(order.total_price)}</td>
                        <td>{new Date(order.order_date).toLocaleDateString()}</td>
                        <td>
                          <span className="badge-status" style={{ color: s.color, background: s.bg }}>{order.status}</span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          {order.status === 'placed'
                            ? <button type="button" className="cancel-order-btn" onClick={() => setConfirmId(order.id)}>Cancel</button>
                            : <span style={{ color: 'var(--muted)', fontSize: 13 }}>-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              )}
            </table>
          </div>
        )}
        <div className="table-card__footer">
          <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onChange={setPage} />
        </div>
      </div>

      {/* Detail Modal */}
      {detailOrder && (
        <div className="modal d-block modal-overlay" onClick={() => setDetailOrder(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-card">
              <div className="modal-card__body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="modal-card__title">Order Details</h5>
                    <p className="modal-card__subtitle">Review the selected order information and current status.</p>
                  </div>
                  <button className="btn-close" onClick={() => setDetailOrder(null)} />
                </div>
                {[['Order ID',`#${detailOrder.id}`],['Product',detailOrder.product_name],['Category',detailOrder.category_name],['Quantity',detailOrder.quantity],['Total',formatCurrency(detailOrder.total_price)],['Date',new Date(detailOrder.order_date).toLocaleString()],['Status',detailOrder.status]].map(([label, value]) => (
                  <div key={label} className="detail-row">
                    <span className="detail-row__label">{label}</span>
                    <span className="detail-row__value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal show={!!confirmId} title="Cancel Order" message="Are you sure you want to cancel this order?"
        confirmLabel="Yes, Cancel" confirmColor="danger" onConfirm={cancelOrder} onCancel={() => setConfirmId(null)} />
    </div>
  );
}
