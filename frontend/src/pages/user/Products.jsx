import { useEffect, useState } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { FiGrid, FiList } from 'react-icons/fi';

export default function UserProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch] = useState('');
  const [orderModal, setOrderModal] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('table');

  useEffect(() => {
    API.get('/products').then(r => setProducts(r.data));
    API.get('/categories').then(r => setCategories(r.data));
  }, []);

  const filtered = products.filter(p =>
    (!catFilter || p.category_name === catFilter) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  const openOrder = (product) => { setOrderModal(product); setQuantity(1); setConfirmed(false); };

  const placeOrder = async () => {
    setSubmitting(true);
    try {
      await API.post('/orders', { product_id: orderModal.id, quantity });
      toast.success('Order placed successfully!');
      setOrderModal(null);
      API.get('/products').then(r => setProducts(r.data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error placing order');
      setOrderModal(null);
    } finally { setSubmitting(false); }
  };

  const stockBadge = (stock) => {
    if (stock === 0) return <span className="badge bg-danger">Out of Stock</span>;
    if (stock <= 5) return <span className="badge bg-warning">Low Stock</span>;
    return <span className="badge bg-success">In Stock</span>;
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-semibold mb-0">Products</h4>
        <div className="d-flex gap-2">
          <button className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setViewMode('table')}><FiList /></button>
          <button className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setViewMode('grid')}><FiGrid /></button>
        </div>
      </div>

      <div className="d-flex gap-2 mb-3">
        <select className="form-select" style={{ width: 220 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id}>{c.name}</option>)}
        </select>
        <input className="form-control" placeholder="Search products..." style={{ width: 260 }}
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr><th>S NO</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id}>
                    <td>{i + 1}</td><td>{p.name}</td><td>{p.category_name}</td>
                    <td>₹{parseFloat(p.price).toFixed(2)}</td>
                    <td>{p.stock}</td>
                    <td>{stockBadge(p.stock)}</td>
                    <td>
                      <button className="btn btn-sm btn-success" disabled={p.stock === 0} onClick={() => openOrder(p)}>
                        {p.stock === 0 ? 'Out of Stock' : 'Order'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="row g-3">
          {filtered.map(p => (
            <div className="col-sm-6 col-md-4 col-lg-3" key={p.id}>
              <div className="card h-100 p-3">
                <div className="fw-semibold mb-1">{p.name}</div>
                <div className="text-muted small mb-1">{p.category_name}</div>
                <div className="fw-bold text-primary mb-2">₹{parseFloat(p.price).toFixed(2)}</div>
                <div className="mb-3">{stockBadge(p.stock)}</div>
                <button className="btn btn-sm btn-success mt-auto" disabled={p.stock === 0} onClick={() => openOrder(p)}>
                  {p.stock === 0 ? 'Out of Stock' : 'Order Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Modal with confirmation step */}
      {orderModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-semibold mb-0">{confirmed ? 'Confirm Order' : `Order — ${orderModal.name}`}</h5>
                <button className="btn-close" onClick={() => setOrderModal(null)} />
              </div>

              {!confirmed ? (
                <>
                  <div className="mb-3">
                    <label className="form-label small fw-medium">Quantity (max: {orderModal.stock})</label>
                    <input type="number" className="form-control" min={1} max={orderModal.stock}
                      value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
                  </div>
                  <div className="fw-medium mb-3">Total: ₹{(quantity * orderModal.price).toFixed(2)}</div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary flex-grow-1" onClick={() => setConfirmed(true)}>Review Order</button>
                    <button className="btn btn-secondary flex-grow-1" onClick={() => setOrderModal(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="border rounded p-3 mb-3 small">
                    {[['Product', orderModal.name], ['Quantity', quantity], ['Price each', `₹${parseFloat(orderModal.price).toFixed(2)}`], ['Total', `₹${(quantity * orderModal.price).toFixed(2)}`]].map(([l, v]) => (
                      <div key={l} className="d-flex justify-content-between py-1 border-bottom">
                        <span className="text-muted">{l}</span><span className="fw-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-success flex-grow-1" onClick={placeOrder} disabled={submitting}>
                      {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Placing...</> : 'Confirm & Place Order'}
                    </button>
                    <button className="btn btn-secondary flex-grow-1" onClick={() => setConfirmed(false)}>Back</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
