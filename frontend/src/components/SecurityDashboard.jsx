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
  Button,
  CircularProgress,
  Alert,
  Stack,
  LinearProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import WarningIcon from '@mui/icons-material/Warning';
import PlagiarismIcon from '@mui/icons-material/Plagiarism';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getPlagiarismChecks, getHighSimilaritySubmissions, detectPlagiarism, markPlagiarismReviewed } from '../api/analytics';

const ORANGE = '#FFA116';
const DARK = '#262626';

export default function SecurityDashboard({ contestId, problems = [] }) {
  const [plagiarismChecks, setPlagiarismChecks] = useState([]);
  const [highSimilarity, setHighSimilarity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningDetection, setRunningDetection] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState('');
  const [threshold, setThreshold] = useState(0.7);
  const [comparisonDialog, setComparisonDialog] = useState(false);
  const [selectedComparison, setSelectedComparison] = useState(null);

  useEffect(() => {
    fetchSecurityData();
  }, [contestId]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const [plagiarismRes, highSimilarityRes] = await Promise.all([
        getPlagiarismChecks({ contest_id: contestId }),
        getHighSimilaritySubmissions(70)
      ]);
      
      setPlagiarismChecks(plagiarismRes.data.results || plagiarismRes.data);
      setHighSimilarity(highSimilarityRes.data.results || highSimilarityRes.data);
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runPlagiarismDetection = async () => {
    if (!selectedProblem) {
      alert('Please select a problem to analyze');
      return;
    }

    try {
      setRunningDetection(true);
      await detectPlagiarism(selectedProblem, threshold);
      await fetchSecurityData(); // Refresh data
      alert('Plagiarism detection completed successfully');
    } catch (error) {
      console.error('Error running plagiarism detection:', error);
      alert('Error running plagiarism detection');
    } finally {
      setRunningDetection(false);
    }
  };

  const markAsReviewed = async (checkId) => {
    try {
      await markPlagiarismReviewed(checkId);
      await fetchSecurityData(); // Refresh data
    } catch (error) {
      console.error('Error marking as reviewed:', error);
    }
  };

  const viewComparison = (check) => {
    setSelectedComparison(check);
    setComparisonDialog(true);
  };

  const getSimilarityColor = (score) => {
    if (score >= 90) return { bg: '#FEECEC', color: '#C62828' };
    if (score >= 70) return { bg: '#FFF4E5', color: '#B76E00' };
    return { bg: '#E7F7ED', color: '#2D7738' };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: ORANGE }} />
      </Box>
    );
  }

  const unreviewed = plagiarismChecks.filter(check => !check.reviewed);
  const highRiskChecks = plagiarismChecks.filter(check => check.similarity_score >= 80);

  return (
    <Box>
      {/* Security Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E0E3E7' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#C62828', fontWeight: 700 }}>
                {unreviewed.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unreviewed Flags
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E0E3E7' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#B76E00', fontWeight: 700 }}>
                {highRiskChecks.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High Risk Cases
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E0E3E7' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: ORANGE, fontWeight: 700 }}>
                {plagiarismChecks.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Checks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E0E3E7' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#2D7738', fontWeight: 700 }}>
                {Math.round((plagiarismChecks.filter(c => c.reviewed).length / plagiarismChecks.length) * 100) || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Plagiarism Detection Controls */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #E0E3E7' }}>
        <Typography variant="h6" sx={{ mb: 3, color: DARK, fontWeight: 600 }}>
          Run Plagiarism Detection
        </Typography>
        <Stack direction="row" spacing={3} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Select Problem</InputLabel>
            <Select
              value={selectedProblem}
              label="Select Problem"
              onChange={(e) => setSelectedProblem(e.target.value)}
            >
              {problems.map((problem) => (
                <MenuItem key={problem.id} value={problem.id}>
                  {problem.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Similarity Threshold"
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            inputProps={{ min: 0.1, max: 1, step: 0.1 }}
            sx={{ width: 150 }}
          />
          <Button
            variant="contained"
            startIcon={runningDetection ? <CircularProgress size={16} /> : <PlayArrowIcon />}
            onClick={runPlagiarismDetection}
            disabled={runningDetection || !selectedProblem}
            sx={{
              backgroundColor: ORANGE,
              '&:hover': { backgroundColor: '#e59114' },
              px: 3
            }}
          >
            {runningDetection ? 'Analyzing...' : 'Run Detection'}
          </Button>
        </Stack>
      </Paper>

      {/* Plagiarism Results Table */}
      <Paper sx={{ borderRadius: 3, border: '1px solid #E0E3E7' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #E0E3E7' }}>
          <Typography variant="h6" sx={{ color: DARK, fontWeight: 600 }}>
            Plagiarism Detection Results
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F8F9FA' }}>
                <TableCell sx={{ fontWeight: 600 }}>Users</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Problem</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Similarity Score</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Algorithm</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Detected At</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plagiarismChecks.map((check) => {
                const similarityInfo = getSimilarityColor(check.similarity_score);
                
                return (
                  <TableRow key={check.id} sx={{ '&:hover': { backgroundColor: '#F8F9FA' } }}>
                    <TableCell>
                      <Stack spacing={1}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {check.submission1_user} vs {check.submission2_user}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={new Date(check.submission1_time).toLocaleDateString()}
                            size="small"
                            sx={{ fontSize: '0.7rem' }}
                          />
                          <Chip
                            label={new Date(check.submission2_time).toLocaleDateString()}
                            size="small"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Stack>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {check.problem_title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={check.similarity_score}
                          sx={{
                            width: 60,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#E0E3E7',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: similarityInfo.color
                            }
                          }}
                        />
                        <Chip
                          label={`${Math.round(check.similarity_score)}%`}
                          size="small"
                          sx={{
                            backgroundColor: similarityInfo.bg,
                            color: similarityInfo.color,
                            fontWeight: 600
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={check.algorithm_used}
                        size="small"
                        sx={{ backgroundColor: '#F0F2F5', color: DARK }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(check.flagged_at).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={check.reviewed ? 'Reviewed' : 'Pending'}
                        size="small"
                        icon={check.reviewed ? <CheckCircleIcon /> : <WarningIcon />}
                        sx={{
                          backgroundColor: check.reviewed ? '#E7F7ED' : '#FFF4E5',
                          color: check.reviewed ? '#2D7738' : '#B76E00',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="View Code Comparison">
                          <IconButton
                            size="small"
                            onClick={() => viewComparison(check)}
                            sx={{ color: ORANGE }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        {!check.reviewed && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => markAsReviewed(check.id)}
                            sx={{
                              color: '#2D7738',
                              borderColor: '#2D7738',
                              fontSize: '0.7rem',
                              px: 1
                            }}
                          >
                            Mark Reviewed
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {plagiarismChecks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No plagiarism checks found. Run detection to analyze submissions.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Code Comparison Dialog */}
      <Dialog
        open={comparisonDialog}
        onClose={() => setComparisonDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Code Similarity Analysis - {selectedComparison?.similarity_score}% Match
        </DialogTitle>
        <DialogContent>
          {selectedComparison && (
            <Box>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, color: DARK }}>
                    {selectedComparison.submission1_user}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Submitted: {new Date(selectedComparison.submission1_time).toLocaleString()}
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: '#F8F9FA',
                      borderRadius: 2,
                      fontFamily: 'monospace',
                      overflow: 'auto',
                      maxHeight: 400,
                      border: '1px solid #E0E3E7'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {/* Code would be fetched from submission details */}
                      Code comparison feature requires submission details API integration
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, color: DARK }}>
                    {selectedComparison.submission2_user}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Submitted: {new Date(selectedComparison.submission2_time).toLocaleString()}
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: '#F8F9FA',
                      borderRadius: 2,
                      fontFamily: 'monospace',
                      overflow: 'auto',
                      maxHeight: 400,
                      border: '1px solid #E0E3E7'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {/* Code would be fetched from submission details */}
                      Code comparison feature requires submission details API integration
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Analysis Details:</strong><br />
                  Algorithm: {selectedComparison.algorithm_used}<br />
                  Similarity Score: {selectedComparison.similarity_score}%<br />
                  Problem: {selectedComparison.problem_title}
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComparisonDialog(false)}>Close</Button>
          {selectedComparison && !selectedComparison.reviewed && (
            <Button
              variant="contained"
              onClick={() => {
                markAsReviewed(selectedComparison.id);
                setComparisonDialog(false);
              }}
              sx={{ backgroundColor: ORANGE, '&:hover': { backgroundColor: '#e59114' } }}
            >
              Mark as Reviewed
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}