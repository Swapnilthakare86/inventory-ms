import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/products',  label: 'Products'  },
    { to: '/admin/categories',label: 'Categories'},
    { to: '/admin/orders',    label: 'Orders'    },
    { to: '/admin/suppliers', label: 'Suppliers' },
    { to: '/admin/users',     label: 'Users'     },
    { to: '/admin/profile',   label: 'Profile'   },
  ];

  const staffLinks = [
    { to: '/staff/dashboard', label: 'Dashboard' },
    { to: '/staff/products',  label: 'Products'  },
    { to: '/staff/orders',    label: 'Orders'    },
    { to: '/staff/profile',   label: 'Profile'   },
  ];

  const userLinks = [
    { to: '/user/products', label: 'Products' },
    { to: '/user/orders',   label: 'Orders'   },
    { to: '/user/profile',  label: 'Profile'  },
  ];

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'staff' ? staffLinks : userLinks;

  return (
    <div className="d-flex flex-column" style={{ width: 220, minHeight: '100vh', background: '#1a1f2e' }}>
      <div className="p-3 border-bottom border-secondary">
        <span className="text-white fw-semibold">Inventory MS</span>
        {user?.role === 'staff' && (
          <span className="badge bg-info ms-2" style={{ fontSize: 10 }}>Staff</span>
        )}
      </div>
      <nav className="flex-grow-1 py-2">
        {links.map(link => (
          <NavLink
            key={link.to} to={link.to}
            className={({ isActive }) =>
              `d-block px-3 py-2 text-decoration-none small ${isActive ? 'text-white bg-secondary bg-opacity-25' : 'text-white-50'}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3">
        <button className="btn btn-sm btn-outline-secondary text-white w-100" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
