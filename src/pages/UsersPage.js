import React, { useEffect, useState } from 'react';
import { userApi } from '../services/api';
import './Pages.css';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ nom: '', prenom: '', email: '', departement: '', poste: '', keycloakId: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetch = () => {
    setLoading(true);
    userApi.getAll().then(r => setUsers(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const filtered = users.filter(u =>
    !search || [u.nom, u.prenom, u.email, u.departement].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

  const deleteUser = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    await userApi.delete(id);
    fetch();
  };

  const createUser = async () => {
    if (!createForm.email || !createForm.keycloakId) { setError('Email et Keycloak ID requis.'); return; }
    setCreating(true); setError('');
    try {
      await userApi.create({ ...createForm });
      setShowCreate(false);
      setCreateForm({ nom: '', prenom: '', email: '', departement: '', poste: '', keycloakId: '' });
      fetch();
    } catch (e) { setError(e.response?.data?.message || 'Erreur lors de la création.'); }
    finally { setCreating(false); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Utilisateurs</h1>
          <p className="page-sub">{users.length} utilisateur(s) enregistré(s)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Ajouter</button>
      </div>

      <div className="filters-bar">
        <input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Utilisateur</th><th>Email</th><th>Département</th><th>Poste</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {u.prenom?.[0] || u.nom?.[0] || '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{u.prenom} {u.nom}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{u.id?.toString().slice(0, 8)}…</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 13 }}>{u.email}</td>
                <td><span style={{ fontSize: 12, background: 'var(--surface2)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>{u.departement || '—'}</span></td>
                <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.poste || '—'}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Aucun utilisateur trouvé.</div>}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nouvel Utilisateur</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label>Prénom</label><input value={createForm.prenom} onChange={e => setCreateForm(f => ({ ...f, prenom: e.target.value }))} /></div>
              <div className="form-group"><label>Nom</label><input value={createForm.nom} onChange={e => setCreateForm(f => ({ ...f, nom: e.target.value }))} /></div>
            </div>
            <div className="form-group"><label>Email *</label><input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="form-group"><label>Keycloak ID *</label><input value={createForm.keycloakId} onChange={e => setCreateForm(f => ({ ...f, keycloakId: e.target.value }))} placeholder="UUID Keycloak" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label>Département</label><input value={createForm.departement} onChange={e => setCreateForm(f => ({ ...f, departement: e.target.value }))} /></div>
              <div className="form-group"><label>Poste</label><input value={createForm.poste} onChange={e => setCreateForm(f => ({ ...f, poste: e.target.value }))} /></div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={createUser} disabled={creating}>{creating ? 'Création…' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
