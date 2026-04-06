import { useEffect, useState } from 'react';
import API from '../../api/axios';

const empty = { name: '', email: '', password: '', address: '', role: 'user' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(empty);
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchUsers = () => API.get('/users').then(r => setUsers(r.data));
  useEffect(() => { fetchUsers(); }, []);

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/users', form);
      notify('User created.');
      setShowModal(false);
      setForm(empty);
      fetchUsers();
    } catch (err) {
      notify(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await API.delete(`/users/${id}`);
      notify('User deleted.');
      fetchUsers();
    } catch (err) {
      notify(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-semibold mb-0">Users</h4>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Add User</button>
      </div>
      {msg && <div className="alert alert-info py-2 small">{msg}</div>}

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr><th>S NO</th><th>Name</th><th>Email</th><th>Address</th><th>Role</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id}>
                  <td>{i + 1}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.address}</td>
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
              <form onSubmit={handleSubmit}>
                <div className="mb-2">
                  <input className="form-control" placeholder="Name" required
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="mb-2">
                  <input className="form-control" type="email" placeholder="Email" required
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="mb-2">
                  <input className="form-control" type="password" placeholder="Password" required
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className="mb-2">
                  <input className="form-control" placeholder="Address"
                    value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="mb-3">
                  <select className="form-select" value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary flex-grow-1" type="submit">Create</button>
                  <button className="btn btn-secondary flex-grow-1" type="button"
                    onClick={() => { setShowModal(false); setForm(empty); }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
