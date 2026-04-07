import { useEffect, useState } from 'react';
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import API from '../../api/axios';
import ConfirmModal from '../../components/ConfirmModal';

const empty = { name: '', description: '' };

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Category name is required';
  else if (form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  else if (form.name.trim().length > 100) errors.name = 'Name must not exceed 100 characters';

  if (form.description.trim().length > 50) errors.description = 'Description must not exceed 50 characters';

  return errors;
};

export default function AdminCategories() {
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchCategories = async () => {
    const response = await API.get('/categories');
    setCategories(response.data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetForm = () => {
    setForm(empty);
    setErrors({});
    setEditId(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const handleEdit = (category) => {
    setEditId(category.id);
    setForm({ name: category.name, description: category.description || '' });
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    try {
      if (editId) {
        await API.put(`/categories/${editId}`, form);
        toast.success('Category updated successfully.');
      } else {
        await API.post('/categories', form);
        toast.success('Category created successfully.');
      }

      closeModal();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/categories/${deleteId}`);
      toast.success('Category deleted.');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting category.');
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(search.toLowerCase()) ||
      (category.description || '').toLowerCase().includes(search.toLowerCase())
  );
  const isMobile = viewportWidth <= 768;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h3 className="page__title" style={isMobile ? { fontSize: 15, marginBottom: 2 } : undefined}>Categories</h3>
          <p className="page__subtitle" style={isMobile ? { fontSize: 11, lineHeight: 1.4, maxWidth: 280 } : undefined}>
            Organize product groups and keep category details clean and consistent.
          </p>
        </div>
        <button
          className="btn-primary-custom"
          onClick={openAdd}
          style={isMobile ? { minHeight: 36, padding: '8px 12px', fontSize: 11.5 } : undefined}
        >
          <FiPlus size={16} />Add Category
        </button>
      </div>

      <div className="filter-bar" style={isMobile ? { padding: 10, borderRadius: 16, marginBottom: 10 } : undefined}>
        <div className="search-input-wrap">
          <FiSearch size={15} className="search-input-icon" />
          <input
            className="search-input"
            placeholder="Search categories..."
            style={isMobile ? { height: 40, fontSize: 12.5 } : undefined}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        {isMobile ? (
          <div className="p-2">
            {filtered.length === 0 ? (
              <div className="table-empty">No categories found.</div>
            ) : filtered.map((category, index) => (
              <div
                key={category.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 10,
                  marginBottom: 10,
                  background: '#fff',
                }}
              >
                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                      S NO {index + 1}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25 }}>
                      {category.name}
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="button" onClick={() => handleEdit(category)} className="action-btn action-btn--edit" style={{ width: 32, height: 32 }}>
                      <FiEdit2 size={14} />
                    </button>
                    <button type="button" onClick={() => setDeleteId(category.id)} className="action-btn action-btn--delete" style={{ width: 32, height: 32 }}>
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e5ebf3',
                    borderRadius: 10,
                    padding: '8px 9px',
                  }}
                >
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, marginBottom: 2 }}>
                    Description
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>
                    {category.description || 'No description'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead><tr>{['S NO','Name','Description','Actions'].map(l => <th key={l}>{l}</th>)}</tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={4} className="table-empty">No categories found.</td></tr>
                ) : filtered.map((category, index) => (
                  <tr key={category.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="td-bold">{index + 1}</td>
                    <td className="td-bold">{category.name}</td>
                    <td className="td-muted">{category.description || 'No description'}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button type="button" onClick={() => handleEdit(category)} className="action-btn action-btn--edit"><FiEdit2 size={15} /></button>
                        <button type="button" onClick={() => setDeleteId(category.id)} className="action-btn action-btn--delete"><FiTrash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal d-block modal-overlay">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-card">
              <div className="modal-card__body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="modal-card__title">{editId ? 'Edit Category' : 'Add Category'}</h5>
                    <p className="modal-card__subtitle">{editId ? 'Update the category information below.' : 'Create a category for grouping products.'}</p>
                  </div>
                  <button className="btn-close" onClick={closeModal} />
                </div>
                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label htmlFor="cat-name" className="modal-label">Name</label>
                    <input id="cat-name" type="text" className={`form-control modal-input ${errors.name ? 'is-invalid' : ''}`} placeholder="Enter category name" value={form.name} onChange={handleChange('name')} />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>
                  <div className="mb-4">
                    <label htmlFor="cat-desc" className="modal-label">Description <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                    <textarea id="cat-desc" rows={3} className={`form-control modal-textarea ${errors.description ? 'is-invalid' : ''}`} placeholder="Enter category description" value={form.description} onChange={handleChange('description')} />
                    {errors.description && <div className="invalid-feedback d-block">{errors.description}</div>}
                  </div>
                  <div className="d-flex gap-2 modal-actions">
                    <button className="btn btn-primary-custom flex-grow-1" type="submit" disabled={submitting}>
                      {submitting ? (editId ? 'Updating...' : 'Adding...') : editId ? 'Update Category' : 'Add Category'}
                    </button>
                    <button className="btn btn-cancel-custom flex-grow-1" type="button" onClick={closeModal}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal show={!!deleteId} title="Delete Category" message="This will permanently delete the category. Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
