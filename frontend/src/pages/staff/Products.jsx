export { default } from '../admin/Products';

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
      toast.error(err.response?.data?.message || 'Error deleting product.');
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = products.filter((product) => {
    const matchSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      (product.category_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (product.supplier_name || '').toLowerCase().includes(search.toLowerCase());

    const matchStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'low'
          ? product.stock <= 5 && product.stock > 0
          : product.stock === 0;

    return matchSearch && matchStock;
  });

  const lowStockCount = products.filter((product) => product.stock <= 5).length;
  const isMobile = viewportWidth <= 768;

  return (
    <div className="page" style={{ background: UI.bg, minHeight: '100%', padding: isMobile ? '12px 10px 16px' : '24px' }}>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4" style={isMobile ? { gap: 10, marginBottom: 10 } : undefined}>
        <div>
          <h3 className="fw-semibold mb-1" style={{ color: UI.text, fontSize: isMobile ? 15 : 18 }}>
            Products
          </h3>
          <p className="mb-0" style={{ color: UI.muted, fontSize: isMobile ? 11 : 13, lineHeight: 1.4, maxWidth: isMobile ? 280 : undefined }}>
            Monitor inventory and update product information quickly.
          </p>
        </div>

        <button
          className="btn btn-sm"
          onClick={openAdd}
          style={{
            borderRadius: 12,
            padding: isMobile ? '8px 12px' : '10px 14px',
            background: UI.primary,
            color: '#fff',
            fontWeight: 600,
            fontSize: isMobile ? 11.5 : 13,
            minHeight: isMobile ? 36 : undefined,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 12px 24px rgba(49, 94, 251, 0.22)',
          }}
        >
          <FiPlus size={16} />
          Add Product
        </button>
      </div>

      {lowStockCount > 0 && (
        <div
          className="mb-3"
          style={{
            background: UI.warningSoft,
            border: '1px solid #f4df9a',
            borderRadius: isMobile ? 12 : 14,
            padding: isMobile ? '8px 10px' : '12px 14px',
            color: '#8a6116',
            fontSize: isMobile ? 11.5 : 13,
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            width: 'fit-content',
            maxWidth: '100%',
          }}
        >
          {isMobile ? (
            <div style={{ lineHeight: 1.35 }}>
              <div><strong>{lowStockCount} product(s)</strong> need attention.</div>
              <div>Stock is low or unavailable.</div>
            </div>
          ) : (
            <><strong>{lowStockCount} product(s)</strong> are low on stock or out of stock.</>
          )}
        </div>
      )}

      <div
        className="mb-3"
        style={{
          background: UI.card,
          border: `1px solid ${UI.border}`,
          borderRadius: isMobile ? 16 : 18,
          padding: isMobile ? 10 : 14,
          boxShadow: UI.shadow,
        }}
      >
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <div className="position-relative" style={{ minWidth: isMobile ? 0 : 280, maxWidth: 520, flex: '1 1 420px', width: isMobile ? '100%' : undefined }}>
            <FiSearch
              size={15}
              style={{
                position: 'absolute',
                top: '50%',
                left: 14,
                transform: 'translateY(-50%)',
                color: UI.muted,
              }}
            />
            <input
              className="form-control border-0"
              style={{
                height: isMobile ? 40 : 44,
                borderRadius: 12,
                background: '#f8fafc',
                paddingLeft: 40,
                boxShadow: 'inset 0 0 0 1px #e5ebf3',
                fontSize: isMobile ? 12.5 : 14,
              }}
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select border-0"
            style={{
              maxWidth: isMobile ? 132 : 180,
              height: isMobile ? 40 : 44,
              borderRadius: 12,
              backgroundColor: '#f8fafc',
              boxShadow: 'inset 0 0 0 1px #e5ebf3',
              fontSize: isMobile ? 12.5 : 14,
            }}
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="all">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      <div
        style={{
          background: UI.card,
          border: `1px solid ${UI.border}`,
          borderRadius: 20,
          boxShadow: UI.shadow,
          overflow: 'hidden',
        }}
      >
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
          ) : filtered.length === 0 ? (
            <div className="table-empty">No products found for the selected filters.</div>
          ) : (
            <div className="p-2">
              {filtered.map((product, index) => {
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
                          background: '#eef3ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: UI.primary,
                        }}
                      >
                        <FiBox size={18} />
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 11, color: UI.muted, fontWeight: 600 }}>
                              S NO {index + 1}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: UI.text, lineHeight: 1.25 }}>
                              {product.name}
                            </div>
                          </div>

                          <span
                            className="badge-status"
                            style={{ fontSize: 10, padding: '4px 8px', flexShrink: 0, color: status.textColor, background: status.bgColor }}
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
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  {['S NO', 'Name', 'Category', 'Supplier', 'Price', 'Stock', 'Status', 'Actions'].map((label) => (
                    <th
                      key={label}
                      style={{
                        color: UI.muted,
                        fontSize: 11,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        padding: '16px 18px',
                        borderBottom: `1px solid ${UI.border}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5" style={{ color: UI.muted }}>
                      Loading products...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5" style={{ color: UI.muted }}>
                      No products found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((product, index) => {
                    const status = statusStyle(product.stock);
                    return (
                      <tr
                        key={product.id}
                        style={{
                          background: status.rowColor,
                          borderBottom: `1px solid ${UI.border}`,
                        }}
                      >
                        <td style={{ padding: '16px 18px', color: UI.text, fontWeight: 500, fontSize: 13 }}>
                          {index + 1}
                        </td>
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ color: UI.text, fontWeight: 600, fontSize: 13 }}>{product.name}</div>
                        </td>
                        <td style={{ padding: '16px 18px', color: UI.text, fontSize: 13 }}>{product.category_name}</td>
                        <td style={{ padding: '16px 18px', color: UI.text, fontSize: 13 }}>{product.supplier_name}</td>
                        <td style={{ padding: '16px 18px', color: UI.text, fontWeight: 600, fontSize: 13 }}>
                          {formatPrice(product.price)}
                        </td>
                        <td style={{ padding: '16px 18px', color: UI.text, fontWeight: 600, fontSize: 13 }}>{product.stock}</td>
                        <td style={{ padding: '16px 18px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '5px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 700,
                              color: status.textColor,
                              background: status.bgColor,
                            }}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td style={{ padding: '16px 18px' }}>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(product)}
                              title="Edit product"
                              aria-label={`Edit ${product.name}`}
                              style={{
                                ...actionButtonStyle,
                                color: '#9a6700',
                                background: '#fff4d6',
                                borderColor: '#f2dfaa',
                              }}
                            >
                              <FiEdit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId(product.id)}
                              title="Delete product"
                              aria-label={`Delete ${product.name}`}
                              style={{
                                ...actionButtonStyle,
                                color: UI.danger,
                                background: '#fff5f5',
                                borderColor: '#f4caca',
                              }}
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(15, 23, 42, 0.38)' }} onClick={closeModal}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div
              className="modal-content border-0"
              style={{
                borderRadius: 22,
                overflow: 'hidden',
                boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
              }}
            >
              <div className="p-4" style={{ background: UI.card }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-semibold mb-1" style={{ color: UI.text }}>
                      {editId ? 'Edit Product' : 'Add Product'}
                    </h5>
                    <p className="mb-0" style={{ color: UI.muted, fontSize: 14 }}>
                      {editId ? 'Update product details and stock.' : 'Create a new product for inventory.'}
                    </p>
                  </div>
                  <button className="btn-close" onClick={closeModal} />
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <input
                      className="form-control"
                      style={{ height: 46, borderRadius: 12 }}
                      placeholder="Product name"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <select
                      className="form-select"
                      style={{ height: 46, borderRadius: 12 }}
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

                  <div className="mb-3">
                    <select
                      className="form-select"
                      style={{ height: 46, borderRadius: 12 }}
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

                  <div className="mb-3">
                    <div className="input-group">
                      <span className="input-group-text" style={{ borderRadius: '12px 0 0 12px' }}>
                        Rs.
                      </span>
                      <input
                        className="form-control"
                        type="number"
                        style={{ height: 46, borderRadius: '0 12px 12px 0' }}
                        placeholder="Price"
                        required
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <input
                      className="form-control"
                      type="number"
                      style={{ height: 46, borderRadius: 12 }}
                      placeholder="Stock quantity"
                      required
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      className="btn flex-grow-1"
                      type="submit"
                      disabled={submitting}
                      style={{
                        borderRadius: 12,
                        background: UI.primary,
                        color: '#fff',
                        fontWeight: 600,
                        padding: '11px 14px',
                      }}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          {editId ? 'Updating...' : 'Creating...'}
                        </>
                      ) : editId ? (
                        'Update Product'
                      ) : (
                        'Create Product'
                      )}
                    </button>

                    <button
                      className="btn flex-grow-1"
                      type="button"
                      onClick={closeModal}
                      style={{
                        borderRadius: 12,
                        background: '#eff3f8',
                        color: UI.text,
                        fontWeight: 600,
                        padding: '11px 14px',
                      }}
                    >
                      Cancel
                    </button>
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
