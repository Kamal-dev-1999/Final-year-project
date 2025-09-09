import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar,
  DialogActions,
  Button,
  IconButton
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TimerIcon from '@mui/icons-material/Timer';
import { getUserSubmissionSummary, getUserActivities } from '../api/analytics';

const ORANGE = '#FFA116';
const DARK = '#262626';

export default function UserMonitoring({ contestId }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivities, setUserActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityDialog, setActivityDialog] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [contestId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await getUserSubmissionSummary(contestId);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewUserActivity = async (user) => {
    try {
      setSelectedUser(user);
      const response = await getUserActivities({ user_id: user.user_id });
      setUserActivities(response.data.results || response.data);
      setActivityDialog(true);
    } catch (error) {
      console.error('Error fetching user activities:', error);
    }
  };

  const getRiskLevel = (score) => {
    if (score >= 70) return { label: 'High Risk', color: '#C62828', bg: '#FEECEC' };
    if (score >= 40) return { label: 'Medium Risk', color: '#B76E00', bg: '#FFF4E5' };
    return { label: 'Low Risk', color: '#2D7738', bg: '#E7F7ED' };
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: ORANGE }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E0E3E7' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: ORANGE, fontWeight: 700 }}>
                {users.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E0E3E7' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#C62828', fontWeight: 700 }}>
                {users.filter(u => u.suspicious_activity_score >= 70).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High Risk Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E0E3E7' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#B76E00', fontWeight: 700 }}>
                {users.filter(u => u.flagged_for_plagiarism).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Plagiarism Flags
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E0E3E7' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#2D7738', fontWeight: 700 }}>
                {Math.round(users.reduce((acc, u) => acc + (u.accepted_count / u.total_submissions * 100 || 0), 0) / users.length || 0)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Success Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Users Table */}
      <Paper sx={{ borderRadius: 3, border: '1px solid #E0E3E7' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F8F9FA' }}>
                <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Submissions</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Success Rate</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Avg Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Security Events</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Risk Level</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>IP Addresses</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => {
                const successRate = user.total_submissions > 0 
                  ? Math.round((user.accepted_count / user.total_submissions) * 100) 
                  : 0;
                const riskInfo = getRiskLevel(user.suspicious_activity_score);

                return (
                  <TableRow key={user.user_id} sx={{ '&:hover': { backgroundColor: '#F8F9FA' } }}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ width: 32, height: 32, backgroundColor: ORANGE }}>
                          {user.username?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {user.total_submissions}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.accepted_count} accepted
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: DARK }}>
                        {successRate}%
                      </Typography>
                    </TableCell>
                    <TableCell>{formatTime(user.average_time_spent)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Chip
                          label={user.total_copy_paste_events}
                          size="small"
                          sx={{
                            backgroundColor: user.total_copy_paste_events > 10 ? '#FFEBEE' : '#E8F5E9',
                            color: user.total_copy_paste_events > 10 ? '#C62828' : DARK
                          }}
                        />
                        <Chip
                          label={user.total_tab_switches}
                          size="small"
                          sx={{
                            backgroundColor: user.total_tab_switches > 20 ? '#FFF3E0' : '#E3F2FD',
                            color: user.total_tab_switches > 20 ? '#C62828' : DARK
                          }}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={riskInfo.label}
                        size="small"
                        icon={user.suspicious_activity_score >= 70 ? <WarningIcon /> : <CheckCircleIcon />}
                        sx={{
                          backgroundColor: riskInfo.bg,
                          color: riskInfo.color,
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${user.ip_addresses.length} IP${user.ip_addresses.length > 1 ? 's' : ''}`}
                        size="small"
                        sx={{
                          backgroundColor: user.ip_addresses.length > 1 ? '#FFF8E1' : '#E8F5E9',
                          color: user.ip_addresses.length > 1 ? '#B76E00' : DARK
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => viewUserActivity(user)}>
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* User Activity Dialog */}
      <Dialog
        open={activityDialog}
        onClose={() => setActivityDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          User Activity Details - {selectedUser?.username}
        </DialogTitle>
        <DialogContent>
          {/* ... same as before, removed LinearProgress & Tooltip ... */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivityDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
