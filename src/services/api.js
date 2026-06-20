import axios from 'axios';
import keycloak from '../keycloak';

const API_BASE = process.env.REACT_APP_API_URL || '';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    try { await keycloak.updateToken(30); }
    catch { keycloak.login(); return Promise.reject('Session expirée'); }
  }
  if (keycloak.token) config.headers.Authorization = `Bearer ${keycloak.token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      await keycloak.updateToken(30).catch(() => keycloak.login());
    }
    return Promise.reject(error);
  }
);

export const incidentApi = {
  getAll:    ()         => api.get('/api/incidents'),
  getById:   (id)       => api.get(`/api/incidents/${id}`),
  create:    (data)     => api.post('/api/incidents', data),
  update:    (id, data) => api.put(`/api/incidents/${id}`, data),
  delete:    (id)       => api.delete(`/api/incidents/${id}`),

  // ← Upload capture séparé
  uploadCapture: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/api/incidents/${id}/capture`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};
export const userApi = {
  getAll: () => api.get('/api/users'),
  getById: (id) => api.get(`/api/users/${id}`),
  create: (data) => api.post('/api/users', data),
  update: (id, data) => api.put(`/api/users/${id}`, data),
  delete: (id) => api.delete(`/api/users/${id}`),
};

export const commentApi = {
  getByIncident: (id) => api.get(`/api/commentaires/incident/${id}`),
  count: (id) => api.get(`/api/commentaires/incident/${id}/compter`),
  create: (data) => api.post('/api/commentaires', data),
  delete: (id) => api.delete(`/api/commentaires/${id}`),
};

export default api;