import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import API from '../api/axios';
import { validatePassword } from '../utils/validators';
import AuthShell, { authFieldStyle, authInputIconStyle, authPasswordButtonStyle } from '../components/AuthShell';

const UI = {
  text: '#172033', muted: '#60708a',
  primary: '#315efb', primarySoft: '#eef3ff',
  danger: '#d64545',
};

export default function ResetPassword() {
  const { token }                       = useParams();
  const navigate                        = useNavigate();
  const [form, setForm]                 = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors]             = useState({});
  const [serverError, setServerError]   = useState('');
  const [success, setSuccess]           = useState('');
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  useEffect(() => {
    if (!token) { setServerError('Invalid or missing reset token.'); }
  }, [token]);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = {};
    const pwErr = validatePassword(form.password);
    if (pwErr) errs.password = pwErr;
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your new password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { data } = await API.post('/auth/reset-password', { token, password: form.password });
      setSuccess(data.message || 'Password reset successfully.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      if (!err.response) setServerError('No connection. Check your internet.');
      else if (err.response.status === 400) setServerError('Reset link is invalid or has expired. Please request a new one.');
      else setServerError('Server error. Please try again later.');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell variant="forgot">
      <div className="mb-3 d-inline-flex align-items-center"
        style={{ borderRadius: 999, padding: '7px 12px', background: UI.primarySoft, color: UI.primary, fontSize: 12, fontWeight: 700 }}>
        Reset Password
      </div>

      <h1 className="fw-semibold mb-2" style={{ color: UI.text, fontSize: 28 }}>Set a new password</h1>
      <p className="mb-4" style={{ color: UI.muted, fontSize: 14 }}>
        Choose a strong password with at least 8 characters, one uppercase letter, one number and one special character.
      </p>

      {serverError && <div className="mb-3 auth-alert auth-alert--error" role="alert">{serverError}</div>}

      {success ? (
        <div className="mb-3 auth-alert auth-alert--success" role="status">
          ✅ {success}
          <div className="mt-2" style={{ fontSize: 12, color: UI.muted }}>Redirecting to login...</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {/* New Password */}
          <div className="mb-3">
            <label htmlFor="rp-password" className="form-label" style={{ color: UI.text, fontWeight: 600, fontSize: 13 }}>New Password</label>
            <div className="input-group">
              <span className="input-group-text border-end-0" style={authInputIconStyle}><FiLock size={16} /></span>
              <input
                id="rp-password"
                type={showPassword ? 'text' : 'password'}
                className={`form-control border-start-0 border-end-0 ${errors.password ? 'is-invalid' : ''}`}
                style={{ ...authFieldStyle, paddingLeft: 12 }}
                value={form.password}
                onChange={handleChange('password')}
                placeholder="Enter new password"
                autoComplete="new-password"
              />
              <button type="button" className="btn" tabIndex={-1}
                onClick={() => setShowPassword(s => !s)}
                style={authPasswordButtonStyle}>
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
              {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label htmlFor="rp-confirm" className="form-label" style={{ color: UI.text, fontWeight: 600, fontSize: 13 }}>Confirm New Password</label>
            <div className="input-group">
              <span className="input-group-text border-end-0" style={authInputIconStyle}><FiLock size={16} /></span>
              <input
                id="rp-confirm"
                type={showConfirm ? 'text' : 'password'}
                className={`form-control border-start-0 border-end-0 ${errors.confirmPassword ? 'is-invalid' : ''}`}
                style={{ ...authFieldStyle, paddingLeft: 12 }}
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
              <button type="button" className="btn" tabIndex={-1}
                onClick={() => setShowConfirm(s => !s)}
                style={authPasswordButtonStyle}>
                {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
              {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}
            </div>
            {form.confirmPassword && form.password === form.confirmPassword && (
              <div style={{ fontSize: 12, color: '#1f8f5f', marginTop: 4 }}>✓ Passwords match</div>
            )}
          </div>

          <button type="submit" disabled={loading || !token}
            className="btn w-100 d-inline-flex align-items-center justify-content-center gap-2"
            style={{ height: 52, borderRadius: 14, background: UI.primary, color: '#fff', fontWeight: 700, border: 'none', boxShadow: '0 18px 32px rgba(49,94,251,0.22)' }}>
            {loading
              ? <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />Resetting...</>
              : 'Reset Password'}
          </button>
        </form>
      )}

      <div className="mt-4" style={{ fontSize: 13 }}>
        <Link to="/login" className="d-inline-flex align-items-center gap-1" style={{ color: UI.primary, fontWeight: 700, textDecoration: 'none' }}>
          <FiArrowLeft size={14} /> Back to Login
        </Link>
      </div>
    </AuthShell>
  );
}
