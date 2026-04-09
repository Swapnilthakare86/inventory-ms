import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiSend } from 'react-icons/fi';
import API from '../api/axios';
import AuthShell, { authFieldStyle } from '../components/AuthShell';

const UI = {
  text: '#172033', muted: '#60708a',
  primary: '#315efb', primarySoft: '#eef3ff',
};

export default function ForgotPassword() {
  const [email, setEmail]         = useState('');
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [loading, setLoading]     = useState(false);
  const emailRef = useRef(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address'); return; }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/forgot-password', { email: email.trim() });
      setSuccess(data.message || 'Password reset link sent to your email.');
    } catch (err) {
      if (!err.response) setError('No connection. Check your internet.');
      else if (err.response.status === 404) setError('No account found with this email.');
      else setError('Server error. Please try again later.');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell variant="forgot">
      <div className="mb-3 d-inline-flex align-items-center"
        style={{ borderRadius: 999, padding: '7px 12px', background: UI.primarySoft, color: UI.primary, fontSize: 12, fontWeight: 700 }}>
        Forgot Password
      </div>

      <h1 className="fw-semibold mb-2" style={{ color: UI.text, fontSize: 28 }}>Reset your password</h1>
      <p className="mb-4" style={{ color: UI.muted, fontSize: 14 }}>
        Enter your registered email and we'll send you a reset link valid for 30 minutes.
      </p>

      {error && (
        <div className="mb-3 auth-alert auth-alert--error" role="alert">{error}</div>
      )}

      {success ? (
        <div className="mb-3 auth-alert auth-alert--success" role="status">
          {success}
          <div className="mt-2" style={{ fontSize: 12, color: UI.muted }}>
            Check your inbox and follow the link to reset your password.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="fp-email" className="form-label" style={{ color: UI.text, fontWeight: 600, fontSize: 13 }}>Email</label>
            <div className="position-relative">
              <FiMail size={16} style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', color: UI.muted }} />
              <input
                id="fp-email"
                ref={emailRef}
                type="email"
                className={`form-control ${error ? 'is-invalid' : ''}`}
                style={authFieldStyle}
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="Enter your registered email"
                autoComplete="email"
              />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn w-100 d-inline-flex align-items-center justify-content-center gap-2"
            style={{ height: 52, borderRadius: 14, background: UI.primary, color: '#fff', fontWeight: 700, border: 'none', boxShadow: '0 18px 32px rgba(49,94,251,0.22)' }}>
            {loading
              ? <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />Sending...</>
              : <><FiSend size={16} />Send Reset Link</>}
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
