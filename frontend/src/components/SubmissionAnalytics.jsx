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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Avatar,
  Stack
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import TimerIcon from '@mui/icons-material/Timer';
import CloseIcon from '@mui/icons-material/Close';
import { getSubmissionAnalytics } from '../api/api';

const ORANGE = '#FFA116';

const getStatusColor = (status) => {
  switch (status) {
    case 'Accepted': return { bg: '#E7F7ED', color: '#2D7738', icon: CheckCircleIcon };
    case 'Wrong Answer': return { bg: '#FEECEC', color: '#C62828', icon: ErrorIcon };
    case 'Compilation Error': return { bg: '#FFF4E5', color: '#B76E00', icon: WarningIcon };
    case 'Time Limit Exceeded': return { bg: '#E3F2FD', color: '#1976D2', icon: TimerIcon };
    default: return { bg: '#F0F2F5', color: '#666', icon: ErrorIcon };
  }
};

const getSuspiciousScore = (submission) => {
  let score = 0;
  if (submission.copy_paste_events > 5) score += 30;
  if (submission.tab_switches > 10) score += 20;
  if (submission.code_similarity_score > 0.8) score += 50;
  return score;
};

export default function SubmissionAnalytics({ contestId }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [codeViewDialog, setCodeViewDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUser, setFilterUser] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!contestId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const params = { contest_id: contestId };
        if (filterStatus !== 'all') params.status = filterStatus;
        if (filterUser) params.user_id = filterUser;

        const submissionsData = await getSubmissionAnalytics(params);

        console.log('Submissions data:', submissionsData);

        setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError(error.message);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contestId, filterStatus, filterUser]);

  const handleViewCode = (submission) => {
    setSelectedSubmission(submission);
    setCodeViewDialog(true);
  };

  const handleCloseDialog = () => {
    setCodeViewDialog(false);
    setSelectedSubmission(null);
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: ORANGE }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="all">All Submissions</MenuItem>
            <MenuItem value="Accepted">Accepted</MenuItem>
            <MenuItem value="Wrong Answer">Wrong Answer</MenuItem>
            <MenuItem value="Runtime Error">Runtime Error</MenuItem>
            <MenuItem value="Time Limit Exceeded">Time Limit Exceeded</MenuItem>
            <MenuItem value="Compilation Error">Compilation Error</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Filter by User"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <Button
          variant="outlined"
          onClick={() => {
            setFilterStatus('all');
            setFilterUser('');
          }}
          sx={{ color: ORANGE, borderColor: ORANGE }}
        >
          Clear Filters
        </Button>
      </Stack>

      {/* Submissions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Problem</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Memory</TableCell>
              <TableCell>Language</TableCell>
              <TableCell>Submitted At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map((submission) => {
              const statusInfo = getStatusColor(submission.status);
              const StatusIcon = statusInfo.icon;
              const suspiciousScore = getSuspiciousScore(submission);

              return (
                <TableRow key={submission.id}>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ width: 32, height: 32, backgroundColor: ORANGE }}>
                        {submission.username?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Typography>{submission.username}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{submission.problem_title}</TableCell>
                  <TableCell>
                    <Chip
                      icon={<StatusIcon sx={{ fontSize: 16 }} />}
                      label={submission.status}
                      sx={{
                        backgroundColor: statusInfo.bg,
                        color: statusInfo.color,
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell>{submission.time} s</TableCell>
                  <TableCell>{Math.round(submission.memory / 1024)} MB</TableCell>
                  <TableCell>{submission.language_id}</TableCell>
                  <TableCell>{new Date(submission.submitted_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Tooltip title="View Code">
                      <IconButton onClick={() => handleViewCode(submission)} sx={{ color: ORANGE }}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Code View Dialog */}
      <Dialog open={codeViewDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Submission Details
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Box>
              <Typography variant="h6" gutterBottom>{selectedSubmission.problem_title}</Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Submitted by {selectedSubmission.username}
              </Typography>
              <pre
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '16px',
                  borderRadius: '4px',
                  overflow: 'auto'
                }}
              >
                {selectedSubmission.source_code}
              </pre>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
