import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { validateLogin } from '../utils/validators';
import AuthShell, { authFieldStyle, authInputIconStyle, authPasswordButtonStyle } from '../components/AuthShell';

const UI = {
  border: '#dbe3ef',
  text: '#172033',
  muted: '#60708a',
  primary: '#315efb',
  primarySoft: '#eef3ff',
};

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setServerError('');
    const validationErrors = validateLogin(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const { data } = await API.post('/auth/login', {
        email: form.email.trim(),
        password: form.password,
      });

      login(data.user, data.token);
      navigate(
        data.user.role === 'admin'
          ? '/admin/dashboard'
          : data.user.role === 'staff'
            ? '/staff/dashboard'
            : '/user/products'
      );
    } catch (err) {
      setForm((current) => ({ ...current, password: '' }));
      if (!err.response) setServerError('No connection. Check your internet.');
      else if (err.response.status === 404) setServerError('Invalid credentials.');
      else if (err.response.status === 401) setServerError('Incorrect password.');
      else setServerError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [form, login, navigate]);

  return (
    <AuthShell variant="login">
      <div
        className="mb-3 d-inline-flex align-items-center"
        style={{
          borderRadius: 999,
          padding: '7px 12px',
          background: UI.primarySoft,
          color: UI.primary,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        Sign In
      </div>

      <h1 className="fw-semibold mb-2" style={{ color: UI.text, fontSize: 30 }}>
        Login to your account
      </h1>
      <p className="mb-4" style={{ color: UI.muted, fontSize: 14 }}>
        Use your registered email and password to continue.
      </p>

      {serverError && (
        <div
          className="mb-3"
          role="alert"
          style={{
            borderRadius: 14,
            padding: '12px 14px',
            background: '#fff2f2',
            color: '#b13838',
            border: '1px solid #f2c9c9',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="email" className="form-label" style={{ color: UI.text, fontWeight: 600, fontSize: 13 }}>
            Email
          </label>
          <div className="position-relative">
            <FiMail
              size={16}
              style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', color: UI.muted }}
            />
            <input
              id="email"
              ref={emailRef}
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              style={authFieldStyle}
              value={form.email}
              onChange={handleChange('email')}
              autoComplete="email"
              aria-describedby="emailError"
              aria-invalid={!!errors.email}
              placeholder="Enter your email"
            />
            {errors.email && <div id="emailError" className="invalid-feedback">{errors.email}</div>}
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="form-label" style={{ color: UI.text, fontWeight: 600, fontSize: 13 }}>
            Password
          </label>
          <div className="input-group">
            <span
              className="input-group-text border-end-0"
              style={authInputIconStyle}
            >
              <FiLock size={16} />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={`form-control border-start-0 border-end-0 ${errors.password ? 'is-invalid' : ''}`}
              style={{ ...authFieldStyle, paddingLeft: 12 }}
              value={form.password}
              onChange={handleChange('password')}
              autoComplete="current-password"
              aria-describedby="passwordError"
              aria-invalid={!!errors.password}
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="btn"
              tabIndex={-1}
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={authPasswordButtonStyle}
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
            {errors.password && <div id="passwordError" className="invalid-feedback d-block">{errors.password}</div>}
          </div>
        </div>

        <button
          type="submit"
          className="btn w-100 d-inline-flex align-items-center justify-content-center gap-2 mt-2"
          disabled={loading}
          style={{
            height: 52,
            borderRadius: 14,
            background: UI.primary,
            color: '#fff',
            fontWeight: 700,
            border: 'none',
            boxShadow: '0 18px 32px rgba(49, 94, 251, 0.22)',
          }}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              Logging in...
            </>
          ) : (
            <>
              Login
              <FiArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="mt-4 d-flex flex-wrap justify-content-between gap-2" style={{ color: UI.muted, fontSize: 13 }}>
        <span>New to Inventory MS?</span>
        <Link to="/register" style={{ color: UI.primary, fontWeight: 700 }}>
          Create account
        </Link>
      </div>
    </AuthShell>
  );
}
