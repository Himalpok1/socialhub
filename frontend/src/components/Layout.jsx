import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/', icon: '🏠', label: 'Dashboard', end: true },
  { to: '/posts', icon: '📝', label: 'Posts' },
  { to: '/compose', icon: '✏️', label: 'Compose' },
  { to: '/calendar', icon: '📅', label: 'Calendar' },
  { to: '/accounts', icon: '🔗', label: 'Accounts' },
  { to: '/analytics', icon: '📊', label: 'Analytics' },
];

const pageTitles = {
  '/': { title: 'Dashboard', subtitle: "Here's what's happening today" },
  '/posts': { title: 'Posts', subtitle: 'Manage and track all your posts' },
  '/compose': { title: 'Compose', subtitle: 'Create a new post' },
  '/calendar': { title: 'Calendar', subtitle: 'View your scheduled content' },
  '/accounts': { title: 'Accounts', subtitle: 'Manage connected social media accounts' },
  '/analytics': { title: 'Analytics', subtitle: 'Track your performance across platforms' },
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const path = window.location.pathname;
  const pageInfo = pageTitles[path] || pageTitles['/'];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🚀</div>
          <span className="logo-text">SocialHub</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="account-card" style={{ padding: 'var(--space-3)', border: 'none', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
            <div className="avatar" style={{ fontSize: '0.75rem' }}>{initials}</div>
            <div className="account-card-info">
              <div className="account-card-name" style={{ fontSize: '0.8125rem' }}>{user?.name}</div>
              <div className="account-card-handle" style={{ fontSize: '0.7rem' }}>{user?.email}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Logout">⏻</button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="main-area">
        <header className="header">
          <div className="header-left">
            <h2>{pageInfo.title}</h2>
            <p>{pageInfo.subtitle}</p>
          </div>
          <div className="header-right">
            <NavLink to="/compose" className="btn btn-primary btn-sm">
              <span>✏️</span> New Post
            </NavLink>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
