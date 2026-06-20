import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import './Layout.css';

const NavItem = ({ to, icon, label, count }) => {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== '/dashboard' && pathname.startsWith(to));
  return (
    <Link to={to} className={`nav-item ${active ? 'active' : ''}`}>
      <span className="nav-icon">{icon}</span>
      <span className="nav-label">{label}</span>
      {count != null && <span className="nav-count">{count}</span>}
    </Link>
  );
};

export default function Layout({ children }) {
  const { keycloak } = useKeycloak();
  const user = keycloak.tokenParsed;
  const roles = user?.realm_access?.roles || [];
  const isAdmin = roles.includes('ADMIN');

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">⚡</div>
          <div>
            <div className="brand-name">IncidentHub</div>
            <div className="brand-role">{isAdmin ? 'Admin Panel' : 'Technicien'}</div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Navigation</div>
          <NavItem to="/dashboard" icon="◉" label="Dashboard" />
          <NavItem to="/incidents" icon="⚠" label="Incidents" />
          {isAdmin && <NavItem to="/users" icon="👥" label="Utilisateurs" />}
        </div>

        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="user-avatar-admin">
              {user?.given_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.given_name || user?.preferred_username}</span>
              <span className="user-role-badge">{isAdmin ? 'Admin' : 'Technicien'}</span>
            </div>
            <button className="logout-btn" onClick={() => keycloak.logout()} title="Déconnexion">
              ⎋
            </button>
          </div>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <div className="breadcrumb">
              {window.location.pathname.slice(1).split('/').map((seg, i) => (
                <span key={i}>{i > 0 && ' / '}{seg.charAt(0).toUpperCase() + seg.slice(1)}</span>
              ))}
            </div>
          </div>
          <div className="topbar-right">
            <div className="status-dot" title="Services opérationnels" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tous les services actifs</span>
          </div>
        </header>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
