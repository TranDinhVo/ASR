import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// ─── Attach JWT token ──────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('asr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Handle 401 ───────────────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('asr_token');
      localStorage.removeItem('asr_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyEmail: (token) => api.get(`/auth/verify/${token}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  getMe: () => api.get('/auth/me'),
};

// ─── Jobs ──────────────────────────────────────────────────────────────────────
export const jobsAPI = {
  upload: (formData, onProgress) =>
    api.post('/jobs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600000, // 10 phút cho upload lớn
      onUploadProgress: (e) => {
        if (onProgress) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(pct);
        }
      },
    }),

  getJob: (id) => api.get(`/jobs/${id}`),

  getJobs: (params) => api.get('/jobs', { params }),

  deleteJob: (id) => api.delete(`/jobs/${id}`),

  updateJob: (id, data) => api.patch(`/jobs/${id}`, data),
};

export default api;
