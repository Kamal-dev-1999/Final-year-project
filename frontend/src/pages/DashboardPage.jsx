import React, { useEffect, useState } from 'react';
import { Typography, Box, Grid, Card, CardContent, CardActionArea, Chip, CircularProgress, Alert } from '@mui/material';
import { getContestList } from '../api/api';
import { Link } from 'react-router-dom';

const ORANGE = '#FFA116';
const DARK = '#262626';
const LIGHT_BG = '#F7F9FC';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function getStatus(start, end) {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);
  if (now < s) return { label: 'Upcoming', color: 'warning', bg: '#FFF4E5', textColor: '#B76E00' };
  if (now > e) return { label: 'Ended', color: 'default', bg: '#F0F2F5', textColor: '#666' };
  return { label: 'Ongoing', color: 'success', bg: '#E7F7ED', textColor: '#2D7738' };
}

export default function DashboardPage() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadContests = async () => {
      try {
        setLoading(true);
        const response = await getContestList();
        console.log('Contests API Response:', response);
        
        // Check if response is an array, if not try to extract data from response
        const contestsData = Array.isArray(response) ? response : response?.results || [];
        
        if (contestsData.length === 0) {
          console.warn('No contests found in the response');
        }
        
        setContests(contestsData);
      } catch (err) {
        console.error('Error loading contests:', err);
        setError('Failed to load contests. ' + (err.message || ''));
      } finally {
        setLoading(false);
      }
    };

    loadContests();
  }, []);

  return (
    <Box sx={{ background: LIGHT_BG, minHeight: '100vh', p: 3 }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: DARK, mb: 2 }}>
        Welcome to the Coding Contest Platform
      </Typography>
      <Typography variant="body1" gutterBottom sx={{ color: DARK, mb: 4 }}>
        Use the sidebar to navigate through contests, submissions, and your profile.
      </Typography>
      <Typography variant="h4" sx={{ color: DARK, fontWeight: 700, mb: 3 }}>Upcoming Contests</Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress sx={{ color: ORANGE }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : contests.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No contests found. Create a new contest to get started.
        </Alert>
      ) : (
        <Grid container spacing={3} alignItems="stretch" justifyContent="center">
          {contests.map(contest => {
            const status = getStatus(contest.start_time, contest.end_time);
            return (
              <Grid item xs={12} sm={6} md={4} key={contest.id} sx={{ display: 'flex' }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 12px 40px rgba(255, 161, 22, 0.2)',
                    },
                  }}
                >
                  <CardActionArea component={Link} to={`/contests/${contest.id}`} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', height: '100%' }}>
                    <CardContent sx={{ flexGrow: 1, minHeight: 200, display: 'flex', flexDirection: 'column', p: 3 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography
                          variant="h6"
                          component="div"
                          sx={{ fontWeight: 700, color: DARK, flexGrow: 1, transition: 'color 0.2s', '&:hover': { color: ORANGE } }}
                        >
                          {contest.title}
                        </Typography>
                        <Chip
                          label={status.label}
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            backgroundColor: status.bg,
                            color: status.textColor,
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ minHeight: 40, flexGrow: 1 }}>
                        {contest.description}
                      </Typography>
                      <Box mt="auto">
                        <Typography variant="caption" color="text.secondary" display="block">
                          <b>Start:</b> {formatDate(contest.start_time)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          <b>End:</b> {formatDate(contest.end_time)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}