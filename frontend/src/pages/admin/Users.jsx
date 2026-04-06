import { useEffect, useState } from 'react';
import API from '../../api/axios';

const empty = { name: '', email: '', password: '', address: '', role: 'user' };

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  else if (form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  else if (/\d/.test(form.name)) errors.name = 'Name must not contain numbers';

  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address';

  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
  else if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(form.password)) errors.password = 'Must include uppercase, number & special character';

  if (!form.address.trim()) errors.address = 'Address is required';
  else if (form.address.trim().length < 5) errors.address = 'Address must be at least 5 characters';

  return errors;
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: 'info' });

  const fetchUsers = () => API.get('/users').then(r => setUsers(r.data));
  useEffect(() => { fetchUsers(); }, []);

  const notify = (text, type = 'info') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: 'info' }), 3000); };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const openModal = () => { setForm(empty); setErrors({}); setShowPassword(false); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setForm(empty); setErrors({}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    try {
      await API.post('/users', form);
      notify('User created successfully.', 'success');
      closeModal();
      fetchUsers();
    } catch (err) {
      notify(err.response?.data?.message || 'Error creating user.', 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await API.delete(`/users/${id}`);
      notify('User deleted.', 'success');
      fetchUsers();
    } catch (err) {
      notify(err.response?.data?.message || 'Error deleting user.', 'danger');
    }
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-semibold mb-0">Users</h4>
        <button className="btn btn-primary btn-sm" onClick={openModal}>+ Add User</button>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type} py-2 small`} role="alert">{msg.text}</div>
      )}

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr><th>S NO</th><th>Name</th><th>Email</th><th>Address</th><th>Role</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted py-3">No users found</td></tr>
              ) : users.map((u, i) => (
                <tr key={u.id}>
                  <td>{i + 1}</td>
                  <td className="fw-medium">{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.address || '—'}</td>
                  <td><span className={`badge bg-${u.role === 'admin' ? 'danger' : 'primary'}`}>{u.role}</span></td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-4">
              <h5 className="fw-semibold mb-3">Add User</h5>
              <form onSubmit={handleSubmit} noValidate>

                <div className="mb-2">
                  <label htmlFor="u-name" className="form-label small fw-medium">Name</label>
                  <input id="u-name" type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={form.name} onChange={handleChange('name')} placeholder="Enter name" />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                <div className="mb-2">
                  <label htmlFor="u-email" className="form-label small fw-medium">Email</label>
                  <input id="u-email" type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    value={form.email} onChange={handleChange('email')} placeholder="Enter email" />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                <div className="mb-2">
                  <label htmlFor="u-password" className="form-label small fw-medium">Password</label>
                  <div className="input-group">
                    <input id="u-password"
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      value={form.password} onChange={handleChange('password')} placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special" />
                    <button type="button" className="btn btn-outline-secondary" tabIndex={-1}
                      onClick={() => setShowPassword(s => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                  </div>
                </div>

                <div className="mb-2">
                  <label htmlFor="u-address" className="form-label small fw-medium">Address</label>
                  <input id="u-address" type="text"
                    className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                    value={form.address} onChange={handleChange('address')} placeholder="Enter address" />
                  {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                </div>

                <div className="mb-3">
                  <label htmlFor="u-role" className="form-label small fw-medium">Role</label>
                  <select id="u-role" className="form-select" value={form.role}
                    onChange={handleChange('role')}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-primary flex-grow-1" type="submit">Create</button>
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
