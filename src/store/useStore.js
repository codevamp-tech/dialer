import { create } from 'zustand';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

// Attach JWT token automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401s globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

const useStore = create((set, get) => ({
  // ─── Theme ──────────────────────────────────────────────
  theme: localStorage.getItem('dialer-theme') || 'dark',
  initTheme: () => {
    const theme = get().theme;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('dialer-theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),

  // ─── Auth ───────────────────────────────────────────────
  isAuthenticated: !!localStorage.getItem('token'),
  user: null,
  authLoading: false,
  authError: null,

  login: async (email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.accessToken);
      set({ 
        isAuthenticated: true, 
        user: res.data.user, 
        authLoading: false 
      });
      return res.data.user; // Return user object to check role for redirection
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Login failed';
      set({ authError: msg, authLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ isAuthenticated: false, user: null, campaigns: [], activeCampaign: null, activeLead: null });
    window.location.href = '/login';
  },

  createHumanAgent: async (agentData) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/create-agent`, agentData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to create agent');
    }
  },

  fetchProfile: async () => {
    try {
      const res = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      set({ user: res.data.user || res.data });
    } catch {
      // silently fail
    }
  },

  // ─── Agent Status ───────────────────────────────────────
  agentStatus: 'Available',
  setAgentStatus: (status) => set({ agentStatus: status }),

  // ─── Campaigns & Leads ─────────────────────────────────
  campaigns: [],
  campaignsLoading: false,
  activeCampaign: null,
  activeLead: null,
  callStatus: 'Idle',
  setCallStatus: (status) => set({ callStatus: status }),

  fetchCampaigns: async () => {
    set({ campaignsLoading: true });
    try {
      const res = await api.get('/dialer/campaigns');
      set({ campaigns: res.data, campaignsLoading: false });
      // Auto-select first active campaign if none selected
      if (res.data.length > 0 && !get().activeCampaign) {
        set({ activeCampaign: res.data[0] });
      }
    } catch (err) {
      console.error("Failed to fetch campaigns", err);
      set({ campaignsLoading: false });
    }
  },

  setActiveCampaign: (campaign) => set({ activeCampaign: campaign }),

  pullNextLead: async () => {
    const campaign = get().activeCampaign;
    if (!campaign) return null;

    try {
      const res = await api.get(`/dialer/campaigns/${campaign._id}/next-lead`);
      set({
        activeLead: res.data,
        callStatus: 'Ringing'
      });
      return res.data;
    } catch (err) {
      if (err.response?.status === 404) {
        throw new Error("No pending leads left in this campaign!");
      }
      throw err;
    }
  },

  endCall: () => {
    set({ callStatus: 'Wrap-up' });
  },

  submitDisposition: async (outcome, notes, dialerCallId = null, scheduledAt = null) => {
    const lead = get().activeLead;
    if (!lead) return;

    try {
      // Build API calls — always update the lead record, and also update the
      // DialerCall record if we have a callId (so both stay in sync).
      const calls = [
        api.post(`/dialer/leads/${lead._id}/disposition`, {
          statusClassification: outcome,
          remark: notes
        })
      ];

      if (dialerCallId) {
        calls.push(
          api.post(`/manual-calls/${dialerCallId}/disposition`, {
            disposition: outcome,
            notes: notes || '',
            // Pass scheduledAt so the server can re-queue 'Call Back' leads
            ...(scheduledAt ? { scheduledAt } : {})
          })
        );
      }

      await Promise.all(calls);

      set({ activeLead: null, callStatus: 'Idle' });
      // Refresh campaign list to update progress counter
      get().fetchCampaigns();
      return true;
    } catch (err) {
      console.error("Failed to submit disposition", err);
      throw err;
    }
  },

  skipLead: async () => {
    const lead = get().activeLead;
    if (!lead) return;
    try {
      await api.post(`/dialer/leads/${lead._id}/disposition`, {
        statusClassification: 'Skipped',
        remark: 'Skipped by agent'
      });
      set({ activeLead: null, callStatus: 'Idle' });
    } catch (err) {
      console.error("Failed to skip lead", err);
    }
  },

  // ─── Phone Numbers ──────────────────────────────────────
  phoneNumbers: [],
  phoneNumbersLoading: false,

  fetchPhoneNumbers: async () => {
    set({ phoneNumbersLoading: true });
    try {
      const res = await api.get('/phone-numbers');
      set({ phoneNumbers: res.data.phoneNumbers || [], phoneNumbersLoading: false });
    } catch (err) {
      console.error('Failed to fetch phone numbers', err);
      set({ phoneNumbersLoading: false });
    }
  },

  createSipTrunk: async (data) => {
    const res = await api.post('/phone-numbers/sip-trunk', data);
    get().fetchPhoneNumbers();
    return res.data;
  },

  deletePhoneNumber: async (id) => {
    await api.delete(`/phone-numbers/${id}`);
    get().fetchPhoneNumbers();
  },

  // ─── Dialer Call Logs ───────────────────────────────────
  dialerCallLogs: [],
  dialerCallLogsTotal: 0,
  dialerCallLogsLoading: false,

  fetchDialerCallLogs: async (page = 1, limit = 20, filters = {}) => {
    set({ dialerCallLogsLoading: true });
    try {
      const params = new URLSearchParams({ page, limit });
      if (filters.humanAgentId) params.set('humanAgentId', filters.humanAgentId);
      if (filters.campaignId) params.set('campaignId', filters.campaignId);
      if (filters.disposition) params.set('disposition', filters.disposition);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);

      const res = await api.get(`/dialer/call-logs?${params.toString()}`);
      set({
        dialerCallLogs: res.data.calls || [],
        dialerCallLogsTotal: res.data.totalCount || 0,
        dialerCallLogsLoading: false,
      });
    } catch (err) {
      console.error('Failed to fetch dialer call logs', err);
      set({ dialerCallLogsLoading: false });
    }
  },

  fetchDialerCallDetail: async (id) => {
    try {
      const res = await api.get(`/dialer/call-logs/${id}`);
      return res.data.call || null;
    } catch (err) {
      console.error('Failed to fetch call detail', err);
      return null;
    }
  },

  // ─── Admin: Dashboard Stats ────────────────────────────
  dashboardStats: null,
  statsLoading: false,

  fetchDashboardStats: async () => {
    set({ statsLoading: true });
    try {
      const [campaignsRes, callsRes] = await Promise.all([
        api.get('/dialer/campaigns'),
        axios.get(`${API_BASE}/calls/list?limit=1`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const campaigns = campaignsRes.data;
      const totalCalls = callsRes.data.totalCount || 0;
      const totalDuration = callsRes.data.totalDurationSeconds || 0;

      const activeCampaigns = campaigns.filter(c => c.status === 'running').length;
      const totalLeads = campaigns.reduce((sum, c) => sum + (c.totalLeads || 0), 0);
      const completedLeads = campaigns.reduce((sum, c) => sum + (c.completedLeads || 0), 0);

      set({
        dashboardStats: {
          totalCampaigns: campaigns.length,
          activeCampaigns,
          totalLeads,
          completedLeads,
          totalCalls,
          totalDuration,
          completionRate: totalLeads > 0 ? Math.round((completedLeads / totalLeads) * 100) : 0,
        },
        statsLoading: false,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
      set({ statsLoading: false });
    }
  },

  // ─── Admin: Campaign CRUD ──────────────────────────────
  createCampaign: async (data) => {
    const res = await api.post('/dialer/campaigns', data);
    get().fetchCampaigns();
    return res.data;
  },

  // ─── Admin: Campaign Detail ────────────────────────────
  campaignDetail: null,
  campaignDetailLoading: false,

  fetchCampaignDetail: async (id) => {
    set({ campaignDetailLoading: true });
    try {
      // Fetch leads for this campaign
      const campaignsRes = await api.get('/dialer/campaigns');
      const campaign = campaignsRes.data.find(c => c._id === id);
      set({ campaignDetail: campaign, campaignDetailLoading: false });
      return campaign;
    } catch (err) {
      console.error("Failed to fetch campaign detail", err);
      set({ campaignDetailLoading: false });
    }
  },

  // ─── Admin: Call Logs ──────────────────────────────────
  callLogs: [],
  callLogsTotal: 0,
  callLogsLoading: false,

  fetchCallLogs: async (page = 1, limit = 20, filters = {}) => {
    set({ callLogsLoading: true });
    try {
      const params = new URLSearchParams({ page, limit });
      if (filters.q) params.set('q', filters.q);
      if (filters.status) params.set('status', filters.status);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);

      const res = await axios.get(`${API_BASE}/calls/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      set({
        callLogs: res.data.calls || [],
        callLogsTotal: res.data.totalCount || 0,
        callLogsLoading: false,
      });
    } catch (err) {
      console.error("Failed to fetch call logs", err);
      set({ callLogsLoading: false });
    }
  },

  // ─── Admin: Agents ─────────────────────────────────────
  agents: [],
  agentsLoading: false,

  fetchAgents: async () => {
    set({ agentsLoading: true });
    try {
      const res = await axios.get(`${API_BASE}/auth/agents`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      set({ agents: res.data.agents || [], agentsLoading: false });
    } catch (err) {
      console.error("Failed to fetch agents", err);
      set({ agentsLoading: false });
    }
  },
}));

export { api, API_BASE };
export default useStore;
