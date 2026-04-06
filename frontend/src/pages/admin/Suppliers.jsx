import { useEffect, useState } from 'react';
import API from '../../api/axios';

const empty = { name: '', contact: '' };

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchSuppliers = () => API.get('/suppliers').then(r => setSuppliers(r.data));
  useEffect(() => { fetchSuppliers(); }, []);

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const openAdd = () => { setForm(empty); setEditId(null); setShowModal(true); };
  const openEdit = (s) => { setForm({ name: s.name, contact: s.contact }); setEditId(s.id); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await API.put(`/suppliers/${editId}`, form);
        notify('Supplier updated.');
      } else {
        await API.post('/suppliers', form);
        notify('Supplier created.');
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      notify(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    try {
      await API.delete(`/suppliers/${id}`);
      notify('Supplier deleted.');
      fetchSuppliers();
    } catch (err) {
      notify(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-semibold mb-0">Suppliers</h4>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Supplier</button>
      </div>
      {msg && <div className="alert alert-info py-2 small">{msg}</div>}

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr><th>S NO</th><th>Name</th><th>Contact</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {suppliers.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>{s.name}</td>
                  <td>{s.contact}</td>
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

      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-4">
              <h5 className="fw-semibold mb-3">{editId ? 'Edit Supplier' : 'Add Supplier'}</h5>
              <form onSubmit={handleSubmit}>
                <div className="mb-2">
                  <input className="form-control" placeholder="Supplier name" required
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="mb-3">
                  <input className="form-control" placeholder="Contact (email/phone)" required
                    value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary flex-grow-1" type="submit">{editId ? 'Update' : 'Create'}</button>
                  <button className="btn btn-secondary flex-grow-1" type="button" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
