import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Attach auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const accountsApi = {
  list: () => api.get('/accounts'),
  connect: (platform) => api.post(`/accounts/connect/${platform}`),
  disconnect: (id) => api.delete(`/accounts/${id}`),
  refresh: (id) => api.post(`/accounts/${id}/refresh`),
};

export const postsApi = {
  list: (params) => api.get('/posts', { params }),
  create: (data) => api.post('/posts', data),
  get: (id) => api.get(`/posts/${id}`),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
  publish: (id) => api.post(`/posts/${id}/publish`),
  uploadMedia: (file) => {
    const formData = new FormData();
    formData.append('media', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const analyticsApi = {
  overview: (params) => api.get('/analytics', { params }),
  account: (accountId, params) => api.get(`/analytics/${accountId}`, { params }),
};

export default api;
