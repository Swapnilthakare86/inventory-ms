import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiGrid, FiBox, FiTag, FiShoppingCart, FiTruck,
  FiUsers, FiUser, FiLogOut, FiMenu
} from 'react-icons/fi';

const roleBadgeColor = { admin: 'danger', staff: 'info', user: 'success' };

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <FiGrid /> },
    { to: '/admin/products',  label: 'Products',  icon: <FiBox /> },
    { to: '/admin/categories',label: 'Categories',icon: <FiTag /> },
    { to: '/admin/orders',    label: 'Orders',    icon: <FiShoppingCart /> },
    { to: '/admin/suppliers', label: 'Suppliers', icon: <FiTruck /> },
    { to: '/admin/users',     label: 'Users',     icon: <FiUsers /> },
    { to: '/admin/profile',   label: 'Profile',   icon: <FiUser /> },
  ];

  const staffLinks = [
    { to: '/staff/dashboard', label: 'Dashboard', icon: <FiGrid /> },
    { to: '/staff/products',  label: 'Products',  icon: <FiBox /> },
    { to: '/staff/orders',    label: 'Orders',    icon: <FiShoppingCart /> },
    { to: '/staff/profile',   label: 'Profile',   icon: <FiUser /> },
  ];

  const userLinks = [
    { to: '/user/products', label: 'Products', icon: <FiBox /> },
    { to: '/user/orders',   label: 'Orders',   icon: <FiShoppingCart /> },
    { to: '/user/profile',  label: 'Profile',  icon: <FiUser /> },
  ];

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'staff' ? staffLinks : userLinks;
  const w = collapsed ? 64 : 220;

  return (
    <div
      className="d-flex flex-column"
      style={{ width: w, height: '100vh', position: 'sticky', top: 0, background: '#1a1f2e', overflowY: 'auto', flexShrink: 0, transition: 'width 0.2s' }}
    >
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between px-3 py-3 border-bottom border-secondary">
        {!collapsed && <span className="text-white fw-semibold small">Inventory MS</span>}
        <button className="btn btn-sm p-0 text-white-50 ms-auto" onClick={() => setCollapsed(c => !c)}>
          <FiMenu size={18} />
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-grow-1 py-2">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            title={collapsed ? link.label : ''}
            className={({ isActive }) =>
              `d-flex align-items-center gap-2 px-3 py-2 text-decoration-none small ${isActive ? 'text-white' : 'text-white-50'}`
            }
            style={({ isActive }) => ({
              borderLeft: isActive ? '3px solid #3d82f5' : '3px solid transparent',
              background: 'transparent',
            })}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>{link.icon}</span>
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/*logout */}
      <div className="p-3 border-secondary">  
        <button
          className="btn btn-sm btn-outline-secondary text-white w-100 d-flex align-items-center justify-content-center gap-2"
          onClick={handleLogout}
          title="Logout"
        >
          <FiLogOut size={14} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
