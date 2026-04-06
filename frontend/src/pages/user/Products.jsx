import { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function UserProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch] = useState('');
  const [orderModal, setOrderModal] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    API.get('/products').then(r => setProducts(r.data));
    API.get('/categories').then(r => setCategories(r.data));
  }, []);

  const filtered = products.filter(p =>
    (!catFilter || p.category_name === catFilter) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  const openOrder = (product) => { setOrderModal(product); setQuantity(1); };

  const placeOrder = async () => {
    try {
      await API.post('/orders', { product_id: orderModal.id, quantity });
      setMessage('Order placed successfully!');
      setOrderModal(null);
      API.get('/products').then(r => setProducts(r.data));
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error');
      setOrderModal(null);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="p-4">
      <h4 className="fw-semibold mb-4">Products</h4>
      {message && <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'} py-2 small`}>{message}</div>}
      
      <div className="d-flex gap-2 mb-3">
        <select className="form-select" style={{ width: 220 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">Select Category</option>
          {categories.map(c => <option key={c.id}>{c.name}</option>)}
        </select>
        <input className="form-control" placeholder="Search products..." style={{ width: 260 }}
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td><td>{p.name}</td><td>{p.category_name}</td>
                  <td>${p.price}</td><td>{p.stock}</td>
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

      {/* Order Modal */}
      {orderModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-4">
              <h5 className="fw-semibold mb-3">Place Order — {orderModal.name}</h5>
              <div className="mb-3">
                <label className="form-label small fw-medium">Quantity</label>
                <input type="number" className="form-control" min={1} max={orderModal.stock}
                  value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
              </div>
              <div className="fw-medium mb-3">Total: ${(quantity * orderModal.price).toFixed(2)}</div>
              <div className="d-flex gap-2">
                <button className="btn btn-success flex-grow-1" onClick={placeOrder}>Place Order</button>
                <button className="btn btn-secondary flex-grow-1" onClick={() => setOrderModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}