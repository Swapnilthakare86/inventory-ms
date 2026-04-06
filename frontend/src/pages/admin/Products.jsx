import { useEffect, useState } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import SkeletonTable from '../../components/SkeletonTable';

const empty = { name: '', category_id: '', supplier_id: '', price: '', stock: '' };
const PER_PAGE = 10;

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, c, s] = await Promise.all([API.get('/products'), API.get('/categories'), API.get('/suppliers')]);
      setProducts(p.data); setCategories(c.data); setSuppliers(s.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setForm(empty); setEditId(null); setShowModal(true); };
  const openEdit = (p) => {
    setForm({ name: p.name, category_id: p.category_id, supplier_id: p.supplier_id, price: p.price, stock: p.stock });
    setEditId(p.id); setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditId(null); setForm(empty); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) { await API.put(`/products/${editId}`, form); toast.success('Product updated.'); }
      else { await API.post('/products', form); toast.success('Product created.'); }
      closeModal(); fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/products/${deleteId}`);
      toast.success('Product deleted.');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setDeleteId(null); }
  };

  const stockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'danger' };
    if (stock <= 5) return { label: 'Low Stock', color: 'warning' };
    return { label: 'In Stock', color: 'success' };
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕';

  const lowStockCount = products.filter(p => p.stock <= 5).length;

  let filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || p.category_name === catFilter;
    const matchStock = stockFilter === 'all' ? true : stockFilter === 'low' ? p.stock <= 5 && p.stock > 0 : p.stock === 0;
    return matchSearch && matchCat && matchStock;
  });

  if (sortField) {
    filtered = [...filtered].sort((a, b) => {
      const av = sortField === 'price' ? parseFloat(a.price) : sortField === 'stock' ? a.stock : a[sortField];
      const bv = sortField === 'price' ? parseFloat(b.price) : sortField === 'stock' ? b.stock : b[sortField];
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <input className="form-control" style={{ maxWidth: 220 }} placeholder="Search products..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select className="form-select" style={{ maxWidth: 180 }} value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id}>{c.name}</option>)}
        </select>
        <select className="form-select" style={{ maxWidth: 160 }} value={stockFilter} onChange={e => { setStockFilter(e.target.value); setPage(1); }}>
          <option value="all">All Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>S NO</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>Name<SortIcon field="name" /></th>
                <th>Category</th><th>Supplier</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('price')}>Price<SortIcon field="price" /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('stock')}>Stock<SortIcon field="stock" /></th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            {loading ? <SkeletonTable cols={8} rows={5} /> : (
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-muted py-4">No products found</td></tr>
                ) : paginated.map((p, i) => {
                  const s = stockStatus(p.stock);
                  return (
                    <tr key={p.id} className={p.stock === 0 ? 'table-danger' : p.stock <= 5 ? 'table-warning' : ''}>
                      <td>{(page - 1) * PER_PAGE + i + 1}</td>
                      <td>{p.name}</td>
                      <td>{p.category_name}</td>
                      <td>{p.supplier_name}</td>
                      <td>₹{parseFloat(p.price).toFixed(2)}</td>
                      <td>{p.stock}</td>
                      <td><span className={`badge bg-${s.color}`}>{s.label}</span></td>
                      <td>
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-warning" onClick={() => openEdit(p)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(p.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>
        <div className="px-3 pb-2">
          <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onChange={setPage} />
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={closeModal}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-semibold mb-0">{editId ? 'Edit Product' : 'Add Product'}</h5>
                <button className="btn-close" onClick={closeModal} />
              </div>
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
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input className="form-control" type="number" placeholder="Price" required min="0" step="0.01"
                      value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                  </div>
                </div>
                <div className="mb-3">
                  <input className="form-control" type="number" placeholder="Stock" required min="0"
                    value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary flex-grow-1" type="submit" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-2" />{editId ? 'Updating...' : 'Creating...'}</> : editId ? 'Update' : 'Create'}
                  </button>
                  <button className="btn btn-secondary flex-grow-1" type="button" onClick={closeModal}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={!!deleteId}
        title="Delete Product"
        message="This will permanently delete the product. Are you sure?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
