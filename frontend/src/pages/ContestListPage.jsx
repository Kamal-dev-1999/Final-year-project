import React, { useEffect, useState } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea, 
  Chip, 
  CircularProgress, 
  Alert,
  Stack,
  Paper,
  Avatar,
  Container
} from '@mui/material';
import { getContestList } from '../api/api';
import { Link } from 'react-router-dom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';

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

export default function ContestListPage() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);
        const res = await getContestList();
        setContests(res);
        setError(null);
      } catch (err) {
        console.error('Contest loading error:', err);
        setError(
          err.response?.data?.detail || 
          err.response?.data?.message || 
          err.message || 
          'Failed to load contests. Please ensure you are logged in and try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, []);

  if (loading) {
    return (
      <Box 
        sx={{ 
          background: LIGHT_BG, 
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <CircularProgress sx={{ color: ORANGE }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      background: LIGHT_BG, 
      minHeight: '100vh',
      width: '100%'
    }}>
      <Box sx={{ p: 3, width: '100%' }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700, 
            color: DARK,
            mb: 4,
            textAlign: 'left'
          }}
        >
          Contests
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}
        
        {!loading && !error && (
          <>
            {contests.length === 0 ? (
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
                <Typography variant="h6" color="text.secondary">
                  No contests available at the moment.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Check back later for new contests.
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ width: '100%', maxWidth: '800px' }}>
                <Stack spacing={3}>
                  {contests.map(contest => {
                    const status = getStatus(contest.start_time, contest.end_time);
                    return (
                      <Card
                        key={contest.id}
                        elevation={0}
                        sx={{
                          borderRadius: 3,
                          background: '#fff',
                          border: '1px solid #E0E3E7',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          transition: 'all 0.3s ease',
                          height: '200px',
                          width: '100%',
                          '&:hover': {
                            boxShadow: '0 4px 16px rgba(255, 161, 22, 0.15)',
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        <CardActionArea 
                          component={Link} 
                          to={`/contests/${contest.id}`} 
                          sx={{ 
                            height: '100%',
                            display: 'flex',
                            alignItems: 'stretch',
                            width: '100%'
                          }}
                        >
                          <CardContent sx={{ 
                            p: 0,
                            height: '100%',
                            display: 'flex',
                            width: '100%'
                          }}>
                            {/* Left Section - Visual/Image */}
                            <Box
                              sx={{
                                width: '200px',
                                height: '100%',
                                background: `linear-gradient(135deg, ${ORANGE}, #FF6B35, #FF8A65)`,
                                borderRadius: '12px 0 0 12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                                flexShrink: 0,
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'3\'/%3E%3Ccircle cx=\'80\' cy=\'40\' r=\'2\'/%3E%3Ccircle cx=\'40\' cy=\'80\' r=\'4\'/%3E%3Ccircle cx=\'70\' cy=\'70\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                                  opacity: 0.3,
                                }
                              }}
                            >
                              <StarIcon sx={{ color: '#fff', fontSize: 48, opacity: 0.8 }} />
                            </Box>
                            
                            {/* Right Section - Content */}
                            <Box sx={{ 
                              flex: 1, 
                              p: 3, 
                              display: 'flex', 
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              minWidth: 0
                            }}>
                              {/* Header with title and status */}
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                                  <Typography
                                    variant="h5"
                                    sx={{ 
                                      fontWeight: 700, 
                                      color: DARK, 
                                      flexGrow: 1,
                                      lineHeight: 1.3,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      minWidth: 0
                                    }}
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
                                      '& .MuiChip-label': { px: 1.5 },
                                      flexShrink: 0,
                                    }}
                                  />
                                </Box>
                                
                                {/* Description */}
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary" 
                                  sx={{ 
                                    lineHeight: 1.6,
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    mb: 2
                                  }}
                                >
                                  {contest.description}
                                </Typography>
                              </Box>
                              
                              {/* Footer with time info and user */}
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Stack spacing={1}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AccessTimeIcon sx={{ color: ORANGE, fontSize: 16 }} />
                                    <Typography variant="caption" color="text.secondary">
                                      <strong>Start:</strong> {formatDate(contest.start_time)}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AccessTimeIcon sx={{ color: ORANGE, fontSize: 16 }} />
                                    <Typography variant="caption" color="text.secondary">
                                      <strong>End:</strong> {formatDate(contest.end_time)}
                                    </Typography>
                                  </Box>
                                </Stack>
                                
                                {/* User info */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar 
                                    sx={{ 
                                      width: 32, 
                                      height: 32, 
                                      bgcolor: ORANGE,
                                      fontSize: '0.875rem'
                                    }}
                                  >
                                    A
                                  </Avatar>
                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: DARK, display: 'block' }}>
                                      Admin
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Contest Creator
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}