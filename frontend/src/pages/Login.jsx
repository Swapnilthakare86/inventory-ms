import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { validateLogin } from '../utils/validators';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setServerError('');
    const validationErrors = validateLogin(form);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setErrors({});
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', {
        email: form.email.trim(),
        password: form.password,
      });
      login(data.user, data.token);
      navigate(
        data.user.role === 'admin' ? '/admin/dashboard' :
        data.user.role === 'staff' ? '/staff/products' :
        '/user/products'
      );
    } catch (err) {
      setForm(f => ({ ...f, password: '' }));
      if (!err.response) setServerError('No connection. Check your internet.');
      else if (err.response.status === 404) setServerError('Invalid credentials.');
      else if (err.response.status === 401) setServerError('Incorrect password.');
      else setServerError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [form, login, navigate]);

  return (
    <div className="d-flex flex-grow-1 align-items-center justify-content-center bg-light px-3 py-5">
      <div className="card shadow-sm p-4 w-100" style={{ maxWidth: 380 }}>
        <h4 className="mb-4 fw-semibold text-center">Inventory MS — Login</h4>

        {serverError && (
          <div className="alert alert-danger py-2 small" role="alert">{serverError}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="email" className="form-label small fw-medium">Email</label>
            <input
              id="email"
              ref={emailRef}
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              value={form.email}
              onChange={handleChange('email')}
              autoComplete="email"
              aria-describedby="emailError"
              aria-invalid={!!errors.email}
            />
            {errors.email && <div id="emailError" className="invalid-feedback">{errors.email}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label small fw-medium">Password</label>
            <div className="input-group">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                value={form.password}
                onChange={handleChange('password')}
                autoComplete="current-password"
                aria-describedby="passwordError"
                aria-invalid={!!errors.password}
              />
              <button type="button" className="btn btn-outline-secondary" tabIndex={-1}
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? '🙈' : '👁️'}
              </button>
              {errors.password && <div id="passwordError" className="invalid-feedback">{errors.password}</div>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Logging in...</>
              : 'Login'}
          </button>
        </form>

        <p className="text-center mt-3 small">
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
