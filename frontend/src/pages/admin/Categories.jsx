import { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '' });
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');

  const fetchCategories = () => API.get('/categories').then(r => setCategories(r.data));
  useEffect(() => { fetchCategories(); }, []);

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await API.put(`/categories/${editId}`, form);
        notify('Category updated.');
      } else {
        await API.post('/categories', form);
        notify('Category created.');
      }
      setForm({ name: '' });
      setEditId(null);
      fetchCategories();
    } catch (err) {
      notify(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (cat) => { setEditId(cat.id); setForm({ name: cat.name }); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await API.delete(`/categories/${id}`);
      notify('Category deleted.');
      fetchCategories();
    } catch (err) {
      notify(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="p-4">
      <h4 className="fw-semibold mb-4">Categories</h4>
      {msg && <div className="alert alert-info py-2 small">{msg}</div>}

      <div className="card p-3 mb-4" style={{ maxWidth: 400 }}>
        <h6 className="fw-medium mb-3">{editId ? 'Edit Category' : 'Add Category'}</h6>
        <form onSubmit={handleSubmit} className="d-flex gap-2">
          <input className="form-control" placeholder="Category name" required
            value={form.name} onChange={e => setForm({ name: e.target.value })} />
          <button className="btn btn-primary" type="submit">{editId ? 'Update' : 'Add'}</button>
          {editId && (
            <button type="button" className="btn btn-secondary"
              onClick={() => { setEditId(null); setForm({ name: '' }); }}>Cancel</button>
          )}
        </form>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr><th>S NO</th><th>Name</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => (
                <tr key={cat.id}>
                  <td>{i + 1}</td>
                  <td>{cat.name}</td>
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
