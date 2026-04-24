import { create } from 'zustand';

// Guest lưu jobId gần nhất vào localStorage để reload không mất
const GUEST_JOB_KEY = 'asr_guest_job_id';

const useAppStore = create((set, get) => ({
  // ─── Auth State ─────────────────────────────────────────────────────────────
  user: JSON.parse(localStorage.getItem('asr_user') || 'null'),
  token: localStorage.getItem('asr_token') || null,

  setAuth: (user, token) => {
    localStorage.setItem('asr_user', JSON.stringify(user));
    localStorage.setItem('asr_token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('asr_user');
    localStorage.removeItem('asr_token');
    set({ user: null, token: null, currentJob: null, jobs: [] });
  },

  isAuthenticated: () => !!get().token,

  // ─── Chat ────────────────────────────────────────────────────────────────────
  triggerNewChat: 0,
  startNewChat: () => set(state => ({ triggerNewChat: state.triggerNewChat + 1 })),

  // ─── Current Job (đang xử lý) ───────────────────────────────────────────────
  // Khởi tạo từ localStorage (guest reload vẫn giữ được job)
  currentJob: null,
  recentJobs: [],
  uploadProgress: 0,

  addRecentJob: (job) => {
    set((state) => {
      // Tránh trùng lặp
      if (state.recentJobs.find(j => j._id === job._id)) return state;
      return { recentJobs: [...state.recentJobs, job] };
    });
  },

  updateRecentJob: (jobId, data) => {
    set((state) => ({
      recentJobs: state.recentJobs.map(j => j._id === jobId ? { ...j, ...data } : j)
    }));
  },

  clearRecentJobs: () => set({ recentJobs: [], currentJob: null }),

  setCurrentJob: (job) => {
    // Lưu jobId để guest reload không mất
    if (job?._id) localStorage.setItem(GUEST_JOB_KEY, job._id);
    set({ currentJob: job });
  },

  setUploadProgress: (pct) => set({ uploadProgress: pct }),

  clearCurrentJob: () => {
    localStorage.removeItem(GUEST_JOB_KEY);
    set((state) => ({ 
      currentJob: null, 
      uploadProgress: 0,
      // Khi clear currentJob (ví dụ bấm "Xử lý file mới"), 
      // ta có thể chọn giữ lại recentJobs hoặc không. 
      // Ở đây ta giữ lại để tạo cảm giác chatbot.
    }));
  },

  // ─── History ─────────────────────────────────────────────────────────────────
  jobs: [],
  totalJobs: 0,
  jobsPage: 1,

  setJobs: (jobs, total, page) => set({ jobs, totalJobs: total, jobsPage: page }),

  removeJob: (id) =>
    set((state) => ({
      jobs: state.jobs.filter((j) => j._id !== id),
      totalJobs: Math.max(0, state.totalJobs - 1),
      recentJobs: state.recentJobs.filter(j => j._id !== id)
    })),

  fetchRecentJobs: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const { jobsAPI } = await import('../services/api');
      const res = await jobsAPI.getJobs({ limit: 10 });
      set({ recentJobs: res.data.jobs || [] });
    } catch (err) {
      console.error('Failed to fetch recent jobs:', err);
    }
  }

}));

export default useAppStore;
