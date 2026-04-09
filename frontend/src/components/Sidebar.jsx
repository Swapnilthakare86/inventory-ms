import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiGrid, FiBox, FiTag, FiShoppingCart, FiTruck,
  FiUsers, FiUser, FiLogOut, FiMenu
} from 'react-icons/fi';

const roleBadgeColor = { admin: '#e24b4a', staff: '#3d82f5', user: '#22b566' };

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
    { logout: true },
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
    <div className="sidebar" style={{ width: w }}>
      <div className="sidebar__header">
        {!collapsed && <span className="sidebar__brand"></span>}
        <button className="sidebar__toggle" onClick={() => setCollapsed(c => !c)}>
          <FiMenu size={18} />
        </button>
      </div>

      <nav className="sidebar__nav">
        {links.map((link, idx) =>
          link.logout ? (
            <div className="sidebar__footer" key="logout">
              <button
                className="btn btn-sm sidebar__logout"
                onClick={handleLogout}
                title="Logout"
                style={{ background: '#e24b4a', color: '#fff', border: 'none', width: '100%', marginTop: 8 }}
              >
                <FiLogOut size={14} />
                {!collapsed && <span>Logout</span>}
              </button>
            </div>
          ) : (
            <NavLink
              key={link.to}
              to={link.to}
              title={collapsed ? link.label : ''}
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
            >
              <span className="sidebar__icon">{link.icon}</span>
              {!collapsed && <span>{link.label}</span>}
            </NavLink>
          )
        )}
      </nav>
    </div>
  );
}
