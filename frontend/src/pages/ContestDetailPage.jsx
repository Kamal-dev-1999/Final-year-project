import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Alert,
  Tabs,
  Tab,
  Container,
  Stack,
  Divider,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShareIcon from '@mui/icons-material/Share';
import CheckIcon from '@mui/icons-material/Check';
import AddProblemsForm from '../components/AddProblemsForm';
import SubmissionAnalytics from '../components/SubmissionAnalytics';
import UserMonitoring from '../components/UserMonitoring';
import SecurityDashboard from '../components/SecurityDashboard';
import { getContestDetail } from '../api/api';
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`contest-tabpanel-${index}`}
      aria-labelledby={`contest-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ORANGE = '#FFA116';
const DARK = '#262626';

export default function ContestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleShareContest = async () => {
    try {
      // Always try to enable/get sharing link first
      const response = await fetch(`/api/contests/${id}/enable_sharing/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to enable sharing');
      }
      
      const data = await response.json();
      if (!data.share_link) {
        throw new Error('No share link generated');
      }

      // Update contest state with new share data
      setContest(prev => ({
        ...prev,
        share_enabled: true,
        share_link: data.share_link
      }));

      // Generate shareable link using the encrypted share_link
      const shareLink = `${window.location.origin}/contests/share/${data.share_link}`;
      await navigator.clipboard.writeText(shareLink);
      setSnackbarMessage('Secure contest link copied to clipboard!');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Sharing error:', err);
      setSnackbarMessage('Failed to generate/copy link. Please try again.');
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    const fetchContestDetail = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await getContestDetail(id);
        setContest(response);
        
        // Check if the user is an admin or the contest creator
        const userJson = localStorage.getItem('user');
        console.log('Raw user from localStorage:', userJson); // Debug log
        
        if (userJson) {
          const user = JSON.parse(userJson);
          console.log('Parsed user object:', user); // Debug log
          
          const isUserAdmin = user.role === 'ADMIN';
          const isUserCreator = response.created_by && response.created_by.id === user.id;
          
          // Debug logs
          console.log('========== DEBUG INFO ==========');
          console.log('User role from localStorage:', user.role);
          console.log('Is user admin?', isUserAdmin);
          console.log('Is user creator?', isUserCreator);
          console.log('User ID:', user.id);
          console.log('Creator ID:', response.created_by?.id);
          console.log('Contest created_by object:', response.created_by);
          
          const shouldShowAdmin = isUserAdmin || isUserCreator;
          console.log('Should show admin options?', shouldShowAdmin);
          console.log('Current isAdmin state:', isAdmin);
          console.log('================================');
          
          // Set admin state and force a re-render
          console.log('Setting isAdmin to:', shouldShowAdmin);
          setIsAdmin(shouldShowAdmin);
          
          // If user is admin but not seeing admin options, log more details
          if (isUserAdmin && !shouldShowAdmin) {
            console.error('Admin user not seeing admin options!');
            console.error('User role:', user.role);
            console.error('Created by match:', response.created_by && response.created_by.id === user.id);
          }
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching contest details:', err);
        setError(err.response?.data?.detail || 'Failed to load contest details');
      } finally {
        setLoading(false);
      }
    };

    fetchContestDetail();
  }, [id]);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
        sx={{ backgroundColor: '#F7F9FC' }}
      >
        <CircularProgress sx={{ color: ORANGE }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button
          onClick={() => navigate('/contests')}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Back to Contests
        </Button>
      </Box>
    );
  }

  if (!contest) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>Contest not found</Alert>
        <Button
          onClick={() => navigate('/contests')}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Back to Contests
        </Button>
      </Box>
    );
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return { bg: '#E7F7ED', color: '#2D7738' };
      case 'Medium':
        return { bg: '#FFF4E5', color: '#B76E00' };
      case 'Hard':
        return { bg: '#FEECEC', color: '#C62828' };
      default:
        return { bg: '#F0F2F5', color: '#666' };
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#F7F9FC',
      pb: 4
    }}>
      <Box sx={{ p: 3 }}>
        {/* Header Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 3,
            border: '1px solid #E0E3E7',
            backgroundColor: '#fff',
            mb: 3,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 3 }}>
            {/* Navigation and Title */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Button
                onClick={() => navigate('/contests')}
                startIcon={<ArrowBackIcon />}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                }}
              >
                Back
              </Button>
              <Typography variant="h4" sx={{ color: DARK, fontWeight: 700, flex: 1 }}>
                {contest.title}
              </Typography>
              {isAdmin && (
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    onClick={handleShareContest}
                    startIcon={<ShareIcon />}
                    sx={{
                      borderColor: ORANGE,
                      color: ORANGE,
                      '&:hover': { 
                        backgroundColor: 'rgba(255, 161, 22, 0.04)',
                        borderColor: ORANGE 
                      },
                      px: 3,
                      py: 1
                    }}
                  >
                    Share Contest
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setActiveTab(1)}
                    sx={{
                      backgroundColor: ORANGE,
                      '&:hover': { backgroundColor: '#e59114' },
                      px: 3,
                      py: 1
                    }}
                  >
                    Add Problems
                  </Button>
                </Stack>
              )}
            </Stack>
            
            {/* Contest Info Grid */}
            <Grid container spacing={4}>
              <Grid item xs={12} lg={8}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'text.secondary',
                    lineHeight: 1.7,
                    fontSize: '1.1rem'
                  }}
                >
                  {contest.description}
                </Typography>
              </Grid>
              <Grid item xs={12} lg={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    backgroundColor: '#F8F9FA',
                    border: '1px solid #E0E3E7',
                    borderRadius: 2
                  }}
                >
                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon sx={{ color: ORANGE, mr: 2, fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Start Time
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatDateTime(contest.start_time)}
                        </Typography>
                      </Box>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon sx={{ color: ORANGE, mr: 2, fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          End Time
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatDateTime(contest.end_time)}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Tabs for Admin */}
        {isAdmin && (
          <Paper 
            elevation={0} 
            sx={{ 
              borderRadius: 3,
              border: '1px solid #E0E3E7',
              backgroundColor: '#fff',
              mb: 3
            }}
          >
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{
                px: 3,
                '& .MuiTab-root': { 
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  minHeight: 64,
                  px: 4
                },
                '& .MuiTab-root.Mui-selected': { color: ORANGE },
                '& .MuiTabs-indicator': { backgroundColor: ORANGE, height: 3 }
              }}
            >
              <Tab label="Problems" />
              <Tab label="Manage Problems" />
              <Tab label="Submission Analytics" />
              <Tab label="User Monitoring" />
              <Tab label="Security Dashboard" />
            </Tabs>
          </Paper>
        )}

        {/* Problems List */}
        {(!isAdmin || activeTab === 0) && (
          <Box>
            {contest.problems && contest.problems.length > 0 ? (
              <Stack spacing={3}>
                {contest.problems.map((problem, index) => (
                  <Card
                    key={problem.id || index}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid #E0E3E7',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      '&:hover': {
                        borderColor: ORANGE,
                        boxShadow: '0 4px 16px rgba(255, 161, 22, 0.15)',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.3s ease'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Grid container spacing={3} alignItems="flex-start">
                        <Grid item xs={12} lg={8}>
                          <Stack spacing={2}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box
                                sx={{
                                  backgroundColor: '#F0F2F5',
                                  color: 'text.secondary',
                                  px: 2,
                                  py: 1,
                                  borderRadius: 2,
                                  fontWeight: 600,
                                  minWidth: 40,
                                  textAlign: 'center'
                                }}
                              >
                                {index + 1}
                              </Box>
                              <Typography 
                                variant="h5" 
                                sx={{ 
                                  color: DARK, 
                                  fontWeight: 700,
                                  flex: 1
                                }}
                              >
                                {problem.title}
                              </Typography>
                            </Box>
                            <Typography 
                              variant="body1" 
                              color="text.secondary"
                              sx={{ 
                                lineHeight: 1.7,
                                fontSize: '1rem'
                              }}
                            >
                              {problem.statement}
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} lg={4}>
                          <Stack 
                            direction="row" 
                            spacing={2}
                            sx={{ 
                              justifyContent: { xs: 'flex-start', lg: 'flex-end' },
                              flexWrap: 'wrap',
                              gap: 1
                            }}
                          >
                            <Chip
                              label={`${problem.points} points`}
                              sx={{
                                backgroundColor: '#FFF8F0',
                                color: DARK,
                                fontWeight: 600,
                                '& .MuiChip-label': { pl: 1.5 }
                              }}
                            />
                            <Chip
                              label={problem.difficulty}
                              sx={{
                                backgroundColor: getDifficultyColor(problem.difficulty).bg,
                                color: getDifficultyColor(problem.difficulty).color,
                                fontWeight: 600
                              }}
                            />
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Paper 
                elevation={0} 
                sx={{ 
                  textAlign: 'center',
                  py: 8,
                  px: 4,
                  backgroundColor: '#fff',
                  borderRadius: 3,
                  border: '2px dashed #E0E3E7'
                }}
              >
                <Typography 
                  variant="h6" 
                  color="text.secondary" 
                  sx={{ mb: 2 }}
                >
                  No problems have been added to this contest yet.
                </Typography>
                {isAdmin && (
                  <Button
                    variant="outlined"
                    onClick={() => setActiveTab(1)}
                    sx={{ 
                      mt: 2,
                      color: ORANGE,
                      borderColor: ORANGE,
                      px: 4,
                      py: 1.5,
                      '&:hover': {
                        borderColor: ORANGE,
                        backgroundColor: 'rgba(255, 161, 22, 0.04)'
                      }
                    }}
                  >
                    Add Problems
                  </Button>
                )}
              </Paper>
            )}
          </Box>
        )}

        {/* Problem Management Section */}
        {isAdmin && activeTab === 1 && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              backgroundColor: '#fff',
              border: '1px solid #E0E3E7',
              borderRadius: 3
            }}
          >
            <AddProblemsForm 
              contestId={id} 
              onSuccess={() => {
                const fetchContestDetail = async () => {
                  const response = await getContestDetail(id);
                  setContest(response.data);
                  setActiveTab(0); // Switch back to problems tab
                };
                fetchContestDetail();
              }}
            />
          </Paper>
        )}

        {/* Submission Analytics Section */}
        {isAdmin && activeTab === 2 && (
          <Paper 
            elevation={0} 
            sx={{ 
              backgroundColor: '#fff',
              border: '1px solid #E0E3E7',
              borderRadius: 3
            }}
          >
            <SubmissionAnalytics contestId={id} />
          </Paper>
        )}

        {/* User Monitoring Section */}
        {isAdmin && activeTab === 3 && (
          <Paper 
            elevation={0} 
            sx={{ 
              backgroundColor: '#fff',
              border: '1px solid #E0E3E7',
              borderRadius: 3
            }}
          >
            <UserMonitoring contestId={id} />
          </Paper>
        )}

        {/* Security Dashboard Section */}
        {isAdmin && activeTab === 4 && (
          <Paper 
            elevation={0} 
            sx={{ 
              backgroundColor: '#fff',
              border: '1px solid #E0E3E7',
              borderRadius: 3
            }}
          >
            <SecurityDashboard contestId={id} />
          </Paper>
        )}
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
} 