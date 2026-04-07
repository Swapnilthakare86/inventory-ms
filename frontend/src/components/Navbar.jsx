import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar-public">
      <Link className="navbar-public__brand" to="/login">Inventory MS</Link>
      <div className="navbar-public__actions">
        <Link className="btn btn-sm btn-outline-primary" to="/login">Login</Link>
        <Link className="btn btn-sm btn-primary" to="/register">Register</Link>
      </div>
    </nav>
  );
}
