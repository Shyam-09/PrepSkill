import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://prepskill.com';

export const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('accessToken');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

let refreshing = false;
let queue: { res: (t: string) => void; rej: (e: any) => void }[] = [];
const flush = (err: any, token: string | null) => {
  queue.forEach(p => token ? p.res(token) : p.rej(err));
  queue = [];
};

api.interceptors.response.use(r => r, async err => {
  const orig = err.config;
  if (err.response?.status === 401 && !orig._retry) {
    if (refreshing) return new Promise((res, rej) => queue.push({ res, rej })).then(t => { orig.headers.Authorization = `Bearer ${t}`; return api(orig); });
    orig._retry = true; refreshing = true;
    try {
      const rt = localStorage.getItem('refreshToken');
      const { data } = await axios.post(`${BASE}/api/auth/refresh-token`, { refreshToken: rt });
      const t = data.data.accessToken;
      localStorage.setItem('accessToken', t);
      flush(null, t); orig.headers.Authorization = `Bearer ${t}`;
      return api(orig);
    } catch (e) {
      flush(e, null);
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(e);
    } finally { refreshing = false; }
  }
  return Promise.reject(err);
});

export const authApi = {
  register: (d: { name: string; email: string; password: string }) => api.post('/api/auth/register', d),
  login: (d: { email: string; password: string }) => api.post('/api/auth/login', d),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/users/me'),
};

export const contentApi = {
  getCategories: () => api.get('/api/content/categories'),
  getSheets: (p?: { categoryId?: string; difficulty?: string }) => api.get('/api/content/sheets', { params: p }),
  getSheetById: (id: string) => api.get(`/api/content/sheets/${id}`),
  getTopicsBySheet: (sid: string) => api.get(`/api/content/topics/sheet/${sid}`),
  getProblems: (p?: { sheetId?: string; topicId?: string; difficulty?: string }) => api.get('/api/content/problems', { params: p }),
};

export const progressApi = {
  getUserProgress: (uid: string) => api.get(`/api/progress/${uid}`),
  getUserStats: (uid: string) => api.get(`/api/progress/${uid}/stats`),
  getSheetProgress: (uid: string, sid: string) => api.get(`/api/progress/${uid}/sheet/${sid}`),
  markSolved: (d: { problemId: string; sheetId: string; topicId: string; difficulty: string; notes?: string; isRevision?: boolean }) => api.post('/api/progress/solve', d),
  unmarkSolved: (pid: string) => api.delete(`/api/progress/solve/${pid}`),
};

export const mockApi = {
  getTests: (p?: { category?: string; difficulty?: string }) => api.get('/api/mock/tests', { params: p }),
  getTestById: (id: string) => api.get(`/api/mock/tests/${id}`),
  getLeaderboard: (tid: string) => api.get(`/api/mock/leaderboard/${tid}`),
  startAttempt: (d: { testId: string }) => api.post('/api/mock/attempts/start', d),
  submitAttempt: (id: string, d: { answers: { questionId: string; selectedOption: number }[] }) => api.post(`/api/mock/attempts/${id}/submit`, d),
  getMyAttempts: () => api.get('/api/mock/attempts/me'),
  getAttemptById: (id: string) => api.get(`/api/mock/attempts/${id}`),
};

export const interviewApi = {
  getInterviews: (p?: { company?: string; outcome?: string; yoe?: string }) => api.get('/api/interviews', { params: p }),
  getCompanies: () => api.get('/api/interviews/companies'),
  getMyInterviews: () => api.get('/api/interviews/me'),
  getById: (id: string) => api.get(`/api/interviews/${id}`),
  create: (d: any) => api.post('/api/interviews', d),
  update: (id: string, d: any) => api.put(`/api/interviews/${id}`, d),
  delete: (id: string) => api.delete(`/api/interviews/${id}`),
  upvote: (id: string) => api.post(`/api/interviews/${id}/upvote`),
};

export const analyticsApi = {
  getDashboard: () => api.get('/api/analytics/dashboard'),
  getLeaderboard: () => api.get('/api/analytics/leaderboard'),
  getSheetLeaderboard: (sid: string) => api.get(`/api/analytics/leaderboard/sheet/${sid}`),
  getUserAnalytics: (uid: string) => api.get(`/api/analytics/users/${uid}`),
  getUserHeatmap: (uid: string) => api.get(`/api/analytics/users/${uid}/heatmap`),
};
