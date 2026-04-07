import { useEffect, useState } from 'react';
import { FiDownload, FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import SkeletonTable from '../../components/SkeletonTable';
import { normalizeImageUrl, toStoredImagePath } from '../../utils/imageUrl';

const empty = { name: '', category_id: '', supplier_id: '', price: '', stock: '', image: '' };
const PER_PAGE = 10;

const UI = {
  bg: '#f3f6fb',
  card: '#ffffff',
  border: '#dbe3ef',
  text: '#172033',
  muted: '#60708a',
  primary: '#315efb',
  primarySoft: '#eef3ff',
  success: '#1f8f5f',
  successSoft: '#eaf8f1',
  warning: '#b7791f',
  warningSoft: '#fff7df',
  danger: '#d64545',
  dangerSoft: '#fff0f0',
  shadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
};

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

const statusStyle = (stock) => {
  if (stock === 0) {
    return {
      label: 'Out of Stock',
      textColor: UI.danger,
      bgColor: UI.dangerSoft,
      rowColor: '#fff8f8',
    };
  }

  if (stock <= 5) {
    return {
      label: 'Low Stock',
      textColor: UI.warning,
      bgColor: UI.warningSoft,
      rowColor: '#fffdf4',
    };
  }

  return {
    label: 'In Stock',
    textColor: UI.success,
    bgColor: UI.successSoft,
    rowColor: '#ffffff',
  };
};

const actionButtonStyle = {
  width: 34,
  height: 34,
  borderRadius: 10,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid transparent',
  background: 'transparent',
  transition: 'all 0.2s ease',
};

export default function AdminProducts() {
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
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

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      image: toStoredImagePath(product.image) || '',
    });
    setEditId(product.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm(empty);
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(f => ({ ...f, image: toStoredImagePath(data.path || data.url) }));
      toast.success('Image uploaded.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image upload failed.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, image: toStoredImagePath(form.image) || '' };
      if (editId) {
        await API.put(`/products/${editId}`, payload);
        toast.success('Product updated.');
      } else {
        await API.post('/products', payload);
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

  const lowStockCount = products.filter((product) => product.stock <= 5).length;

  const filtered = products.filter((product) => {
    const matchSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      (product.supplier_name || '').toLowerCase().includes(search.toLowerCase());
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
  const isMobile = viewportWidth <= 768;

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
          statusStyle(product.stock).label,
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
    <div className="page">
      <div className="page__header">
        <div>
          <h3 className="page__title" style={isMobile ? { fontSize: 15, marginBottom: 2 } : undefined}>Products</h3>
          <p className="page__subtitle" style={isMobile ? { fontSize: 11, lineHeight: 1.4, maxWidth: 280 } : undefined}>
            Manage inventory, monitor stock health, and update product details.
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap" style={isMobile ? { gap: 8 } : undefined}>
          <button
            className="btn-secondary-custom"
            onClick={handleExport}
            disabled={exporting || loading || filtered.length === 0}
            style={isMobile ? { minHeight: 36, padding: '8px 12px', fontSize: 11.5 } : undefined}
          >
            <FiDownload size={16} />{exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            className="btn-primary-custom"
            onClick={openAdd}
            style={isMobile ? { minHeight: 36, padding: '8px 12px', fontSize: 11.5 } : undefined}
          >
            <FiPlus size={16} />Add Product
          </button>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="low-stock-alert" style={isMobile ? { fontSize: 11.5, padding: '8px 10px', borderRadius: 12, marginBottom: 10 } : undefined}>
          {isMobile ? (
            <div style={{ lineHeight: 1.35 }}>
              <div><strong>{lowStockCount} product(s)</strong> need attention.</div>
              <div>Stock is low or unavailable.</div>
            </div>
          ) : (
            <>
              <strong>{lowStockCount} product(s)</strong>&nbsp;need attention because stock is low or unavailable.
            </>
          )}
        </div>
      )}

      <div className="filter-bar" style={isMobile ? { padding: 10, borderRadius: 16, marginBottom: 10 } : undefined}>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <div className="search-input-wrap">
            <FiSearch size={15} className="search-input-icon" />
            <input className="search-input" placeholder="Search products or suppliers..."
              style={isMobile ? { height: 40, fontSize: 12.5 } : undefined}
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="filter-select" style={{ maxWidth: isMobile ? 128 : 220, height: isMobile ? 40 : 44, fontSize: isMobile ? 12.5 : 14 }} value={catFilter}
            onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id}>{c.name}</option>)}
          </select>
          <select className="filter-select" style={{ maxWidth: isMobile ? 104 : 180, height: isMobile ? 40 : 44, fontSize: isMobile ? 12.5 : 14 }} value={stockFilter}
            onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}>
            <option value="all">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="table-card">
        {isMobile ? (
          loading ? (
            <div className="p-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="placeholder-glow"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: 10,
                    marginBottom: 10,
                    background: '#fff',
                  }}
                >
                  <span className="placeholder rounded d-block mb-2" style={{ width: '100%', height: 18 }} />
                  <span className="placeholder rounded d-block mb-2" style={{ width: '72%', height: 12 }} />
                  <span className="placeholder rounded d-block mb-2" style={{ width: '100%', height: 56 }} />
                  <span className="placeholder rounded d-block" style={{ width: '100%', height: 34 }} />
                </div>
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="table-empty">No products found for the selected filters.</div>
          ) : (
            <div className="p-2">
              {paginated.map((product, index) => {
                const status = statusStyle(product.stock);

                return (
                  <div
                    key={product.id}
                    style={{
                      background: status.rowColor,
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      padding: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div className="d-flex align-items-start gap-2 mb-2">
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 10,
                          overflow: 'hidden',
                          background: UI.primarySoft,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {product.image ? (
                          <img
                            src={normalizeImageUrl(product.image)}
                            alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="product-thumb-placeholder">ðŸ“¦</div>
                        )}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 11, color: UI.muted, fontWeight: 600 }}>
                              S NO {(page - 1) * PER_PAGE + index + 1}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: UI.text, lineHeight: 1.25 }}>
                              {product.name}
                            </div>
                          </div>

                          <span
                            className={`badge-status badge-status--${product.stock === 0 ? 'out' : product.stock <= 5 ? 'low-stock' : 'in-stock'}`}
                            style={{ fontSize: 10, padding: '4px 8px', flexShrink: 0 }}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div style={{ fontSize: 12, color: UI.muted, marginTop: 2 }}>
                          {product.category_name}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      {[
                        ['Supplier', product.supplier_name],
                        ['Price', formatPrice(product.price)],
                        ['Stock', product.stock],
                        ['Category', product.category_name],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e5ebf3',
                            borderRadius: 10,
                            padding: '8px 9px',
                            minWidth: 0,
                          }}
                        >
                          <div style={{ fontSize: 10, color: UI.muted, fontWeight: 600, marginBottom: 2 }}>
                            {label}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: UI.text,
                              fontWeight: 600,
                              lineHeight: 1.3,
                              wordBreak: 'break-word',
                            }}
                          >
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="action-btn action-btn--edit"
                        title="Edit"
                        style={{ flex: 1, width: 'auto', borderRadius: 12 }}
                      >
                        <FiEdit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(product.id)}
                        className="action-btn action-btn--delete"
                        title="Delete"
                        style={{ flex: 1, width: 'auto', borderRadius: 12 }}
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                {['S NO', 'Image', 'Name', 'Category', 'Supplier', 'Price', 'Stock', 'Status', 'Actions'].map(label => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>

            {loading ? (
              <SkeletonTable cols={8} rows={5} />
            ) : (
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="table-empty">No products found for the selected filters.</td>
                  </tr>
                ) : (
                  paginated.map((product, index) => {
                    const status = statusStyle(product.stock);

                    return (
                      <tr key={product.id} style={{ background: status.rowColor, borderBottom: `1px solid var(--border)` }}>
                        <td className="td-bold">{(page - 1) * PER_PAGE + index + 1}</td>
                        <td style={{ padding: '12px 18px' }}>
                          {product.image
                            ? <img src={normalizeImageUrl(product.image)} alt={product.name} className="product-thumb" />
                            : <div className="product-thumb-placeholder">📦</div>}
                        </td>
                        <td className="td-bold">{product.name}</td>
                        <td>{product.category_name}</td>
                        <td>{product.supplier_name}</td>
                        <td className="td-bold">{formatPrice(product.price)}</td>
                        <td className="td-bold">{product.stock}</td>
                        <td>
                          <span className={`badge-status badge-status--${product.stock === 0 ? 'out' : product.stock <= 5 ? 'low-stock' : 'in-stock'}`}>
                            {status.label}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button type="button" onClick={() => openEdit(product)} className="action-btn action-btn--edit" title="Edit"><FiEdit2 size={15} /></button>
                            <button type="button" onClick={() => setDeleteId(product.id)} className="action-btn action-btn--delete" title="Delete"><FiTrash2 size={15} /></button>
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
        )}

        <div className="table-card__footer">
          <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onChange={setPage} />
        </div>
      </div>

      {showModal && (
        <div className="modal d-block modal-overlay">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-card">
              <div className="modal-card__body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="modal-card__title">{editId ? 'Edit Product' : 'Add Product'}</h5>
                    <p className="modal-card__subtitle">{editId ? 'Update product details and stock.' : 'Create a new product for inventory.'}</p>
                  </div>
                  <button className="btn-close" onClick={closeModal} />
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3"><input className="form-control modal-input" placeholder="Product name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="mb-3">
                    <select className="form-select modal-select" required value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <select className="form-select modal-select" required value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })}>
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <div className="input-group">
                      <span className="input-group-text" style={{ borderRadius: '12px 0 0 12px' }}>Rs.</span>
                      <input className="form-control modal-input" type="number" placeholder="Price" required min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                    </div>
                  </div>
                  <div className="mb-4"><input className="form-control modal-input" type="number" placeholder="Stock quantity" required min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
                  <div className="mb-4">
                    <label className="modal-label">Product Image (optional)</label>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="form-control modal-input" onChange={e => handleImageUpload(e.target.files[0])} />
                    {imageUploading && <div className="image-uploading-text">⏳ Uploading image...</div>}
                    {form.image && !imageUploading && (
                      <div className="image-preview">
                        <img src={normalizeImageUrl(form.image)} alt="preview" />
                        <button type="button" className="image-remove-btn" onClick={() => setForm(f => ({ ...f, image: '' }))}>Remove image</button>
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary-custom flex-grow-1" type="submit" disabled={submitting}>
                      {submitting ? <><span className="spinner-border spinner-border-sm me-2" />{editId ? 'Updating...' : 'Creating...'}</> : editId ? 'Update Product' : 'Create Product'}
                    </button>
                    <button className="btn btn-cancel-custom flex-grow-1" type="button" onClick={closeModal}>Cancel</button>
                  </div>
                </form>
              </div>
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
