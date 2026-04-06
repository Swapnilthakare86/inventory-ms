import { useState } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function SharedProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', address: user?.address || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put('/users/profile', form);
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating profile.');
    } finally { setLoading(false); }
  };

  const validatePw = () => {
    const errors = {};
    if (!pwForm.currentPassword) errors.currentPassword = 'Current password is required';
    if (!pwForm.newPassword) errors.newPassword = 'New password is required';
    else if (pwForm.newPassword.length < 8) errors.newPassword = 'Min 8 characters';
    else if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(pwForm.newPassword))
      errors.newPassword = 'Must include uppercase, number & special character';
    if (!pwForm.confirmPassword) errors.confirmPassword = 'Please confirm new password';
    else if (pwForm.newPassword !== pwForm.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    return errors;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const errors = validatePw();
    if (Object.keys(errors).length > 0) { setPwErrors(errors); return; }
    setPwErrors({});
    setPwLoading(true);
    try {
      await API.put('/users/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error changing password.');
    } finally { setPwLoading(false); }
  };

  return (
    <div className="p-4">
      <h4 className="fw-semibold mb-4">My Profile</h4>
      <div className="row g-4">

        {/* Profile Info */}
        <div className="col-md-6">
          <div className="card p-4">
            <h6 className="fw-semibold mb-3">Profile Information</h6>
            <div className="mb-3">
              <label className="form-label small fw-medium">Email</label>
              <input className="form-control" value={user?.email || ''} disabled />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium">Role</label>
              <input className="form-control text-capitalize" value={user?.role || ''} disabled />
            </div>
            {user?.created_at && (
              <div className="mb-3">
                <label className="form-label small fw-medium">Member Since</label>
                <input className="form-control" value={new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} disabled />
              </div>
            )}
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
              <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="col-md-6">
          <div className="card p-4">
            <h6 className="fw-semibold mb-3">Change Password</h6>
            <form onSubmit={handlePasswordChange} noValidate>
              <div className="mb-3">
                <label className="form-label small fw-medium">Current Password</label>
                <input type="password" className={`form-control ${pwErrors.currentPassword ? 'is-invalid' : ''}`}
                  value={pwForm.currentPassword}
                  onChange={e => { setPwForm({ ...pwForm, currentPassword: e.target.value }); setPwErrors({ ...pwErrors, currentPassword: '' }); }} />
                {pwErrors.currentPassword && <div className="invalid-feedback">{pwErrors.currentPassword}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label small fw-medium">New Password</label>
                <input type="password" className={`form-control ${pwErrors.newPassword ? 'is-invalid' : ''}`}
                  value={pwForm.newPassword}
                  onChange={e => { setPwForm({ ...pwForm, newPassword: e.target.value }); setPwErrors({ ...pwErrors, newPassword: '' }); }} />
                {pwErrors.newPassword && <div className="invalid-feedback">{pwErrors.newPassword}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label small fw-medium">Confirm New Password</label>
                <input type="password" className={`form-control ${pwErrors.confirmPassword ? 'is-invalid' : ''}`}
                  value={pwForm.confirmPassword}
                  onChange={e => { setPwForm({ ...pwForm, confirmPassword: e.target.value }); setPwErrors({ ...pwErrors, confirmPassword: '' }); }} />
                {pwErrors.confirmPassword && <div className="invalid-feedback">{pwErrors.confirmPassword}</div>}
              </div>
              <button className="btn btn-warning w-100" type="submit" disabled={pwLoading}>
                {pwLoading ? <><span className="spinner-border spinner-border-sm me-2" />Changing...</> : 'Change Password'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
