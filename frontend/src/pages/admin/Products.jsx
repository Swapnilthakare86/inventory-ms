import { useEffect, useState } from 'react';
import API from '../../api/axios';

const empty = { name: '', category_id: '', supplier_id: '', price: '', stock: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: 'info' });
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  const fetchAll = () => {
    API.get('/products').then(r => setProducts(r.data));
    API.get('/categories').then(r => setCategories(r.data));
    API.get('/suppliers').then(r => setSuppliers(r.data));
  };
  useEffect(() => { fetchAll(); }, []);

  const notify = (text, type = 'info') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: 'info' }), 3000); };

  const openAdd = () => { setForm(empty); setEditId(null); setShowModal(true); };
  const openEdit = (p) => {
    setForm({ name: p.name, category_id: p.category_id, supplier_id: p.supplier_id, price: p.price, stock: p.stock });
    setEditId(p.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await API.put(`/products/${editId}`, form);
        notify('Product updated.', 'success');
      } else {
        await API.post('/products', form);
        notify('Product created.', 'success');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      notify(err.response?.data?.message || 'Error', 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await API.delete(`/products/${id}`);
      notify('Product deleted.', 'success');
      fetchAll();
    } catch (err) {
      notify(err.response?.data?.message || 'Error', 'danger');
    }
  };

  const stockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'danger' };
    if (stock <= 5) return { label: 'Low Stock', color: 'warning' };
    return { label: 'In Stock', color: 'success' };
  };

  const lowStockCount = products.filter(p => p.stock <= 5).length;

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || p.category_name === catFilter;
    const matchStock = stockFilter === 'all' ? true :
      stockFilter === 'low' ? p.stock <= 5 && p.stock > 0 :
      stockFilter === 'out' ? p.stock === 0 : true;
    return matchSearch && matchCat && matchStock;
  });

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-semibold mb-0">Products</h4>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Product</button>
      </div>

      {lowStockCount > 0 && (
        <div className="alert alert-warning py-2 small" role="alert">
          ⚠️ <strong>{lowStockCount} product(s)</strong> are low on stock or out of stock.
        </div>
      )}

      {msg.text && <div className={`alert alert-${msg.type} py-2 small`} role="alert">{msg.text}</div>}

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <input className="form-control" style={{ maxWidth: 220 }} placeholder="Search products..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select" style={{ maxWidth: 180 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id}>{c.name}</option>)}
        </select>
        <select className="form-select" style={{ maxWidth: 160 }} value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
          <option value="all">All Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr><th>S NO</th><th>Name</th><th>Category</th><th>Supplier</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-muted py-3">No products found</td></tr>
              ) : filtered.map((p, i) => {
                const s = stockStatus(p.stock);
                return (
                  <tr key={p.id} className={p.stock === 0 ? 'table-danger' : p.stock <= 5 ? 'table-warning' : ''}>
                    <td>{i + 1}</td>
                    <td>{p.name}</td>
                    <td>{p.category_name}</td>
                    <td>{p.supplier_name}</td>
                    <td>{parseFloat(p.price).toFixed(2)}</td>
                    <td>{p.stock}</td>
                    <td><span className={`badge bg-${s.color}`}>{s.label}</span></td>
                    <td>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-warning" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-4">
              <h5 className="fw-semibold mb-3">{editId ? 'Edit Product' : 'Add Product'}</h5>
              <form onSubmit={handleSubmit}>
                <div className="mb-2">
                  <input className="form-control" placeholder="Product name" required
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="mb-2">
                  <select className="form-select" required value={form.category_id}
                    onChange={e => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="mb-2">
                  <select className="form-select" required value={form.supplier_id}
                    onChange={e => setForm({ ...form, supplier_id: e.target.value })}>
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="mb-2">
                  <input className="form-control" type="number" placeholder="Price" required min="0" step="0.01"
                    value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="mb-3">
                  <input className="form-control" type="number" placeholder="Stock" required min="0"
                    value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary flex-grow-1" type="submit">{editId ? 'Update' : 'Create'}</button>
                  <button className="btn btn-secondary flex-grow-1" type="button" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
