import { api } from './config';

// Get single contest details
export const getContestDetails = async (contestId) => {
  try {
    const response = await api.get(`/api/contests/${contestId}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all contests
export const getAllContests = async () => {
  try {
    const response = await api.get('/api/contests/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create a new contest
export const createContest = async (contestData) => {
  try {
    const response = await api.post('/api/contests/', contestData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a contest
export const updateContest = async (contestId, contestData) => {
  try {
    const response = await api.put(`/api/contests/${contestId}/`, contestData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a contest
export const deleteContest = async (contestId) => {
  try {
    const response = await api.delete(`/api/contests/${contestId}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Check contest eligibility
export const checkContestEligibility = async (contestId) => {
  try {
    const response = await api.get(`/api/contests/${contestId}/check-eligibility/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Toggle contest sharing
export const toggleContestSharing = async (contestId) => {
  try {
    const response = await api.post(`/api/contests/${contestId}/toggle-sharing/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
