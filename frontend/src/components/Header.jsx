import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user } = useAuth();

  return (
    <div
      className="d-flex align-items-center justify-content-between px-4 py-2 border-bottom bg-white"
      style={{ height: 56 }}
    >
      <span className="fw-semibold text-muted small">
        Welcome back, <span className="text-dark">{user?.name}</span>
      </span>
      <div className="d-flex align-items-center gap-2">
        <div
          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
          style={{ width: 32, height: 32, fontSize: 13, fontWeight: 600 }}
        >
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="lh-1">
          <div className="small fw-medium">{user?.name}</div>
          <div style={{ fontSize: 11 }} className="text-muted">{user?.role}</div>
        </div>
      </div>
    </div>
  );
}
