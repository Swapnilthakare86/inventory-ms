import { useEffect, useState } from 'react';
import API from '../../api/axios';

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
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: 'info' });
  const [search, setSearch] = useState('');

  const fetchCategories = () => API.get('/categories').then(r => setCategories(r.data));
  useEffect(() => { fetchCategories(); }, []);

  const notify = (text, type = 'info') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: 'info' }), 3000); };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const handleEdit = (cat) => {
    setEditId(cat.id);
    setForm({ name: cat.name, description: cat.description || '' });
    setErrors({});
  };

  const handleCancel = () => { setEditId(null); setForm(empty); setErrors({}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    try {
      if (editId) {
        await API.put(`/categories/${editId}`, form);
        notify('Category updated successfully.', 'success');
      } else {
        await API.post('/categories', form);
        notify('Category created successfully.', 'success');
      }
      setForm(empty);
      setEditId(null);
      setErrors({});
      fetchCategories();
    } catch (err) {
      notify(err.response?.data?.message || 'Something went wrong.', 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await API.delete(`/categories/${id}`);
      notify('Category deleted.', 'success');
      fetchCategories();
    } catch (err) {
      notify(err.response?.data?.message || 'Error deleting category.', 'danger');
    }
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4">
      <h4 className="fw-semibold mb-4">Categories</h4>

      {msg.text && (
        <div className={`alert alert-${msg.type} py-2 small`} role="alert">{msg.text}</div>
      )}

      {/* Form */}
      <div className="card p-3 mb-4" style={{ maxWidth: 500 }}>
        <h6 className="fw-medium mb-3">{editId ? 'Edit Category' : 'Add Category'}</h6>
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-2">
            <label htmlFor="cat-name" className="form-label small fw-medium">Name</label>
            <input
              id="cat-name"
              type="text"
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              placeholder="Enter category name"
              value={form.name}
              onChange={handleChange('name')}
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="cat-desc" className="form-label small fw-medium">
              Description <span className="text-muted fw-normal">(optional)</span>
            </label>
            <textarea
              id="cat-desc"
              rows={2}
              className={`form-control ${errors.description ? 'is-invalid' : ''}`}
              placeholder="Enter category description"
              value={form.description}
              onChange={handleChange('description')}
            />
            <div className="d-flex justify-content-between">
              {errors.description
                ? <div className="invalid-feedback d-block">{errors.description}</div>
                : <span />}
            </div>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-primary" type="submit">{editId ? 'Update' : 'Add'}</button>
            {editId && (
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
            )}
          </div>
        </form>
      </div>

      {/* Search */}
      <div className="mb-3">
        <input className="form-control" style={{ maxWidth: 300 }} placeholder="Search categories..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr><th>S NO</th><th>Name</th><th>Description</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted py-3">No categories found</td></tr>
              ) : filtered.map((cat, i) => (
                <tr key={cat.id}>
                  <td>{i + 1}</td>
                  <td className="fw-medium">{cat.name}</td>
                  <td className="text-muted small">{cat.description || '—'}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-warning" onClick={() => handleEdit(cat)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cat.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
