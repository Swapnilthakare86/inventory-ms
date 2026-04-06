import { useEffect, useState } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import SkeletonTable from '../../components/SkeletonTable';

const empty = { name: '', category_id: '', supplier_id: '', price: '', stock: '' };
const PER_PAGE = 10;

const formatPrice = (value) => `Rs. ${parseFloat(value).toFixed(2)}`;

const escapeCsvValue = (value) => {
  const text = String(value ?? '');
  if (text.includes('"') || text.includes(',') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const sanitizeFilePart = (value) => {
  const cleaned = String(value || 'all')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return cleaned || 'all';
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [productRes, categoryRes, supplierRes] = await Promise.all([
        API.get('/products'),
        API.get('/categories'),
        API.get('/suppliers'),
      ]);
      setProducts(productRes.data);
      setCategories(categoryRes.data);
      setSuppliers(supplierRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openAdd = () => {
    setForm(empty);
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (product) => {
    setForm({
      name: product.name,
      category_id: product.category_id,
      supplier_id: product.supplier_id,
      price: product.price,
      stock: product.stock,
    });
    setEditId(product.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm(empty);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await API.put(`/products/${editId}`, form);
        toast.success('Product updated.');
      } else {
        await API.post('/products', form);
        toast.success('Product created.');
      }
      closeModal();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/products/${deleteId}`);
      toast.success('Product deleted.');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setDeleteId(null);
    }
  };

  const stockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'danger' };
    if (stock <= 5) return { label: 'Low Stock', color: 'warning' };
    return { label: 'In Stock', color: 'success' };
  };

  const lowStockCount = products.filter((product) => product.stock <= 5).length;

  let filtered = products.filter((product) => {
    const matchSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !catFilter || product.category_name === catFilter;
    const matchStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'low'
          ? product.stock <= 5 && product.stock > 0
          : product.stock === 0;

    return matchSearch && matchCategory && matchStock;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleExport = async () => {
    if (filtered.length === 0) {
      toast.error('No products available for the selected filters.');
      return;
    }

    setExporting(true);

    try {
      const rows = [
        ['Product ID', 'Name', 'Category', 'Supplier', 'Price', 'Stock', 'Status'],
        ...filtered.map((product) => [
          product.id,
          product.name,
          product.category_name,
          product.supplier_name,
          parseFloat(product.price).toFixed(2),
          product.stock,
          stockStatus(product.stock).label,
        ]),
      ];

      const csvContent = rows
        .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      const searchPart = sanitizeFilePart(search || 'search-all');
      const categoryPart = sanitizeFilePart(catFilter || 'all-categories');
      const stockPart = sanitizeFilePart(stockFilter);

      link.href = url;
      link.download = `products-${searchPart}-${categoryPart}-${stockPart}-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Products CSV downloaded.');
    } catch {
      toast.error('Failed to export products.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-semibold mb-0">Products</h4>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={handleExport}
            disabled={exporting || loading || filtered.length === 0}
          >
            {exporting ? 'Exporting...' : 'Export Products CSV'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            + Add Product
          </button>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="alert alert-warning py-2 small" role="alert">
          <strong>{lowStockCount} product(s)</strong> are low on stock or out of stock.
        </div>
      )}

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <input
          className="form-control"
          style={{ maxWidth: 220 }}
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="form-select"
          style={{ maxWidth: 180 }}
          value={catFilter}
          onChange={(e) => {
            setCatFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id}>{category.name}</option>
          ))}
        </select>
        <select
          className="form-select"
          style={{ maxWidth: 160 }}
          value={stockFilter}
          onChange={(e) => {
            setStockFilter(e.target.value);
            setPage(1);
          }}
        >
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
                <th>Name</th>
                <th>Category</th>
                <th>Supplier</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            {loading ? (
              <SkeletonTable cols={8} rows={5} />
            ) : (
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      No products found
                    </td>
                  </tr>
                ) : (
                  paginated.map((product, index) => {
                    const status = stockStatus(product.stock);
                    return (
                      <tr
                        key={product.id}
                        className={
                          product.stock === 0 ? 'table-danger' : product.stock <= 5 ? 'table-warning' : ''
                        }
                      >
                        <td>{(page - 1) * PER_PAGE + index + 1}</td>
                        <td>{product.name}</td>
                        <td>{product.category_name}</td>
                        <td>{product.supplier_name}</td>
                        <td>{formatPrice(product.price)}</td>
                        <td>{product.stock}</td>
                        <td>
                          <span className={`badge bg-${status.color}`}>{status.label}</span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-warning" onClick={() => openEdit(product)}>
                              Edit
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(product.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            )}
          </table>
        </div>
        <div className="px-3 pb-2">
          <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onChange={setPage} />
        </div>
      </div>

      {showModal && (
        <div
          className="modal d-block"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={closeModal}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-semibold mb-0">{editId ? 'Edit Product' : 'Add Product'}</h5>
                <button className="btn-close" onClick={closeModal} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-2">
                  <input
                    className="form-control"
                    placeholder="Product name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="mb-2">
                  <select
                    className="form-select"
                    required
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <select
                    className="form-select"
                    required
                    value={form.supplier_id}
                    onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <div className="input-group">
                    <span className="input-group-text">Rs.</span>
                    <input
                      className="form-control"
                      type="number"
                      placeholder="Price"
                      required
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <input
                    className="form-control"
                    type="number"
                    placeholder="Stock"
                    required
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary flex-grow-1" type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        {editId ? 'Updating...' : 'Creating...'}
                      </>
                    ) : editId ? (
                      'Update'
                    ) : (
                      'Create'
                    )}
                  </button>
                  <button className="btn btn-secondary flex-grow-1" type="button" onClick={closeModal}>
                    Cancel
                  </button>
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
