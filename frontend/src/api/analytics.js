import { default as api } from './api';

// Submission Analytics APIs
export const getSubmissionAnalytics = (params = {}) => {
  return api.get('/analytics/submissions/', { params });
};

export const getSubmissionStatistics = (contestId) => {
  return api.get('/analytics/submissions/statistics/', {
    params: { contest_id: contestId }
  });
};

export const getUserSubmissionSummary = (contestId) => {
  return api.get('/analytics/submissions/user_summary/', {
    params: { contest_id: contestId }
  });
};

export const detectPlagiarism = (problemId, threshold = 0.7) => {
  return api.post('/analytics/plagiarism/detect/', {
    problem_id: problemId,
    similarity_threshold: threshold
  });
};

// User Activity APIs
export const getUserActivities = (params = {}) => {
  return api.get('/analytics/activities/', { params });
};

export const getSuspiciousActivities = (contestId) => {
  return api.get('/analytics/activities/suspicious/', {
    params: { contest_id: contestId }
  });
};

// Plagiarism Check APIs
export const getPlagiarismChecks = (params = {}) => {
  return api.get('/analytics/plagiarism/checks/', { params });
};

export const getHighSimilaritySubmissions = (threshold = 70) => {
  return api.get('/analytics/plagiarism/high-similarity/', {
    params: { threshold }
  });
};

export const markPlagiarismReviewed = (checkId) => {
  return api.patch(`/analytics/plagiarism/checks/${checkId}/mark-reviewed/`);
};
