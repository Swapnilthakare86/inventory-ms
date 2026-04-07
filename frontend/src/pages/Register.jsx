import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowRight, FiEye, FiEyeOff, FiHome, FiLock, FiMail, FiUser } from 'react-icons/fi';
import API from '../api/axios';
import { validateRegister, passwordStrength } from '../utils/validators';
import AuthShell, { authFieldStyle, authInputIconStyle, authPasswordButtonStyle } from '../components/AuthShell';

const UI = {
  text: '#172033',
  muted: '#60708a',
  primary: '#315efb',
  success: '#1f8f5f',
  successSoft: '#eaf8f1',
  warning: '#b7791f',
  danger: '#d64545',
  dangerSoft: '#fff2f2',
};

const getStrengthTone = (strength) => {
  if (!strength) return { color: UI.muted, bg: '#e8edf5', width: '0%' };
  if (strength.label === 'Strong') return { color: UI.success, bg: UI.success, width: '100%' };
  if (strength.label === 'Medium') return { color: UI.warning, bg: UI.warning, width: '62%' };
  return { color: UI.danger, bg: UI.danger, width: '30%' };
};

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

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const strength = passwordStrength(form.password);
  const tone = getStrengthTone(strength);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const validationErrors = validateRegister(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

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
    <AuthShell variant="register">
      <div
        className="mb-3 d-inline-flex align-items-center"
        style={{
          borderRadius: 999,
          padding: '7px 12px',
          background: UI.successSoft,
          color: UI.success,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        Create Account
      </div>

      <h1 className="fw-semibold mb-2" style={{ color: UI.text, fontSize: 30 }}>
        Register your account
      </h1>
      <p className="mb-4" style={{ color: UI.muted, fontSize: 14 }}>
        Fill in your details below to create a new Inventory MS account.
      </p>

      {serverError && (
        <div
          className="mb-3"
          role="alert"
          style={{
            borderRadius: 14,
            padding: '12px 14px',
            background: UI.dangerSoft,
            color: '#b13838',
            border: '1px solid #f2c9c9',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {serverError}
        </div>
      )}

      {success && (
        <div
          className="mb-3"
          role="status"
          style={{
            borderRadius: 14,
            padding: '12px 14px',
            background: UI.successSoft,
            color: UI.success,
            border: '1px solid #cfe9da',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-3">
          <div className="col-md-6">
            <label htmlFor="name" className="form-label" style={{ color: UI.text, fontWeight: 600, fontSize: 13 }}>
              Full Name
            </label>
            <div className="position-relative">
              <FiUser size={16} style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', color: UI.muted }} />
              <input
                id="name"
                ref={nameRef}
                type="text"
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                style={authFieldStyle}
                value={form.name}
                onChange={handleChange('name')}
                autoComplete="name"
                aria-describedby="nameError"
                aria-invalid={!!errors.name}
                placeholder="Enter your full name"
              />
              {errors.name && <div id="nameError" className="invalid-feedback">{errors.name}</div>}
            </div>
          </div>

          <div className="col-md-6">
            <label htmlFor="reg-email" className="form-label" style={{ color: UI.text, fontWeight: 600, fontSize: 13 }}>
              Email
            </label>
            <div className="position-relative">
              <FiMail size={16} style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', color: UI.muted }} />
              <input
                id="reg-email"
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                style={authFieldStyle}
                value={form.email}
                onChange={handleChange('email')}
                autoComplete="email"
                aria-describedby="regEmailError"
                aria-invalid={!!errors.email}
                placeholder="Enter your email"
              />
              {errors.email && <div id="regEmailError" className="invalid-feedback">{errors.email}</div>}
            </div>
          </div>

          <div className="col-12">
            <label htmlFor="address" className="form-label" style={{ color: UI.text, fontWeight: 600, fontSize: 13 }}>
              Address
            </label>
            <div className="position-relative">
              <FiHome size={16} style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', color: UI.muted }} />
              <input
                id="address"
                type="text"
                className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                style={authFieldStyle}
                value={form.address}
                onChange={handleChange('address')}
                autoComplete="street-address"
                aria-describedby="addressError"
                aria-invalid={!!errors.address}
                placeholder="Enter your address"
              />
              {errors.address && <div id="addressError" className="invalid-feedback">{errors.address}</div>}
            </div>
          </div>

          <div className="col-md-6">
            <label htmlFor="reg-password" className="form-label" style={{ color: UI.text, fontWeight: 600, fontSize: 13 }}>
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
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className={`form-control border-start-0 border-end-0 ${errors.password ? 'is-invalid' : ''}`}
                style={{ ...authFieldStyle, paddingLeft: 12 }}
                value={form.password}
                onChange={handleChange('password')}
                autoComplete="new-password"
                aria-describedby="regPasswordError"
                aria-invalid={!!errors.password}
                placeholder="Create a password"
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
            </div>
            {errors.password && <div id="regPasswordError" className="invalid-feedback d-block">{errors.password}</div>}

            {form.password && strength && (
              <div className="mt-2">
                <div style={{ height: 6, borderRadius: 999, background: '#e8edf5', overflow: 'hidden' }}>
                  <div style={{ width: tone.width, height: '100%', background: tone.bg }} />
                </div>
                <div className="mt-1" style={{ color: tone.color, fontSize: 12, fontWeight: 600 }}>
                  {strength.label} password
                </div>
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label htmlFor="confirmPassword" className="form-label" style={{ color: UI.text, fontWeight: 600, fontSize: 13 }}>
              Confirm Password
            </label>
            <div className="input-group">
              <span
                className="input-group-text border-end-0"
                style={authInputIconStyle}
              >
                <FiLock size={16} />
              </span>
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                className={`form-control border-start-0 border-end-0 ${errors.confirmPassword ? 'is-invalid' : ''}`}
                style={{ ...authFieldStyle, paddingLeft: 12 }}
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                autoComplete="new-password"
                aria-describedby="confirmPasswordError"
                aria-invalid={!!errors.confirmPassword}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="btn"
                tabIndex={-1}
                onClick={() => setShowConfirm((current) => !current)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                style={authPasswordButtonStyle}
              >
                {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <div id="confirmPasswordError" className="invalid-feedback d-block">{errors.confirmPassword}</div>}
          </div>
        </div>

        <button
          type="submit"
          className="btn w-100 d-inline-flex align-items-center justify-content-center gap-2 mt-4"
          disabled={loading}
          style={{
            height: 52,
            borderRadius: 14,
            background: UI.success,
            color: '#fff',
            fontWeight: 700,
            border: 'none',
            boxShadow: '0 18px 32px rgba(31, 143, 95, 0.18)',
          }}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              Creating account...
            </>
          ) : (
            <>
              Register
              <FiArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="mt-4 d-flex flex-wrap justify-content-between gap-2" style={{ color: UI.muted, fontSize: 13 }}>
        <span>Already have an account?</span>
        <Link to="/login" style={{ color: UI.primary, fontWeight: 700 }}>
          Back to login
        </Link>
      </div>
    </AuthShell>
  );
}
