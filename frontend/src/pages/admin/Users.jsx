import { useEffect, useState } from 'react';
import { FiEye, FiEyeOff, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import API from '../../api/axios';
import ConfirmModal from '../../components/ConfirmModal';

const empty = { name: '', email: '', password: '', address: '', role: 'user' };

const roleStyle = (role) => {
  if (role === 'admin') return { color: '#b42318', bg: '#fef3f2' };
  if (role === 'staff') return { color: '#315efb', bg: '#eef3ff' };
  return { color: '#1f8f5f', bg: '#eaf8f1' };
};

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  else if (form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  else if (/\d/.test(form.name)) errors.name = 'Name must not contain numbers';
  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address';
  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
  else if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(form.password)) errors.password = 'Must include uppercase, number and special character';
  if (!form.address.trim()) errors.address = 'Address is required';
  else if (form.address.trim().length < 5) errors.address = 'Address must be at least 5 characters';
  return errors;
};

export default function AdminUsers() {
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const fetchUsers = async () => { const r = await API.get('/users'); setUsers(r.data); };
  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const openModal  = () => { setForm(empty); setErrors({}); setShowPassword(false); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setForm(empty); setErrors({}); setShowPassword(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setSubmitting(true);
    try {
      await API.post('/users', form);
      toast.success('User created successfully.');
      closeModal(); fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Error creating user.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    try { await API.delete(`/users/${deleteId}`); toast.success('User deleted.'); fetchUsers(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error deleting user.'); }
    finally { setDeleteId(null); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.address || '').toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );
  const isMobile = viewportWidth <= 768;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h3 className="page__title">Users</h3>
          <p className="page__subtitle">Manage user access, account roles, and profile details from one place.</p>
        </div>
        <button className="btn-primary-custom" onClick={openModal}><FiPlus size={16} />Add User</button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <FiSearch size={15} className="search-input-icon" />
          <input className="search-input" placeholder="Search by name, email, address or role..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-card">
        {isMobile ? (
          <div className="table-responsive" style={{ overflowX: 'hidden' }}>
            <table className="table align-middle mb-0" style={{ tableLayout: 'fixed', width: '100%', minWidth: 0 }}>
              <thead><tr>{['Sr No','Name','Email','Role','Act'].map((l, idx) => <th key={l} style={{ fontSize: 8.4, padding: idx === 0 ? '8px 2px 8px 4px' : idx === 1 ? '8px 2px' : idx === 2 ? '8px 7px 8px 3px' : idx === 3 ? '8px 4px 8px 7px' : '8px 2px' }}>{l}</th>)}</tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="table-empty">No users found.</td></tr>
                ) : filtered.map((user, index) => {
                  const role = roleStyle(user.role);
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="td-bold" style={{ fontSize: 8.4, padding: '8px 2px 8px 4px', width: '10%', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{index + 1}</td>
                      <td style={{ padding: '8px 2px 8px 1px', width: '22%', verticalAlign: 'top' }}>
                        <div
                          title={user.name}
                          style={{
                            fontSize: 8.1,
                            fontWeight: 700,
                            color: 'var(--text)',
                            lineHeight: 1.2,
                            wordBreak: 'break-word',
                          }}
                        >
                          {user.name}
                        </div>
                        <div style={{ fontSize: 7.1, color: 'var(--muted)', lineHeight: 1.2, marginTop: 2, wordBreak: 'break-word' }}>
                          {user.address || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '8px 8px 8px 3px', width: '40%', verticalAlign: 'top' }}>
                        <div
                          title={user.email}
                          style={{
                            fontSize: 7.15,
                            color: 'var(--text)',
                            lineHeight: 1.15,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {user.email}
                        </div>
                      </td>
                      <td style={{ padding: '8px 4px 8px 8px', width: '18%', verticalAlign: 'top' }}>
                        <span className="role-badge" style={{ color: role.color, background: role.bg, fontSize: 7.1, padding: '3px 4px' }}>{user.role}</span>
                      </td>
                      <td style={{ padding: '8px 2px', width: '10%', verticalAlign: 'top' }}>
                        <button type="button" onClick={() => setDeleteId(user.id)} className="action-btn action-btn--delete" style={{ width: 19, height: 19, borderRadius: 6 }}><FiTrash2 size={8.5} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead><tr>{['S NO','Name','Email','Address','Role','Actions'].map(l => <th key={l}>{l}</th>)}</tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="table-empty">No users found.</td></tr>
                ) : filtered.map((user, index) => {
                  const role = roleStyle(user.role);
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="td-bold">{index + 1}</td>
                      <td className="td-bold">{user.name}</td>
                      <td>{user.email}</td>
                      <td className="td-muted">{user.address || '-'}</td>
                      <td>
                        <span className="role-badge" style={{ color: role.color, background: role.bg }}>{user.role}</span>
                      </td>
                      <td>
                        <button type="button" onClick={() => setDeleteId(user.id)} className="action-btn action-btn--delete"><FiTrash2 size={15} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal d-block modal-overlay" onClick={closeModal}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-card">
              <div className="modal-card__body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="modal-card__title">Add User</h5>
                    <p className="modal-card__subtitle">Create a new account and assign the appropriate role.</p>
                  </div>
                  <button className="btn-close" onClick={closeModal} />
                </div>
                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label htmlFor="u-name" className="modal-label">Name</label>
                    <input id="u-name" type="text" className={`form-control modal-input ${errors.name ? 'is-invalid' : ''}`} value={form.name} onChange={handleChange('name')} placeholder="Enter name" />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="u-email" className="modal-label">Email</label>
                    <input id="u-email" type="email" className={`form-control modal-input ${errors.email ? 'is-invalid' : ''}`} value={form.email} onChange={handleChange('email')} placeholder="Enter email" />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="u-password" className="modal-label">Password</label>
                    <div className="input-group">
                      <input id="u-password" type={showPassword ? 'text' : 'password'}
                        className={`form-control modal-input ${errors.password ? 'is-invalid' : ''}`}
                        style={{ borderRadius: '12px 0 0 12px' }}
                        value={form.password} onChange={handleChange('password')} placeholder="Min 8 chars, uppercase, number, special" />
                      <button type="button" className="btn"
                        style={{ border: '1px solid var(--border)', borderLeft: 'none', borderRadius: '0 12px 12px 0', background: '#f8fafc', color: 'var(--muted)' }}
                        onClick={() => setShowPassword(c => !c)}>
                        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                    {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="u-address" className="modal-label">Address</label>
                    <input id="u-address" type="text" className={`form-control modal-input ${errors.address ? 'is-invalid' : ''}`} value={form.address} onChange={handleChange('address')} placeholder="Enter address" />
                    {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                  </div>
                  <div className="mb-4">
                    <label htmlFor="u-role" className="modal-label">Role</label>
                    <select id="u-role" className="form-select modal-select" value={form.role} onChange={handleChange('role')}>
                      <option value="user">User</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary-custom flex-grow-1" type="submit" disabled={submitting}>
                      {submitting ? 'Creating...' : 'Create User'}
                    </button>
                    <button className="btn btn-cancel-custom flex-grow-1" type="button" onClick={closeModal}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal show={!!deleteId} title="Delete User" message="This will permanently delete the user. Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
