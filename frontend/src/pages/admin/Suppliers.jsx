import { useEffect, useState } from 'react';
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import API from '../../api/axios';
import ConfirmModal from '../../components/ConfirmModal';

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
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchSuppliers = async () => {
    const response = await API.get('/suppliers');
    setSuppliers(response.data);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const openAdd = () => {
    setForm(empty);
    setErrors({});
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (supplier) => {
    setForm({
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    });
    setErrors({});
    setEditId(supplier.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setErrors({});
    setForm(empty);
    setEditId(null);
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
        await API.put(`/suppliers/${editId}`, form);
        toast.success('Supplier updated successfully.');
      } else {
        await API.post('/suppliers', form);
        toast.success('Supplier created successfully.');
      }
      closeModal();
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/suppliers/${deleteId}`);
      toast.success('Supplier deleted.');
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting supplier.');
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      (supplier.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (supplier.phone || '').includes(search)
  );

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h3 className="page__title">Suppliers</h3>
          <p className="page__subtitle">Maintain supplier contacts and keep procurement details up to date.</p>
        </div>
        <button className="btn-primary-custom" onClick={openAdd}><FiPlus size={16} />Add Supplier</button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <FiSearch size={15} className="search-input-icon" />
          <input className="search-input" placeholder="Search by name, email or phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead><tr>{['S NO','Name','Email','Phone','Address','Created','Actions'].map(l => <th key={l}>{l}</th>)}</tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="table-empty">No suppliers found.</td></tr>
              ) : filtered.map((supplier, index) => (
                <tr key={supplier.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="td-bold">{index + 1}</td>
                  <td className="td-bold">{supplier.name}</td>
                  <td>{supplier.email || '-'}</td>
                  <td>{supplier.phone || '-'}</td>
                  <td className="td-muted">{supplier.address || '-'}</td>
                  <td>{new Date(supplier.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button type="button" onClick={() => openEdit(supplier)} className="action-btn action-btn--edit"><FiEdit2 size={15} /></button>
                      <button type="button" onClick={() => setDeleteId(supplier.id)} className="action-btn action-btn--delete"><FiTrash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block modal-overlay" onClick={closeModal}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-card">
              <div className="modal-card__body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="modal-card__title">{editId ? 'Edit Supplier' : 'Add Supplier'}</h5>
                    <p className="modal-card__subtitle">{editId ? 'Update supplier information.' : 'Create a supplier profile for procurement records.'}</p>
                  </div>
                  <button className="btn-close" onClick={closeModal} />
                </div>
                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label htmlFor="sup-name" className="modal-label">Name</label>
                    <input id="sup-name" type="text" className={`form-control modal-input ${errors.name ? 'is-invalid' : ''}`} value={form.name} onChange={handleChange('name')} placeholder="Enter supplier name" />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="sup-email" className="modal-label">Email</label>
                    <input id="sup-email" type="email" className={`form-control modal-input ${errors.email ? 'is-invalid' : ''}`} value={form.email} onChange={handleChange('email')} placeholder="Enter supplier email" />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="sup-phone" className="modal-label">Phone</label>
                    <input id="sup-phone" type="tel" className={`form-control modal-input ${errors.phone ? 'is-invalid' : ''}`} value={form.phone} onChange={handleChange('phone')} placeholder="10-digit number" maxLength={10} />
                    {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                  </div>
                  <div className="mb-4">
                    <label htmlFor="sup-address" className="modal-label">Address</label>
                    <textarea id="sup-address" rows={3} className={`form-control modal-textarea ${errors.address ? 'is-invalid' : ''}`} value={form.address} onChange={handleChange('address')} placeholder="Full address" />
                    {errors.address && <div className="invalid-feedback d-block">{errors.address}</div>}
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary-custom flex-grow-1" type="submit" disabled={submitting}>
                      {submitting ? (editId ? 'Updating...' : 'Creating...') : editId ? 'Update Supplier' : 'Create Supplier'}
                    </button>
                    <button className="btn btn-cancel-custom flex-grow-1" type="button" onClick={closeModal}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal show={!!deleteId} title="Delete Supplier" message="This will permanently delete the supplier. Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
