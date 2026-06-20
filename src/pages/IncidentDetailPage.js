import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { incidentApi, commentApi } from '../services/api';
import './Pages.css';

const STATUSES = [
  { code: 'NOUVEAU', libelle: 'Nouveau' },
  { code: 'ASSIGNE', libelle: 'Assigné' },
  { code: 'EN_COURS', libelle: 'En cours' },
  { code: 'RESOLU', libelle: 'Résolu' },
  { code: 'FERME', libelle: 'Fermé' },
];
const PRIORITIES = ['CRITIQUE', 'HAUTE', 'NORMALE', 'BASSE'];

export default function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusChange, setStatusChange] = useState('');
  const [prioChange, setPrioChange] = useState('');
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchAll = async () => {
    const [inc, cmts] = await Promise.all([
      incidentApi.getById(id),
      commentApi.getByIncident(id).catch(() => ({ data: [] })),
    ]);
    setIncident(inc.data);
    setStatusChange(inc.data.statut?.code || 'NOUVEAU');
    setPrioChange(inc.data.priorite || 'NORMALE');
    const cmtData = cmts.data;
    setComments(cmtData?.content || (Array.isArray(cmtData) ? cmtData : []));
  };

  useEffect(() => {
    fetchAll().catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const statObj = STATUSES.find(s => s.code === statusChange);
      await incidentApi.update(id, { ...incident, statut: statObj, priorite: prioChange });
      await fetchAll();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const deleteComment = async (cid) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return;
    await commentApi.delete(cid);
    await fetchAll();
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      await commentApi.create?.({ incidentId: Number(id), auteurNom: 'Technicien', contenu: newComment });
      setNewComment('');
      await fetchAll();
    } catch (e) { console.error(e); }
    finally { setPosting(false); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!incident) return <div className="admin-page"><p>Incident non trouvé.</p></div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Retour</button>
          <h1 className="page-title" style={{ marginTop: 8 }}>#{incident.id} — {incident.titre}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <span className={`badge badge-${incident.priorite?.toLowerCase()}`}>{incident.priorite}</span>
            <span className={`badge badge-${incident.statut?.code?.toLowerCase()}`}>{incident.statut?.libelle}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        {/* Main */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 12 }}>Description</h3>
            <p style={{ lineHeight: 1.8, fontSize: 14 }}>{incident.description || 'Aucune description.'}</p>
          </div>

          {incident.captureUrl && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 12 }}>Capture d'écran</h3>
              <img src={incident.captureUrl} alt="capture" style={{ maxWidth: '100%', borderRadius: 8 }} />
            </div>
          )}

          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Commentaires ({comments.length})</h3>
            {comments.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Aucun commentaire.</p>}
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {c.auteurNom?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{c.auteurNom}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{c.dateCreation ? new Date(c.dateCreation).toLocaleString('fr-FR') : ''}</span>
                  </div>
                  <p style={{ fontSize: 13 }}>{c.contenu}</p>
                </div>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteComment(c.id)}>🗑</button>
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div>
          <div className="card">
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 16 }}>Modifier</h3>
            <div className="form-group">
              <label>Statut</label>
              <select value={statusChange} onChange={e => setStatusChange(e.target.value)}>
                {STATUSES.map(s => <option key={s.code} value={s.code}>{s.libelle}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priorité</label>
              <select value={prioChange} onChange={e => setPrioChange(e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={save} disabled={saving}>
              {saving ? 'Sauvegarde…' : '✓ Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
