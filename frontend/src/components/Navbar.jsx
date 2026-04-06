import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar px-4 border-bottom bg-white" style={{ height: 56 }}>
      <Link className="navbar-brand fw-semibold text-primary" to="/login">
        Inventory MS
      </Link>
      <div className="d-flex gap-2">
        <Link className="btn btn-sm btn-outline-primary" to="/login">Login</Link>
        <Link className="btn btn-sm btn-primary" to="/register">Register</Link>
      </div>
    </nav>
  );
}
