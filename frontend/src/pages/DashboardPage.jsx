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
  IconButton,
  Tooltip,
  Avatar,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  Tab,
  Tabs,
  Button,
  ButtonGroup,
  alpha
} from '@mui/material';
import { getContestList } from '../api/api';
import { Link } from 'react-router-dom';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import PeopleIcon from '@mui/icons-material/People';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CodeIcon from '@mui/icons-material/Code';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';

const ORANGE = '#FFA116';
const DARK = '#262626';
const LIGHT_BG = '#F7F9FC';
const GREEN = '#4CAF50';
const RED = '#F44336';

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

// Stats Card Component
const StatCard = ({ title, value, icon, color, trend, subtitle }) => (
  <Card sx={{ p: 3, bgcolor: '#fff' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ mt: 1, mb: 0.5, color: DARK, fontWeight: 600 }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
          {subtitle}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: trend > 0 ? GREEN : trend < 0 ? RED : 'text.secondary',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {trend > 0 ? '+' : ''}{trend}% from last month
        </Typography>
      </Box>
      <Box 
        sx={{ 
          bgcolor: alpha(color, 0.1), 
          p: 2, 
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {icon}
      </Box>
    </Box>
  </Card>
);

// Contest Status Distribution Chart
const StatusDistributionChart = ({ data }) => (
  <ResponsivePie
    data={data}
    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
    innerRadius={0.6}
    padAngle={0.7}
    cornerRadius={3}
    colors={{ scheme: 'category10' }}
    borderWidth={1}
    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
    enableArcLinkLabels={false}
    arcLabelsSkipAngle={10}
    arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
  />
);

// Participation Trend Chart
const ParticipationTrendChart = ({ data }) => (
  <ResponsiveLine
    data={data}
    margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
    xScale={{ type: 'point' }}
    yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
    curve="cardinal"
    axisBottom={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: -45,
    }}
    pointSize={10}
    pointColor={{ theme: 'background' }}
    pointBorderWidth={2}
    pointBorderColor={{ from: 'serieColor' }}
    enablePointLabel={true}
    enableArea={true}
    areaOpacity={0.1}
  />
);

// Custom chart themes
const chartTheme = {
  background: "transparent",
  textColor: "#333333",
  fontSize: 11,
  axis: {
    domain: {
      line: {
        stroke: "#777777",
        strokeWidth: 1
      }
    },
    ticks: {
      line: {
        stroke: "#777777",
        strokeWidth: 1
      }
    }
  },
  grid: {
    line: {
      stroke: "#dddddd",
      strokeWidth: 1
    }
  }
};

export default function DashboardPage() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    activeContests: 0,
    totalSubmissions: 0,
    completionRate: 0,
    averageParticipation: 0,
    submissionsPerContest: 0
  });

  // Filtering and sorting states
  const [searchInput, setSearchInput] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentView, setCurrentView] = useState('grid');
  const [analyticsTimeFrame, setAnalyticsTimeFrame] = useState('month');

  // Chart data states
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [participationTrend, setParticipationTrend] = useState([]);
  const [submissionStats, setSubmissionStats] = useState([]);
  const [timeDistribution, setTimeDistribution] = useState([]);

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

        // Calculate dashboard statistics
        const totalParticipants = contestsData.reduce((sum, contest) => sum + (contest.participant_count || 0), 0);
        const activeContests = contestsData.filter(contest => {
          const now = new Date();
          return new Date(contest.start_time) <= now && new Date(contest.end_time) >= now;
        }).length;
        const totalSubmissions = contestsData.reduce((sum, contest) => sum + (contest.submission_count || 0), 0);
        const completionRate = totalSubmissions > 0 ? 
          Math.round((totalSubmissions / (totalParticipants || 1)) * 100) : 0;

        setStats({
          totalParticipants,
          activeContests,
          totalSubmissions,
          completionRate
        });

        // Calculate status distribution for pie chart
        const statusCounts = contestsData.reduce((acc, contest) => {
          const status = getStatus(contest.start_time, contest.end_time).label;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        setStatusDistribution(Object.entries(statusCounts).map(([id, value]) => ({
          id,
          label: id,
          value
        })));

        // Generate participation trend data (last 7 contests)
        const trendData = contestsData
          .slice(-7)
          .map(contest => ({
            x: contest.title.substring(0, 15) + (contest.title.length > 15 ? '...' : ''),
            y: contest.participant_count || 0
          }));

        setParticipationTrend([{
          id: "Participants",
          color: ORANGE,
          data: trendData
        }]);
      } catch (err) {
        console.error('Error loading contests:', err);
        setError('Failed to load contests. ' + (err.message || ''));
      } finally {
        setLoading(false);
      }
    };

    loadContests();
  }, []);

  // Filter contests based on current filters
  const filteredContests = contests.filter(contest => {
    const matchesSearch = !searchInput || contest.title.toLowerCase().includes(searchInput.toLowerCase());
    const status = getStatus(contest.start_time, contest.end_time);
    const matchesStatus = selectedStatus === 'all' || status.label.toLowerCase() === selectedStatus.toLowerCase();
    
    // First apply time frame filter
    let matchesTimeFrame = true;
    if (selectedTimeFrame === 'upcoming') {
      matchesTimeFrame = new Date(contest.start_time) > new Date();
    } else if (selectedTimeFrame === 'past') {
      matchesTimeFrame = new Date(contest.end_time) < new Date();
    }

    return matchesSearch && matchesStatus && matchesTimeFrame;
  });

  // Sort filtered contests
  const sortedContests = [...filteredContests].sort((a, b) => {
    if (sortOrder === 'asc') {
      [a, b] = [b, a]; // Reverse arguments for ascending order
    }
    switch (sortBy) {
      case 'participants':
        return (b.participant_count || 0) - (a.participant_count || 0);
      case 'problems':
        return (b.problem_count || 0) - (a.problem_count || 0);
      case 'name':
        return a.title.localeCompare(b.title);
      case 'date':
        return new Date(b.start_time) - new Date(a.start_time);
      default:
        return 0;
    }
  });

  return (
    <Box sx={{ background: LIGHT_BG, minHeight: '100vh', p: 3 }}>
      {/* Header Section with Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ color: DARK, fontWeight: 600 }}>
              Dashboard Overview
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mt: 1 }}>
              Track contest performance and participation metrics
            </Typography>
          </Box>
          <ButtonGroup variant="outlined" size="small">
            <Button
              startIcon={<AssessmentIcon />}
              onClick={() => setCurrentView('analytics')}
              variant={currentView === 'analytics' ? 'contained' : 'outlined'}
            >
              Analytics
            </Button>
            <Button
              startIcon={<CalendarTodayIcon />}
              onClick={() => setCurrentView('grid')}
              variant={currentView === 'grid' ? 'contained' : 'outlined'}
            >
              Contests
            </Button>
          </ButtonGroup>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined" size="small">
              <OutlinedInput
                placeholder="Search contests..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                }
              />
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="upcoming">Upcoming</MenuItem>
                  <MenuItem value="ongoing">Ongoing</MenuItem>
                  <MenuItem value="ended">Ended</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Time Frame</InputLabel>
                <Select
                  value={selectedTimeFrame}
                  onChange={(e) => setSelectedTimeFrame(e.target.value)}
                  label="Time Frame"
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="upcoming">Upcoming</MenuItem>
                  <MenuItem value="past">Past</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="participants">Participants</MenuItem>
                  <MenuItem value="problems">Problems</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Stats Cards and Analytics Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Participants"
                value={stats.totalParticipants}
                icon={<PeopleIcon sx={{ color: '#2196F3' }} />}
                color="#2196F3"
                trend={12}
                subtitle="Across all contests"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Contests"
                value={stats.activeContests}
                icon={<EmojiEventsIcon sx={{ color: '#4CAF50' }} />}
                color="#4CAF50"
                trend={-5}
                subtitle="Currently running"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Submissions"
                value={stats.totalSubmissions}
                icon={<CodeIcon sx={{ color: ORANGE }} />}
                color={ORANGE}
                trend={8}
                subtitle="Solutions submitted"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Avg. Completion"
                value={stats.completionRate + '%'}
                icon={<AccessTimeIcon sx={{ color: '#9C27B0' }} />}
                color="#9C27B0"
                trend={3}
                subtitle="Problems solved"
              />
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ p: 3, bgcolor: '#fff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">Participation Analytics</Typography>
                  <ButtonGroup size="small">
                    {['week', 'month', 'year'].map((timeFrame) => (
                      <Button
                        key={timeFrame}
                        onClick={() => setAnalyticsTimeFrame(timeFrame)}
                        variant={analyticsTimeFrame === timeFrame ? 'contained' : 'outlined'}
                      >
                        {timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)}
                      </Button>
                    ))}
                  </ButtonGroup>
                </Box>
                <Box sx={{ height: 300 }}>
                  <ParticipationTrendChart 
                    data={participationTrend}
                    theme={chartTheme}
                  />
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ p: 3, bgcolor: '#fff' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Contest Distribution</Typography>
                <Box sx={{ height: 200 }}>
                  <StatusDistributionChart 
                    data={statusDistribution}
                    theme={chartTheme}
                  />
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ p: 3, bgcolor: '#fff' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Submission Patterns</Typography>
                <Box sx={{ height: 200 }}>
                  <ResponsiveBar
                    data={submissionStats}
                    keys={['count']}
                    indexBy="hour"
                    theme={chartTheme}
                    colors={{ scheme: 'nivo' }}
                    margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
                    padding={0.3}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                    }}
                  />
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Contests List Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, color: DARK, fontWeight: 500 }}>
          Recent Contests
        </Typography>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress sx={{ color: ORANGE }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : sortedContests.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No contests found matching your filters.
        </Alert>
      ) : (
        <Grid container spacing={3} alignItems="stretch">
          {sortedContests.map(contest => {
            const status = getStatus(contest.start_time, contest.end_time);
            return (
              <Grid item xs={12} sm={6} md={4} key={contest.id} sx={{ display: 'flex' }}>
                <Card
                  elevation={0}
                  sx={{
                    width: '100%',
                    borderRadius: 2,
                    bgcolor: '#fff',
                    border: '1px solid rgba(0,0,0,0.05)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(255, 161, 22, 0.15)',
                    },
                  }}
                >
                  <CardActionArea 
                    component={Link} 
                    to={`/contests/${contest.id}`} 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'stretch' 
                    }}
                  >
                    <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography
                          variant="h6"
                          sx={{ 
                            fontWeight: 600, 
                            color: DARK,
                            mb: 0.5,
                            transition: 'color 0.2s',
                            '&:hover': { color: ORANGE }
                          }}
                        >
                          {contest.title}
                        </Typography>
                        <Chip
                          label={status.label}
                          size="small"
                          sx={{ 
                            fontWeight: 500,
                            bgcolor: status.bg,
                            color: status.textColor,
                          }}
                        />
                      </Box>
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ mb: 2, flexGrow: 1 }}
                      >
                        {contest.description || 'No description available.'}
                      </Typography>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Start Time
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AccessTimeIcon sx={{ fontSize: '1rem', color: 'primary.main' }} />
                              <Typography variant="body2">
                                {formatDate(contest.start_time)}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              End Time
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AccessTimeIcon sx={{ fontSize: '1rem', color: 'error.main' }} />
                              <Typography variant="body2">
                                {formatDate(contest.end_time)}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>

                      <Box 
                        sx={{ 
                          mt: 'auto',
                          pt: 2,
                          borderTop: '1px solid',
                          borderColor: 'divider',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PeopleIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {contest.participant_count || 0} Participants
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CodeIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {contest.problem_count || 0} Problems
                          </Typography>
                        </Box>
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