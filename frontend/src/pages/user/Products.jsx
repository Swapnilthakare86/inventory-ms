import { useEffect, useState } from 'react';
import { FiBox, FiPackage, FiSearch, FiShoppingCart, FiTag } from 'react-icons/fi';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';
import { normalizeImageUrl } from '../../utils/imageUrl';

const PER_PAGE = 10;

const formatCurrency = (v) => `Rs. ${parseFloat(v || 0).toFixed(2)}`;

const statusLabel = (stock) => {
  if (stock === 0) return { label: 'Out of Stock', color: 'var(--danger)',  bg: 'var(--danger-soft)'  };
  if (stock <= 5)  return { label: 'Low Stock',    color: 'var(--warning)', bg: 'var(--warning-soft)' };
  return               { label: 'In Stock',      color: 'var(--success)', bg: 'var(--success-soft)' };
};

export default function UserProducts() {
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch]       = useState('');
  const [orderModal, setOrderModal] = useState(null);
  const [quantity, setQuantity]   = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pr, cr] = await Promise.all([API.get('/products'), API.get('/categories')]);
      setProducts(pr.data); setCategories(cr.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = products.filter(p => {
    const t = search.toLowerCase();
    return (!t || p.name.toLowerCase().includes(t) || (p.category_name||'').toLowerCase().includes(t))
      && (!catFilter || p.category_name === catFilter);
  });

  const paginated      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const lowStockCount  = products.filter(p => p.stock <= 5).length;
  const inStockCount   = products.filter(p => p.stock > 5).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const openOrder  = (p) => { setOrderModal(p); setQuantity(1); setConfirmed(false); };
  const closeModal = () => { setOrderModal(null); setQuantity(1); setConfirmed(false); };

  const placeOrder = async () => {
    if (!orderModal) return;
    setSubmitting(true);
    try {
      await API.post('/orders', { product_id: orderModal.id, quantity });
      toast.success('Order placed successfully.');
      closeModal(); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error placing order'); closeModal(); }
    finally { setSubmitting(false); }
  };

  const handleQty = (v) => {
    const n = Number(v);
    if (Number.isNaN(n)) { setQuantity(1); return; }
    setQuantity(Math.min(orderModal.stock, Math.max(1, n)));
  };

  const canReview = orderModal && quantity >= 1 && quantity <= orderModal.stock;

  return (
    <div className="page px-4 pb-4 pt-2">
      <div className="page__header">
        <div>
          <h3 className="page__title">Products</h3>
          <p className="page__subtitle">Browse available items, filter by category, and place orders.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="row g-3 mb-3">
        {[
          { label: 'Available Products', value: products.length,  icon: FiBox,          accent: 'var(--primary)', bg: 'var(--primary-soft)' },
          { label: 'In Stock',           value: inStockCount,     icon: FiPackage,       accent: 'var(--success)', bg: 'var(--success-soft)' },
          { label: 'Low Stock',          value: lowStockCount,    icon: FiTag,           accent: 'var(--warning)', bg: 'var(--warning-soft)' },
          { label: 'Out of Stock',       value: outOfStockCount,  icon: FiShoppingCart,  accent: 'var(--danger)',  bg: 'var(--danger-soft)'  },
        ].map(({ label, value, icon: Icon, accent, bg }) => (
          <div className="col-12 col-sm-6 col-xl-3" key={label}>
            <div className="summary-card">
              <div className="d-flex align-items-center gap-3">
                <div className="summary-card__icon" style={{ background: bg, color: accent }}><Icon size={15} /></div>
                <div>
                  <div className="summary-card__label">{label}</div>
                  <div className="summary-card__value">{value}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <div className="search-input-wrap">
            <FiSearch size={15} className="search-input-icon" />
            <input className="search-input" placeholder="Search products or categories..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="filter-select" style={{ maxWidth: 220 }} value={catFilter}
            onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Product cards */}
      <div className="row g-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div className="col-12 col-sm-6 col-xl-3" key={i}>
              <div className="product-card-user" style={{ minHeight: 170 }} />
            </div>
          ))
        ) : paginated.length === 0 ? (
          <div className="col-12">
            <div className="table-empty table-card py-5">No products found for the selected filters.</div>
          </div>
        ) : paginated.map(product => {
          const s = statusLabel(product.stock);
          return (
            <div className="col-12 col-sm-6 col-md-4 col-xl-2" key={product.id}>
              <div className="product-card-user">
                <div className="product-card-user__img-wrap">
                  {product.image
                    ? <img src={normalizeImageUrl(product.image)} alt={product.name} />
                    : <span style={{ fontSize: 22 }}>📦</span>}
                </div>
                <div>
                  <div className="product-card-user__name">{product.name}</div>
                  <div className="product-card-user__category">{product.category_name}</div>
                </div>
                <div className="product-card-user__price">{formatCurrency(product.price)}</div>
                <div className="product-card-user__stock"><span style={{ color: 'var(--muted)', fontWeight: 500 }}>Stock:</span> {product.stock}</div>
                <div>
                  <span className="badge-status" style={{ color: s.color, background: s.bg, padding: '3px 8px', fontSize: 10 }}>{s.label}</span>
                </div>
                <button type="button" className="product-card-user__order-btn" disabled={product.stock === 0} onClick={() => openOrder(product)}>
                  {product.stock === 0 ? 'Unavailable' : 'Order Now'}
                </button>
              </div>
            </div>
          );
        })}

        {!loading && filtered.length > PER_PAGE && (
          <div className="col-12">
            <div className="table-card__footer table-card">
              <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onChange={setPage} />
            </div>
          </div>
        )}
      </div>

      {/* Order Modal */}
      {orderModal && (
        <div className="modal d-block modal-overlay" onClick={closeModal}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-card">
              <div className="modal-card__body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="modal-card__title">{confirmed ? 'Review Order' : `Order ${orderModal.name}`}</h5>
                    <p className="modal-card__subtitle">
                      {confirmed ? 'Confirm the quantity and total before placing.' : 'Choose the quantity from available stock.'}
                    </p>
                  </div>
                  <button className="btn-close" onClick={closeModal} />
                </div>

                {!confirmed ? (
                  <>
                    <div className="mb-3">
                      <label className="modal-label">Quantity</label>
                      <input type="number" className="form-control modal-input" min={1} max={orderModal.stock} value={quantity} onChange={e => handleQty(e.target.value)} />
                      <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>Available stock: {orderModal.stock}</div>
                    </div>
                    <div className="order-total-box mb-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>Total amount</span>
                        <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 18 }}>{formatCurrency(quantity * orderModal.price)}</span>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-primary-custom flex-grow-1" onClick={() => setConfirmed(true)} disabled={!canReview}>Review Order</button>
                      <button type="button" className="btn btn-cancel-custom flex-grow-1" onClick={closeModal}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-4" style={{ borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
                      {[['Product',orderModal.name],['Category',orderModal.category_name],['Quantity',quantity],['Price each',formatCurrency(orderModal.price)],['Total',formatCurrency(quantity * orderModal.price)]].map(([label, value], i, arr) => (
                        <div key={label} className="order-review-row" style={{ borderBottom: i === arr.length - 1 ? 'none' : undefined }}>
                          <span style={{ color: 'var(--muted)' }}>{label}</span>
                          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn flex-grow-1" onClick={placeOrder} disabled={submitting}
                        style={{ borderRadius: 'var(--radius)', background: 'var(--success)', color: '#fff', fontWeight: 600, padding: '11px 14px' }}>
                        {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Placing...</> : 'Confirm Order'}
                      </button>
                      <button type="button" className="btn btn-cancel-custom flex-grow-1" onClick={() => setConfirmed(false)}>Back</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
