import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import IncidentsPage from './pages/IncidentsPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import UsersPage from './pages/UsersPage';

const CLIENT_URL = process.env.REACT_APP_CLIENT_URL || 'http://localhost:3000';

function RoleGuard({ children, roles }) {
    const { keycloak, initialized } = useKeycloak();

    if (!initialized) return (
        <div className="loading-screen">
            <div className="spinner" /><p>Vérification des droits…</p>
        </div>
    );

    if (!keycloak.authenticated) {
        keycloak.login();
        return null;
    }

    const userRoles = keycloak.tokenParsed?.realm_access?.roles || [];

    // Plain USER with no admin/tech role → redirect to client portal
    if (!userRoles.includes('ADMIN') && !userRoles.includes('TECHNICIEN')) {
        window.location.href = CLIENT_URL;
        return null;
    }

    // Check the specific roles required for this guard instance
    const hasRole = roles.some(r => userRoles.includes(r));
    if (!hasRole) return (
        <div className="loading-screen">
            <h2 style={{ fontSize: 32 }}>⛔</h2>
            <p>Accès refusé. Rôle requis : {roles.join(', ')}</p>
        </div>
    );

    return children;
}

// Wrapper for pages that require strictly ADMIN (not TECHNICIEN)
function AdminOnly({ children }) {
    const { keycloak } = useKeycloak();
    const roles = keycloak.tokenParsed?.realm_access?.roles || [];

    if (!roles.includes('ADMIN')) return (
        <div className="loading-screen">
            <h2 style={{ fontSize: 32 }}>🔒</h2>
            <p>Cette page est réservée aux administrateurs.</p>
        </div>
    );

    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <RoleGuard roles={['ADMIN', 'TECHNICIEN']}>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/incidents" element={<IncidentsPage />} />
                        <Route path="/incidents/:id" element={<IncidentDetailPage />} />
                        {/* Users page: ADMIN only */}
                        <Route path="/users" element={
                            <AdminOnly><UsersPage /></AdminOnly>
                        } />
                    </Routes>
                </Layout>
            </RoleGuard>
        </BrowserRouter>
    );
}