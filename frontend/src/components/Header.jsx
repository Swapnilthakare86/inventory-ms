import { useAuth } from '../context/AuthContext';
import { HiOutlineArchiveBox, HiOutlineCheckBadge } from 'react-icons/hi2';

const roleColor = { admin: '#e24b4a', staff: '#3d82f5', user: '#22b566' };

export default function Header() {
  const { user } = useAuth();
  const color = roleColor[user?.role] || '#3d82f5';

  return (
    <div className="header">
      <div className="header__brand-wrap">
        <div className="header__brand-text">
          <div className="header__brand-title">Inventory MS</div>
        </div>
      </div>
      <div className="header__right">
        <div className="header__avatar" style={{ background: color }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="header__meta">
          <div className="header__user-name">{user?.name}</div>
          <span className="header__role-badge" style={{ background: color }}>
            {user?.role}
          </span>
        </div>
      </div>
    </div>
  );
}
