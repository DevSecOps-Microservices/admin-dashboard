import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { incidentApi } from '../services/api';
import './Pages.css';

const STATUSES   = ['NOUVEAU', 'ASSIGNE', 'EN_COURS', 'RESOLU', 'FERME'];
// FIX: added 'NORMALE' so the full set matches the DB CHECK constraint
const PRIORITIES = ['CRITIQUE', 'HAUTE', 'NORMALE', 'BASSE'];

// FIX: default priorite is now 'CRITIQUE' (first item in PRIORITIES) so the
//      controlled <select> and the state value are always in sync
const EMPTY_CREATE = { titre: '', description: '', priorite: 'CRITIQUE' };

export default function IncidentsPage() {
  const [incidents, setIncidents]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPrio, setFilterPrio]   = useState('ALL');
  const [search, setSearch]           = useState('');
  const [editId, setEditId]           = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [saving, setSaving]           = useState(false);
  const [showCreate, setShowCreate]   = useState(false);
  const [createForm, setCreateForm]   = useState(EMPTY_CREATE);
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState('');   // FIX: surface errors to user

  const load = () => {
    setLoading(true);
    incidentApi.getAll()
        .then(r => setIncidents(r.data))
        .catch(console.error)
        .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = incidents
      .filter(i => filterStatus === 'ALL' || i.statut?.code === filterStatus)
      .filter(i => filterPrio   === 'ALL' || i.priorite === filterPrio)
      .filter(i => !search || i.titre?.toLowerCase().includes(search.toLowerCase()));

  const startEdit = (inc) => {
    setEditId(inc.id);
    setEditForm({ titre: inc.titre, description: inc.description, priorite: inc.priorite, statut: inc.statut });
  };

  const saveEdit = async () => {
    setSaving(true);
    try { await incidentApi.update(editId, { ...editForm }); setEditId(null); load(); }
    catch (e) { console.error(e); }
    finally   { setSaving(false); }
  };

  const deleteInc = async (id) => {
    if (!window.confirm('Supprimer cet incident ?')) return;
    await incidentApi.delete(id);
    load();
  };

  const createIncident = async () => {
    // FIX: client-side guard — titre is mandatory
    if (!createForm.titre.trim()) { setCreateError('Le titre est obligatoire.'); return; }
    setCreating(true);
    setCreateError('');
    try {
      await incidentApi.create(createForm);
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE);
      load();
    } catch (e) {
      // FIX: show the server error instead of silently swallowing it
      setCreateError(e.response?.data?.message || `Erreur ${e.response?.status ?? ''} — vérifiez les champs.`);
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Gestion des Incidents</h1>
            <p className="page-sub">{filtered.length} incident(s) affiché(s)</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowCreate(true); setCreateError(''); }}>+ Créer</button>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} className="search-inp" style={{ maxWidth: 220 }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="ALL">Tous les statuts</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select value={filterPrio} onChange={e => setFilterPrio(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="ALL">Toutes priorités</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="table-container">
          <table>
            <thead>
            <tr>
              <th>ID</th><th>Titre</th><th>Priorité</th><th>Statut</th><th style={{ width: 150 }}>Actions</th>
            </tr>
            </thead>
            <tbody>
            {filtered.map(inc => (
                editId === inc.id ? (
                    <tr key={inc.id} style={{ background: '#f8f8fc' }}>
                      <td><span style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>#{inc.id}</span></td>
                      <td>
                        <input value={editForm.titre} onChange={e => setEditForm(f => ({ ...f, titre: e.target.value }))} style={{ marginBottom: 4 }} />
                        <input value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
                      </td>
                      <td>
                        <select value={editForm.priorite} onChange={e => setEditForm(f => ({ ...f, priorite: e.target.value }))}>
                          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td>
                        <select
                            value={editForm.statut?.code || 'NOUVEAU'}
                            onChange={e => setEditForm(f => ({ ...f, statut: { code: e.target.value, libelle: e.target.options[e.target.selectedIndex].text } }))}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>{saving ? '…' : '✓'}</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}>✕</button>
                        </div>
                      </td>
                    </tr>
                ) : (
                    <tr key={inc.id}>
                      <td><span style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontSize: 12 }}>#{inc.id}</span></td>
                      <td>
                        <Link to={`/incidents/${inc.id}`} style={{ fontWeight: 600, color: 'var(--text)' }}>{inc.titre}</Link>
                        {inc.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{inc.description.slice(0, 60)}{inc.description.length > 60 ? '…' : ''}</p>}
                      </td>
                      <td><span className={`badge badge-${inc.priorite?.toLowerCase()}`}>{inc.priorite}</span></td>
                      <td><span className={`badge badge-${inc.statut?.code?.toLowerCase()}`}>{inc.statut?.libelle || 'N/A'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => startEdit(inc)}>✏</button>
                          <Link to={`/incidents/${inc.id}`} className="btn btn-secondary btn-sm">→</Link>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteInc(inc.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                )
            ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="empty-state" style={{ padding: 40, textAlign: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Aucun incident trouvé.</p></div>}
        </div>

        {/* Create Modal */}
        {showCreate && (
            <div className="modal-overlay" onClick={() => setShowCreate(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title">Nouvel Incident</h2>
                  <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
                </div>

                {/* FIX: error banner inside the modal */}
                {createError && (
                    <div className="alert alert-danger" style={{ marginBottom: 16 }}>{createError}</div>
                )}

                <div className="form-group">
                  <label>Titre *</label>
                  <input
                      value={createForm.titre}
                      onChange={e => setCreateForm(f => ({ ...f, titre: e.target.value }))}
                      placeholder="Titre de l'incident"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                      value={createForm.description}
                      onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                      rows={3}
                      placeholder="Description détaillée"
                  />
                </div>
                <div className="form-group">
                  <label>Priorité</label>
                  {/* FIX: value is now always one of the four valid DB values */}
                  <select
                      value={createForm.priorite}
                      onChange={e => setCreateForm(f => ({ ...f, priorite: e.target.value }))}
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Annuler</button>
                  <button
                      className="btn btn-primary"
                      onClick={createIncident}
                      disabled={creating || !createForm.titre.trim()}
                  >
                    {creating ? 'Création…' : 'Créer'}
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}