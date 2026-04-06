import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiBell } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import API from '../api/axios';

const pageTitle = (pathname) => {
  const map = {
    dashboard: 'Dashboard', products: 'Products', categories: 'Categories',
    orders: 'Orders', suppliers: 'Suppliers', users: 'Users', profile: 'Profile',
  };
  const last = pathname.split('/').filter(Boolean).pop();
  return map[last] || 'Dashboard';
};

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();
  const [lowStock, setLowStock] = useState([]);
  const [showBell, setShowBell] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'staff') {
      API.get('/products').then(r => {
        setLowStock(r.data.filter(p => p.stock <= 5));
      }).catch(() => {});
    }
  }, [user]);

  return (
    <div
      className="d-flex align-items-center justify-content-between px-4 py-2 border-bottom bg-white"
      style={{ height: 56, position: 'sticky', top: 0, zIndex: 100 }}
    >
      <div>
        <span className="text-muted small">Welcome back, </span>
        <span className="fw-semibold small text-dark">{user?.name}</span>
        <span className="text-muted small mx-2">/</span>
        <span className="fw-semibold small text-primary">{pageTitle(location.pathname)}</span>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Notification Bell */}
        {(user?.role === 'admin' || user?.role === 'staff') && (
          <div className="position-relative">
            <button className="btn btn-sm btn-light p-1 position-relative" onClick={() => setShowBell(s => !s)}>
              <FiBell size={18} />
              {lowStock.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: 9 }}>
                  {lowStock.length}
                </span>
              )}
            </button>
            {showBell && (
              <div className="position-absolute end-0 mt-1 bg-white border rounded shadow-sm" style={{ width: 260, zIndex: 200 }}>
                <div className="px-3 py-2 border-bottom small fw-semibold text-muted">Low Stock Alerts</div>
                {lowStock.length === 0 ? (
                  <div className="px-3 py-2 small text-muted">All products in stock ✅</div>
                ) : lowStock.map(p => (
                  <div key={p.id} className="px-3 py-2 border-bottom small d-flex justify-content-between">
                    <span>{p.name}</span>
                    <span className={`badge bg-${p.stock === 0 ? 'danger' : 'warning'}`}>{p.stock === 0 ? 'Out' : p.stock}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Avatar */}
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
    </div>
  );
}
