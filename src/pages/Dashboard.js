import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { incidentApi, userApi } from '../services/api';
import './Pages.css';

const COLORS = { NOUVEAU: '#4a3aff', ASSIGNE: '#e9c46a', EN_COURS: '#2a9d8f', RESOLU: '#43d98d', FERME: '#aaa' };
const PRIO_COLORS = { CRITIQUE: '#e63946', HAUTE: '#e9c46a', NORMALE: '#4a3aff', BASSE: '#2a9d8f' };

export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([incidentApi.getAll(), userApi.getAll()])
      .then(([inc, usr]) => { setIncidents(inc.data); setUsers(usr.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Chargement…</p></div>;

  const byStatus = ['NOUVEAU', 'ASSIGNE', 'EN_COURS', 'RESOLU', 'FERME'].map(code => ({
    name: code.replace('_', ' '),
    value: incidents.filter(i => i.statut?.code === code).length,
    color: COLORS[code],
  })).filter(d => d.value > 0);

  const byPriority = ['CRITIQUE', 'HAUTE', 'NORMALE', 'BASSE'].map(p => ({
    name: p,
    count: incidents.filter(i => i.priorite === p).length,
    color: PRIO_COLORS[p],
  }));

  const recent = [...incidents].slice(-5).reverse();

  const kpis = [
    { label: 'Total incidents', value: incidents.length, icon: '⚠', color: 'blue' },
    { label: 'En cours', value: incidents.filter(i => ['NOUVEAU','ASSIGNE','EN_COURS'].includes(i.statut?.code)).length, icon: '⏳', color: 'yellow' },
    { label: 'Résolus', value: incidents.filter(i => i.statut?.code === 'RESOLU').length, icon: '✓', color: 'green' },
    { label: 'Utilisateurs', value: users.length, icon: '👥', color: 'teal' },
  ];

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Vue d'ensemble de la plateforme de gestion des incidents</p>
        </div>
        <Link to="/incidents" className="btn btn-primary">Voir tous les incidents →</Link>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        {kpis.map(k => (
          <div key={k.label} className={`kpi-card kpi-${k.color}`}>
            <div className="kpi-icon">{k.icon}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card chart-card">
          <h3 className="chart-title">Répartition par Statut</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {byStatus.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} incidents`]} contentStyle={{ background: '#fff', border: '1px solid #e0dfd8', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3 className="chart-title">Incidents par Priorité</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byPriority} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e0dfd8', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {byPriority.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent incidents */}
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 className="chart-title" style={{ margin: 0 }}>Incidents Récents</h3>
          <Link to="/incidents" className="btn btn-secondary btn-sm">Tout voir</Link>
        </div>
        <div className="table-container" style={{ boxShadow: 'none', border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Titre</th><th>Priorité</th><th>Statut</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(inc => (
                <tr key={inc.id}>
                  <td><span style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)' }}>#{inc.id}</span></td>
                  <td style={{ maxWidth: 260 }}>
                    <span style={{ fontWeight: 600 }}>{inc.titre}</span>
                    {inc.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.description}</p>}
                  </td>
                  <td><span className={`badge badge-${inc.priorite?.toLowerCase()}`}>{inc.priorite}</span></td>
                  <td><span className={`badge badge-${inc.statut?.code?.toLowerCase()}`}>{inc.statut?.libelle}</span></td>
                  <td><Link to={`/incidents/${inc.id}`} className="btn btn-secondary btn-sm">Voir →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {recent.length === 0 && <div className="empty-state"><p>Aucun incident enregistré.</p></div>}
        </div>
      </div>
    </div>
  );
}
