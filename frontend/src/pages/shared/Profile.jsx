import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { validatePassword, passwordStrength } from '../../utils/validators';
import {
  HiOutlineUserCircle, HiOutlineEnvelope, HiOutlineLockClosed,
  HiOutlineUser, HiOutlineMapPin, HiOutlineShieldCheck,
  HiOutlineEye, HiOutlineEyeSlash, HiOutlineCheckCircle,
  HiOutlineXCircle, HiOutlineArrowUpTray, HiOutlineKey
} from 'react-icons/hi2';

const getInitials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const roleBadge = {
  admin: { bg: '#DBEAFE', color: '#1D4ED8' },
  staff: { bg: '#EDE9FE', color: '#6D28D9' },
  user:  { bg: '#DCFCE7', color: '#15803D' },
};

const strengthColors = { Weak: '#DC2626', Medium: '#D97706', Strong: '#16A34A' };
const strengthLevels = { Weak: 1, Medium: 2, Strong: 3 };

function InlineAlert({ type, message, onDismiss }) {
  return (
    <div className={`profile-inline-alert profile-inline-alert--${type}`}>
      {type === 'success' ? <HiOutlineCheckCircle size={16} /> : <HiOutlineXCircle size={16} />}
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1, color: 'inherit' }}>×</button>
    </div>
  );
}

function PwField({ label, icon: Icon, value, onChange, error, show, onToggle, extra }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="profile-label"><Icon size={14} />{label}</label>
      <div style={{ position: 'relative' }}>
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange}
          className={`profile-input${error ? ' profile-input--error' : ''}`}
          style={{ paddingRight: 40 }} />
        <button type="button" className="profile-pw-toggle" onClick={onToggle}>
          {show ? <HiOutlineEyeSlash size={16} /> : <HiOutlineEye size={16} />}
        </button>
      </div>
      {error && <div className="profile-error-text">{error}</div>}
      {extra}
    </div>
  );
}

function StrengthBar({ password }) {
  const s = passwordStrength(password);
  if (!password || !s) return null;
  const filled = strengthLevels[s.label];
  const color  = strengthColors[s.label];
  return (
    <div style={{ marginTop: 6 }}>
      <div className="profile-strength-bar">
        {[1,2,3].map(i => (
          <div key={i} className="profile-strength-segment"
            style={{ background: i <= filled ? color : '#E2E8F0' }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color, marginTop: 3, fontWeight: 600 }}>{s.label} password</div>
    </div>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [form, setForm]           = useState({ name: user?.name || '', address: user?.address || '' });
  const [profAlert, setProfAlert] = useState(null);
  const [profLoading, setProfLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [pw, setPw]               = useState({ current: '', newPw: '', confirm: '' });
  const [pwShow, setPwShow]       = useState({ current: false, newPw: false, confirm: false });
  const [pwErrors, setPwErrors]   = useState({});
  const [pwAlert, setPwAlert]     = useState(null);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (!profAlert) return;
    const t = setTimeout(() => setProfAlert(null), 3000);
    return () => clearTimeout(t);
  }, [profAlert]);

  useEffect(() => {
    if (!pwAlert) return;
    const t = setTimeout(() => { setPwAlert(null); if (pwAlert.type === 'success') logout(); }, 2000);
    return () => clearTimeout(t);
  }, [pwAlert, logout]);

  const handleProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) { setNameError('Name must be at least 2 characters'); return; }
    if (/\d/.test(form.name)) { setNameError('Name must not contain numbers'); return; }
    setNameError(''); setProfLoading(true);
    try {
      await API.put('/users/profile', { name: form.name.trim(), address: form.address.trim() });
      setProfAlert({ type: 'success', message: 'Profile updated successfully.' });
    } catch (err) { setProfAlert({ type: 'error', message: err.response?.data?.message || 'Error updating profile.' }); }
    finally { setProfLoading(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!pw.current) errors.current = 'Current password is required';
    const newErr = validatePassword(pw.newPw);
    if (newErr) errors.newPw = newErr;
    if (!pw.confirm) errors.confirm = 'Please confirm new password';
    else if (pw.newPw !== pw.confirm) errors.confirm = 'Passwords do not match';
    if (Object.keys(errors).length > 0) { setPwErrors(errors); return; }
    setPwErrors({}); setPwLoading(true);
    try {
      await API.put('/users/change-password', { currentPassword: pw.current, newPassword: pw.newPw });
      setPwAlert({ type: 'success', message: 'Password changed successfully. Logging out in 2s...' });
      setPw({ current: '', newPw: '', confirm: '' });
    } catch (err) { setPwAlert({ type: 'error', message: err.response?.data?.message || 'Error changing password.' }); }
    finally { setPwLoading(false); }
  };

  const badge = roleBadge[user?.role] || roleBadge.user;
  const confirmMatch    = pw.confirm && pw.newPw === pw.confirm;
  const confirmMismatch = pw.confirm && pw.newPw !== pw.confirm;

  return (
    <div className="profile-page">
      <div className="profile-page__inner">
        <div style={{ marginBottom: 20 }}>
          <div className="profile-page__title">My Profile</div>
          <div className="profile-page__subtitle">Manage your account information and security</div>
        </div>

        {/* Header Card */}
        <div className="profile-header-card">
          <div className="profile-header-layout">
            <div className="profile-header-identity">
              <div className="profile-avatar">{getInitials(user?.name)}</div>
              <div className="profile-name">{user?.name}</div>
              <div className="profile-email">{user?.email}</div>
              <span className="profile-role-badge" style={{ background: badge.bg, color: badge.color }}>{user?.role}</span>
            </div>
            <div className="profile-header-stats">
              {[
                { icon: HiOutlineShieldCheck, label: 'ROLE',   value: user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) },
                { icon: HiOutlineCheckCircle, label: 'STATUS', value: 'Active', dot: true },
              ].map(({ icon: Icon, label, value, dot }) => (
                <div key={label} className="profile-stat-box">
                  <div className="profile-stat-box__label"><Icon size={14} />{label}</div>
                  <div className="profile-stat-box__value">
                    {dot && <div className="profile-active-dot" />}
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom cards */}
        <div className="profile-bottom-grid">

          {/* Profile Info */}
          <div className="profile-info-card">
            <div className="profile-card__header">
              <HiOutlineUserCircle size={20} color="#2563EB" />
              <span className="profile-card__title">Profile Information</span>
            </div>
            <div className="profile-divider" />
            {profAlert && <InlineAlert type={profAlert.type} message={profAlert.message} onDismiss={() => setProfAlert(null)} />}
            <form onSubmit={handleProfile}>
              <div style={{ marginBottom: 16 }}>
                <label className="profile-label"><HiOutlineEnvelope size={14} />Email</label>
                <div style={{ position: 'relative' }}>
                  <input value={user?.email || ''} readOnly className="profile-input profile-input--readonly" />
                  <HiOutlineLockClosed size={14} color="#94A3B8" className="profile-input-lock" />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="profile-label"><HiOutlineShieldCheck size={14} />Role</label>
                <span className="profile-role-badge" style={{ background: badge.bg, color: badge.color, padding: '6px 16px' }}>{user?.role}</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="profile-label"><HiOutlineUser size={14} />Name</label>
                <input value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); setNameError(''); }}
                  className={`profile-input${nameError ? ' profile-input--error' : ''}`}
                  onFocus={e => e.target.style.borderColor = '#2563EB'}
                  onBlur={e => e.target.style.borderColor = nameError ? '#DC2626' : '#D1D5DB'} />
                {nameError && <div className="profile-error-text">{nameError}</div>}
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="profile-label"><HiOutlineMapPin size={14} />Address</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Enter your address" className="profile-input"
                  onFocus={e => e.target.style.borderColor = '#2563EB'}
                  onBlur={e => e.target.style.borderColor = '#D1D5DB'} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={profLoading} className="profile-submit-btn profile-submit-btn--profile">
                  {profLoading
                    ? <><span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }} />Updating...</>
                    : <><HiOutlineArrowUpTray size={16} />Update Profile</>}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="profile-pw-card">
            <div className="profile-card__header">
              <HiOutlineLockClosed size={20} color="#DC2626" />
              <span className="profile-card__title">Change Password</span>
            </div>
            <div className="profile-divider" />
            {pwAlert && <InlineAlert type={pwAlert.type} message={pwAlert.message} onDismiss={() => setPwAlert(null)} />}
            <form onSubmit={handlePassword} noValidate>
              <PwField label="Current Password" icon={HiOutlineLockClosed}
                value={pw.current} onChange={e => { setPw({ ...pw, current: e.target.value }); setPwErrors({ ...pwErrors, current: '' }); }}
                error={pwErrors.current} show={pwShow.current} onToggle={() => setPwShow(s => ({ ...s, current: !s.current }))} />
              <PwField label="New Password" icon={HiOutlineLockClosed}
                value={pw.newPw} onChange={e => { setPw({ ...pw, newPw: e.target.value }); setPwErrors({ ...pwErrors, newPw: '' }); }}
                error={pwErrors.newPw} show={pwShow.newPw} onToggle={() => setPwShow(s => ({ ...s, newPw: !s.newPw }))}
                extra={<StrengthBar password={pw.newPw} />} />
              <PwField label="Confirm New Password" icon={HiOutlineLockClosed}
                value={pw.confirm} onChange={e => { setPw({ ...pw, confirm: e.target.value }); setPwErrors({ ...pwErrors, confirm: '' }); }}
                error={pwErrors.confirm} show={pwShow.confirm} onToggle={() => setPwShow(s => ({ ...s, confirm: !s.confirm }))}
                extra={pw.confirm ? (
                  <div className="profile-match-text" style={{ color: confirmMatch ? '#16A34A' : '#DC2626' }}>
                    {confirmMatch ? <HiOutlineCheckCircle size={13} /> : <HiOutlineXCircle size={13} />}
                    {confirmMatch ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                ) : null} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="submit" disabled={pwLoading} className="profile-submit-btn profile-submit-btn--password">
                  {pwLoading
                    ? <><span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }} />Changing...</>
                    : <><HiOutlineKey size={16} />Change Password</>}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
