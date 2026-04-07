import { useAuth } from '../context/AuthContext';

const roleColor = { admin: '#e24b4a', staff: '#3d82f5', user: '#22b566' };

export default function Header() {
  const { user } = useAuth();
  const color = roleColor[user?.role] || '#3d82f5';

  return (
    <div className="header">
      <div className="header__welcome">
        Welcome back, <strong>{user?.name}</strong>
      </div>
      <div className="header__right">
        <div className="header__avatar" style={{ background: color }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="header__user-name">{user?.name}</div>
          <span className="header__role-badge" style={{ background: color }}>
            {user?.role}
          </span>
        </div>
      </div>
    </div>
  );
}
