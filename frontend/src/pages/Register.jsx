import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { validateRegister, passwordStrength } from '../utils/validators';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', address: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const strength = passwordStrength(form.password);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const validationErrors = validateRegister(form);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setErrors({});
    setLoading(true);
    try {
      await API.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        address: form.address.trim(),
      });
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (!err.response) setServerError('No connection. Check your internet.');
      else if (err.response.status === 400) setServerError(err.response.data?.message || 'Email already exists.');
      else setServerError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-grow-1 align-items-center justify-content-center bg-light px-3 py-5">
      <div className="card shadow-sm p-4 w-100" style={{ maxWidth: 420 }}>
        <h4 className="mb-4 fw-semibold text-center">Create Account</h4>

        {serverError && <div className="alert alert-danger py-2 small" role="alert">{serverError}</div>}
        {success && <div className="alert alert-success py-2 small" role="status">{success}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="mb-3">
            <label htmlFor="name" className="form-label small fw-medium">Name</label>
            <input
              id="name"
              ref={nameRef}
              type="text"
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              value={form.name}
              onChange={handleChange('name')}
              autoComplete="name"
              aria-describedby="nameError"
              aria-invalid={!!errors.name}
            />
            {errors.name && <div id="nameError" className="invalid-feedback">{errors.name}</div>}
          </div>

          {/* Email */}
          <div className="mb-3">
            <label htmlFor="reg-email" className="form-label small fw-medium">Email</label>
            <input
              id="reg-email"
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              value={form.email}
              onChange={handleChange('email')}
              autoComplete="email"
              aria-describedby="regEmailError"
              aria-invalid={!!errors.email}
            />
            {errors.email && <div id="regEmailError" className="invalid-feedback">{errors.email}</div>}
          </div>

          {/* Address */}
          <div className="mb-3">
            <label htmlFor="address" className="form-label small fw-medium">Address</label>
            <input
              id="address"
              type="text"
              className={`form-control ${errors.address ? 'is-invalid' : ''}`}
              value={form.address}
              onChange={handleChange('address')}
              autoComplete="street-address"
              aria-describedby="addressError"
              aria-invalid={!!errors.address}
            />
            {errors.address && <div id="addressError" className="invalid-feedback">{errors.address}</div>}
          </div>

          {/* Password */}
          <div className="mb-1">
            <label htmlFor="reg-password" className="form-label small fw-medium">Password</label>
            <div className="input-group">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                value={form.password}
                onChange={handleChange('password')}
                autoComplete="new-password"
                aria-describedby="regPasswordError"
                aria-invalid={!!errors.password}
              />
              <button type="button" className="btn btn-outline-secondary" tabIndex={-1}
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? '🙈' : '👁️'}
              </button>
              {errors.password && <div id="regPasswordError" className="invalid-feedback">{errors.password}</div>}
            </div>
          </div>

          {/* Password strength indicator */}
          {form.password && strength && (
            <div className="mb-3 mt-1">
              <div className="progress" style={{ height: 4 }}>
                <div
                  className={`progress-bar bg-${strength.color}`}
                  style={{ width: strength.label === 'Strong' ? '100%' : strength.label === 'Medium' ? '60%' : '25%' }}
                />
              </div>
              <small className={`text-${strength.color}`}>{strength.label} password</small>
            </div>
          )}

          {/* Confirm Password */}
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label small fw-medium">Confirm Password</label>
            <div className="input-group">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                autoComplete="new-password"
                aria-describedby="confirmPasswordError"
                aria-invalid={!!errors.confirmPassword}
              />
              <button type="button" className="btn btn-outline-secondary" tabIndex={-1}
                onClick={() => setShowConfirm(s => !s)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                {showConfirm ? '🙈' : '👁️'}
              </button>
              {errors.confirmPassword && <div id="confirmPasswordError" className="invalid-feedback">{errors.confirmPassword}</div>}
            </div>
          </div>

          <button type="submit" className="btn btn-success w-100" disabled={loading}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Creating account...</>
              : 'Register'}
          </button>
        </form>

        <p className="text-center mt-3 small">
          Have account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
