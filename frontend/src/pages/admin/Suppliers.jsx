import { useEffect, useState } from 'react';
import API from '../../api/axios';

const empty = { name: '', email: '', phone: '', address: '' };

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Supplier name is required';
  else if (form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';

  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address';

  if (!form.phone.trim()) errors.phone = 'Phone is required';
  else if (!/^\d{10}$/.test(form.phone.trim())) errors.phone = 'Phone must be exactly 10 digits';

  if (!form.address.trim()) errors.address = 'Address is required';
  else if (form.address.trim().length < 5) errors.address = 'Address must be at least 5 characters';

  return errors;
};

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: 'info' });
  const [search, setSearch] = useState('');

  const fetchSuppliers = () => API.get('/suppliers').then(r => setSuppliers(r.data));
  useEffect(() => { fetchSuppliers(); }, []);

  const notify = (text, type = 'info') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: 'info' }), 3000); };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const openAdd = () => { setForm(empty); setErrors({}); setEditId(null); setShowModal(true); };
  const openEdit = (s) => {
    setForm({ name: s.name, email: s.email || '', phone: s.phone || '', address: s.address || '' });
    setErrors({});
    setEditId(s.id);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setErrors({}); setForm(empty); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    try {
      if (editId) {
        await API.put(`/suppliers/${editId}`, form);
        notify('Supplier updated successfully.', 'success');
      } else {
        await API.post('/suppliers', form);
        notify('Supplier created successfully.', 'success');
      }
      closeModal();
      fetchSuppliers();
    } catch (err) {
      notify(err.response?.data?.message || 'Something went wrong.', 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    try {
      await API.delete(`/suppliers/${id}`);
      notify('Supplier deleted.', 'success');
      fetchSuppliers();
    } catch (err) {
      notify(err.response?.data?.message || 'Error deleting supplier.', 'danger');
    }
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || '').includes(search)
  );

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-semibold mb-0">Suppliers</h4>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Supplier</button>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type} py-2 small`} role="alert">{msg.text}</div>
      )}

      {/* Search */}
      <div className="mb-3">
        <input className="form-control" style={{ maxWidth: 300 }} placeholder="Search by name, email or phone..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>S NO</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted py-3">No suppliers found</td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td className="fw-medium">{s.name}</td>
                  <td>{s.email || '—'}</td>
                  <td>{s.phone || '—'}</td>
                  <td>{s.address || '—'}</td>
                  <td>{new Date(s.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-warning" onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-4">
              <h5 className="fw-semibold mb-3">{editId ? 'Edit Supplier' : 'Add Supplier'}</h5>
              <form onSubmit={handleSubmit} noValidate>

                <div className="mb-2">
                  <label htmlFor="sup-name" className="form-label small fw-medium">Name</label>
                  <input id="sup-name" type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={form.name} onChange={handleChange('name')} placeholder=" Enter supplier name" />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                <div className="mb-2">
                  <label htmlFor="sup-email" className="form-label small fw-medium">Email</label>
                  <input id="sup-email" type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    value={form.email} onChange={handleChange('email')} placeholder=" Enter supplier email" />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                <div className="mb-2">
                  <label htmlFor="sup-phone" className="form-label small fw-medium">Phone</label>
                  <input id="sup-phone" type="tel"
                    className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                    value={form.phone} onChange={handleChange('phone')} placeholder="10-digit number" maxLength={10} />
                  {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                </div>

                <div className="mb-3">
                  <label htmlFor="sup-address" className="form-label small fw-medium">Address</label>
                  <textarea id="sup-address" rows={2}
                    className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                    value={form.address} onChange={handleChange('address')} placeholder="Full address" />
                  {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-primary flex-grow-1" type="submit">{editId ? 'Update' : 'Create'}</button>
                  <button className="btn btn-secondary flex-grow-1" type="button" onClick={closeModal}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
