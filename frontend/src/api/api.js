import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle common error cases
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ------------------- Submission analytics -------------------

// Fetch submission analytics (list of submissions, can be filtered by contest_id, status, user_id, etc.)
export const getSubmissionAnalytics = async (params) => {
  try {
    const response = await api.get('/analytics/submissions/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching submission analytics:', error);
    throw error;
  }
};

// ------------------- Contest related endpoints -------------------

export const getContestList = async () => {
  try {
    const response = await api.get('/contests/');
    return response.data;
  } catch (error) {
    console.error('Error fetching contest list:', error);
    throw error;
  }
};

export const getContestDetail = async (id) => {
  try {
    const response = await api.get(`/contests/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching contest detail:', error);
    throw error;
  }
};

export const checkContestEligibility = async (contestId) => {
  try {
    const response = await api.get(`/contests/${contestId}/check_eligibility/`);
    return response.data;
  } catch (error) {
    console.error('Error checking contest eligibility:', error);
    throw error;
  }
};

export const toggleContestSharing = async (contestId) => {
  try {
    const response = await api.post(`/contests/${contestId}/toggle_sharing/`);
    return response.data;
  } catch (error) {
    console.error('Error toggling contest sharing:', error);
    throw error;
  }
};

export const createContest = async (contestData) => {
  try {
    const response = await api.post('/contests/', contestData);
    return response.data;
  } catch (error) {
    console.error('Error creating contest:', error);
    throw error;
  }
};

export const updateContest = async (contestId, contestData) => {
  try {
    const response = await api.put(`/contests/${contestId}/`, contestData);
    return response.data;
  } catch (error) {
    console.error('Error updating contest:', error);
    throw error;
  }
};

export const deleteContest = async (contestId) => {
  try {
    const response = await api.delete(`/contests/${contestId}/`);
    return response.data;
  } catch (error) {
    console.error('Error deleting contest:', error);
    throw error;
  }
};

// ------------------- Problems related endpoints -------------------

export const createProblems = async (contestId, problemsData) => {
  try {
    const response = await api.post(`/contests/${contestId}/problems/`, { problems: problemsData });
    return response.data;
  } catch (error) {
    console.error('Error creating problems:', error);
    throw error;
  }
};

export default api;
