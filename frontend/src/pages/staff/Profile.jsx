import { useState } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function StaffProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', address: user?.address || '' });
  const [msg, setMsg] = useState({ text: '', type: 'info' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put('/users/profile', form);
      setMsg({ text: 'Profile updated successfully.', type: 'success' });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Error', type: 'danger' });
    }
    setTimeout(() => setMsg({ text: '', type: 'info' }), 3000);
  };

  return (
    <div className="p-4">
      <h4 className="fw-semibold mb-4">My Profile</h4>
      <div className="card p-4" style={{ maxWidth: 480 }}>
        {msg.text && <div className={`alert alert-${msg.type} py-2 small mb-3`} role="alert">{msg.text}</div>}
        <div className="mb-3">
          <label className="form-label small fw-medium">Email</label>
          <input className="form-control" value={user?.email || ''} disabled />
        </div>
        <div className="mb-3">
          <label className="form-label small fw-medium">Role</label>
          <input className="form-control" value="Staff" disabled />
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-medium">Name</label>
            <input className="form-control" required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-medium">Address</label>
            <input className="form-control" value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <button className="btn btn-primary w-100" type="submit">Update Profile</button>
        </form>
      </div>
    </div>
  );
}
