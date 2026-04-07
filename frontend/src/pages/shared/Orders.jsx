import { useEffect, useState } from 'react';
import { FiCheck, FiDownload, FiX } from 'react-icons/fi';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import SkeletonTable from '../../components/SkeletonTable';

const PER_PAGE = 10;

const STATUS_OPTIONS = [['all','All'],['placed','Placed'],['received','Received'],['cancelled','Cancelled']];
const DATE_OPTIONS   = [['all','All Time'],['today','Today'],['week','This Week'],['month','This Month']];

const statusClass = (s) => {
  if (s === 'placed')    return { color: 'var(--warning)', bg: 'var(--warning-soft)' };
  if (s === 'received')  return { color: 'var(--success)', bg: 'var(--success-soft)' };
  if (s === 'cancelled') return { color: 'var(--danger)',  bg: 'var(--danger-soft)'  };
  return { color: 'var(--muted)', bg: '#f1f5f9' };
};

const formatCurrency = (v) => `Rs. ${parseFloat(v).toFixed(2)}`;

const escapeCsvValue = (v) => {
  const t = String(v ?? '');
  return (t.includes('"') || t.includes(',') || t.includes('\n')) ? `"${t.replace(/"/g,'""')}"` : t;
};

const filterByDate = (list, df) => {
  const now = new Date();
  if (df === 'today') return list.filter(o => new Date(o.order_date).toDateString() === now.toDateString());
  if (df === 'week')  return list.filter(o => new Date(o.order_date) >= new Date(now - 7*86400000));
  if (df === 'month') return list.filter(o => new Date(o.order_date) >= new Date(now - 30*86400000));
  return list;
};

export default function SharedOrders() {
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const [orders, setOrders]         = useState([]);
  const [filter, setFilter]         = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading]       = useState(true);
  const [exporting, setExporting]   = useState(false);
  const [page, setPage]             = useState(1);
  const [confirm, setConfirm]       = useState({ show: false, id: null, status: '' });
  const [detailOrder, setDetailOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try { const r = await API.get('/orders'); setOrders(r.data); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchOrders(); }, []);
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateStatus = async () => {
    try {
      await API.patch(`/orders/${confirm.id}/status`, { status: confirm.status });
      toast.success(`Order marked as ${confirm.status}.`);
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setConfirm({ show: false, id: null, status: '' }); }
  };

  const dateScopedOrders = filterByDate(orders, dateFilter);
  const filtered  = filter === 'all' ? dateScopedOrders : dateScopedOrders.filter(o => o.status === filter);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const countOf   = (s) => dateScopedOrders.filter(o => o.status === s).length;
  const revenue   = dateScopedOrders.filter(o => o.status !== 'cancelled').reduce((a, o) => a + parseFloat(o.total_price || 0), 0);
  const activeDateLabel = DATE_OPTIONS.find(([v]) => v === dateFilter)?.[1] || 'All Time';
  const isMobile = viewportWidth <= 768;

  const handleExport = async () => {
    if (filtered.length === 0) { toast.error('No orders available.'); return; }
    setExporting(true);
    try {
      const rows = [
        ['Order ID','Customer','Address','Product','Category','Quantity','Total','Order Date','Status'],
        ...filtered.map(o => [o.id, o.user_name, o.address, o.product_name, o.category_name, o.quantity, parseFloat(o.total_price).toFixed(2), new Date(o.order_date).toLocaleString(), o.status]),
      ];
      const csv  = rows.map(r => r.map(escapeCsvValue).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `orders-${filter}-${dateFilter}-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success('Orders CSV downloaded.');
    } catch { toast.error('Failed to export orders.'); }
    finally { setExporting(false); }
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h3 className="page__title" style={isMobile ? { fontSize: 15, marginBottom: 2 } : undefined}>Orders</h3>
          <p className="page__subtitle" style={isMobile ? { fontSize: 11, lineHeight: 1.4, maxWidth: 300 } : undefined}>
            Review order activity, filter by status and date range, and update fulfillment states.
          </p>
        </div>
        <button
          className="btn-secondary-custom"
          onClick={handleExport}
          disabled={exporting || loading || filtered.length === 0}
          style={isMobile ? { minHeight: 36, padding: '8px 12px', fontSize: 11.5 } : undefined}
        >
          <FiDownload size={16} />{exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="filter-bar" style={isMobile ? { padding: 8, borderRadius: 14, marginBottom: 10 } : undefined}>
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center" style={isMobile ? { gap: 6 } : undefined}>
          <div className="d-flex flex-wrap gap-2" style={isMobile ? { gap: 6 } : undefined}>
            {STATUS_OPTIONS.map(([s, label]) => (
              <button key={s} className={`filter-btn filter-btn--${filter === s ? 'active' : 'inactive'}`}
                style={isMobile ? { padding: '6px 9px', fontSize: 11, minHeight: 34 } : undefined}
                onClick={() => { setFilter(s); setPage(1); }}>
                {label}
                {s !== 'all' && (
                  <span className={`filter-count filter-count--${filter === s ? 'active' : 'inactive'}`}>{countOf(s)}</span>
                )}
              </button>
            ))}
          </div>
          <div className="d-flex flex-wrap gap-2" style={isMobile ? { gap: 6 } : undefined}>
            {DATE_OPTIONS.map(([v, label]) => (
              <button key={v} className={`filter-btn filter-btn--${dateFilter === v ? 'dark-active' : 'dark-inactive'}`}
                style={isMobile ? { padding: '6px 9px', fontSize: 11, minHeight: 34 } : undefined}
                onClick={() => { setDateFilter(v); setPage(1); }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="revenue-strip" style={isMobile ? { paddingTop: 10, marginTop: 10 } : undefined}>
          <span style={{ color: 'var(--muted)', fontSize: isMobile ? 11.5 : 13, marginRight: 8 }}>
            Revenue for <strong style={{ color: 'var(--text)' }}>{activeDateLabel}</strong>
          </span>
          <span className="revenue-badge" style={isMobile ? { fontSize: 11.5, padding: '6px 9px' } : undefined}>{formatCurrency(revenue)}</span>
        </div>
      </div>

      <div className="table-card">
        {isMobile ? (
          <div className="table-responsive" style={{ overflowX: 'hidden' }}>
            <table
              className="table align-middle mb-0"
              style={{ tableLayout: 'fixed', width: '100%', minWidth: 0 }}
            >
              <thead>
                <tr>{['Sr No','Customer','Product','Qty','Total','Status','Act'].map(l => <th key={l} style={{ fontSize: 8.75, padding: '10px 3px' }}>{l}</th>)}</tr>
              </thead>
              {loading ? <SkeletonTable cols={7} rows={5} /> : (
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} className="table-empty">No orders found for the selected filters.</td></tr>
                  ) : paginated.map((order, index) => {
                    const s = statusClass(order.status);
                    return (
                      <tr key={order.id} onClick={() => setDetailOrder(order)}
                        style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                        <td className="td-bold" style={{ fontSize: 8.75, padding: '9px 3px', width: '12%', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          {(page - 1) * PER_PAGE + index + 1}
                        </td>
                        <td style={{ padding: '9px 3px', width: '24%', verticalAlign: 'top' }}>
                          <div
                            title={order.user_name}
                            style={{
                              fontSize: 8.9,
                              fontWeight: 700,
                              color: 'var(--text)',
                              lineHeight: 1.2,
                              wordBreak: 'break-word',
                            }}
                          >
                            {order.user_name}
                          </div>
                          <div
                            title={order.address}
                            style={{
                              fontSize: 7.6,
                              color: 'var(--muted)',
                              lineHeight: 1.2,
                              marginTop: 2,
                              wordBreak: 'break-word',
                            }}
                          >
                            {order.address}
                          </div>
                        </td>
                        <td style={{ padding: '9px 3px', width: '22%', verticalAlign: 'top' }}>
                          <div
                            title={order.product_name}
                            style={{
                              fontSize: 8.6,
                              color: 'var(--text)',
                              lineHeight: 1.2,
                              wordBreak: 'break-word',
                            }}
                          >
                            {order.product_name}
                          </div>
                          <div
                            title={order.category_name}
                            style={{
                              fontSize: 7.6,
                              color: 'var(--muted)',
                              lineHeight: 1.2,
                              marginTop: 2,
                              wordBreak: 'break-word',
                            }}
                          >
                            {order.category_name}
                          </div>
                        </td>
                        <td className="td-bold" style={{ fontSize: 8.75, padding: '9px 3px', width: '8%', verticalAlign: 'top', textAlign: 'center' }}>
                          {order.quantity}
                        </td>
                        <td className="td-bold" style={{ fontSize: 8.2, padding: '9px 3px', width: '16%', verticalAlign: 'top' }}>
                          <div style={{ whiteSpace: 'nowrap' }}>Rs.{parseFloat(order.total_price).toFixed(0)}</div>
                          <div style={{ fontSize: 7.3, color: 'var(--muted)', lineHeight: 1.2, marginTop: 2 }}>
                            {new Date(order.order_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{ padding: '9px 3px', width: '11%', verticalAlign: 'top' }}>
                          <span className="badge-status" style={{ color: s.color, background: s.bg, fontSize: 7, padding: '2px 4px', lineHeight: 1.15, textAlign: 'center', justifyContent: 'center', whiteSpace: 'normal' }}>
                            {order.status}
                          </span>
                        </td>
                        <td onClick={e => e.stopPropagation()} style={{ padding: '9px 3px', width: '7%', verticalAlign: 'top' }}>
                          <div className="d-flex flex-column gap-1 align-items-start">
                            {order.status === 'placed' && (
                              <button type="button" className="action-btn"
                                style={{ width: 20, height: 20, borderRadius: 6, color: 'var(--success)', background: '#edf9f2', borderColor: '#cfe9da' }}
                                onClick={() => setConfirm({ show: true, id: order.id, status: 'received' })}>
                                <FiCheck size={9} />
                              </button>
                            )}
                            {order.status !== 'cancelled' && (
                              <button type="button" className="action-btn action-btn--delete"
                                style={{ width: 20, height: 20, borderRadius: 6 }}
                                onClick={() => setConfirm({ show: true, id: order.id, status: 'cancelled' })}>
                                <FiX size={9} />
                              </button>
                            )}
                          </div>
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
                <tr>{['S NO','Customer','Address','Product','Category','Qty','Total','Date','Status','Actions'].map(l => <th key={l}>{l}</th>)}</tr>
              </thead>
              {loading ? <SkeletonTable cols={10} rows={5} /> : (
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={10} className="table-empty">No orders found for the selected filters.</td></tr>
                  ) : paginated.map((order, index) => {
                    const s = statusClass(order.status);
                    return (
                      <tr key={order.id} onClick={() => setDetailOrder(order)}
                        style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                        <td className="td-bold">{(page - 1) * PER_PAGE + index + 1}</td>
                        <td className="td-bold">{order.user_name}</td>
                        <td className="td-muted">{order.address}</td>
                        <td>{order.product_name}</td>
                        <td>{order.category_name}</td>
                        <td className="td-bold">{order.quantity}</td>
                        <td className="td-bold">{formatCurrency(order.total_price)}</td>
                        <td>{new Date(order.order_date).toLocaleDateString()}</td>
                        <td>
                          <span className="badge-status" style={{ color: s.color, background: s.bg }}>{order.status}</span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="d-flex gap-2">
                            {order.status === 'placed' && (
                              <button type="button" className="action-btn" style={{ color: 'var(--success)', background: '#edf9f2', borderColor: '#cfe9da' }}
                                onClick={() => setConfirm({ show: true, id: order.id, status: 'received' })}>
                                <FiCheck size={15} />
                              </button>
                            )}
                            {order.status !== 'cancelled' && (
                              <button type="button" className="action-btn action-btn--delete"
                                onClick={() => setConfirm({ show: true, id: order.id, status: 'cancelled' })}>
                                <FiX size={15} />
                              </button>
                            )}
                          </div>
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

      {detailOrder && (
        <div className="modal d-block modal-overlay" onClick={() => setDetailOrder(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-card">
              <div className="modal-card__body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="modal-card__title">Order Details</h5>
                    <p className="modal-card__subtitle">Review the selected order information.</p>
                  </div>
                  <button className="btn-close" onClick={() => setDetailOrder(null)} />
                </div>
                {[['Order ID',`#${detailOrder.id}`],['Customer',detailOrder.user_name],['Address',detailOrder.address],['Product',detailOrder.product_name],['Category',detailOrder.category_name],['Quantity',detailOrder.quantity],['Total',formatCurrency(detailOrder.total_price)],['Date',new Date(detailOrder.order_date).toLocaleString()],['Status',detailOrder.status]].map(([label, value]) => (
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
