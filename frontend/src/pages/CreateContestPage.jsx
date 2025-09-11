import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Alert, 
  Card, 
  CardContent, 
  Divider,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Grid,
  Chip,
  IconButton,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
  Switch
} from '@mui/material';
import { createContest } from '../api/api';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';

const ORANGE = '#FFA116';
const DARK = '#262626';

const steps = ['Contest Details', 'Schedule', 'Review & Create'];

export default function CreateContestPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    start_time: null, 
    end_time: null,
    difficulty: 'Medium',
    max_participants: 100,
    departments: [],
    share_enabled: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDateChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!form.title || !form.description) {
        setError('Please fill in all required fields');
        return;
      }
    } else if (activeStep === 1) {
      if (!form.start_time || !form.end_time) {
        setError('Please select start and end times');
        return;
      }
      if (form.start_time >= form.end_time) {
        setError('End time must be after start time');
        return;
      }
    }
    setError(null);
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await createContest(form);
      setSuccess('Contest created successfully!');
      setTimeout(() => {
        navigate('/contests');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create contest');
    }
    setLoading(false);
  };

  // List of available departments
  const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: DARK, display: 'flex', alignItems: 'center', gap: 1 }}>
              <DescriptionIcon sx={{ color: ORANGE }} />
              Contest Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  name="title"
                  label="Contest Title"
                  value={form.title}
                  onChange={handleChange}
                  fullWidth
                  required
                  placeholder="Enter a compelling contest title"
                  sx={{ mb: 2 }}
                  InputProps={{
                    style: { fontSize: '1.1rem' }
                  }}
                />
              </Grid>
                            <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  value={form.description}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Eligible Departments</InputLabel>
                  <Select
                    multiple
                    name="departments"
                    value={form.departments}
                    onChange={(e) => handleChange({
                      target: {
                        name: 'departments',
                        value: e.target.value
                      }
                    })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Select departments that can access this contest</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.share_enabled}
                      onChange={(e) => handleChange({
                        target: {
                          name: 'share_enabled',
                          value: e.target.checked
                        }
                      })}
                      name="share_enabled"
                    />
                  }
                  label="Enable Contest Sharing"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Difficulty Level</InputLabel>
                  <Select
                    name="difficulty"
                    value={form.difficulty}
                    onChange={handleChange}
                    label="Difficulty Level"
                  >
                    <MenuItem value="Easy">Easy</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Hard">Hard</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="max_participants"
                  label="Max Participants"
                  type="number"
                  value={form.max_participants}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ min: 1, max: 1000 }}
                  helperText="Maximum number of participants allowed"
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: DARK, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon sx={{ color: ORANGE }} />
              Contest Schedule
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <DateTimePicker
                    label="Start Time"
                    value={form.start_time}
                    onChange={(value) => handleDateChange('start_time', value)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        required 
                        helperText="When the contest begins"
                      />
                    )}
                    minDateTime={new Date()}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DateTimePicker
                    label="End Time"
                    value={form.end_time}
                    onChange={(value) => handleDateChange('end_time', value)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        required 
                        helperText="When the contest ends"
                      />
                    )}
                    minDateTime={form.start_time || new Date()}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: DARK, display: 'flex', alignItems: 'center', gap: 1 }}>
              <StarIcon sx={{ color: ORANGE }} />
              Review Contest Details
            </Typography>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #E0E3E7', borderRadius: 2, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: DARK, mb: 1 }}>
                    {form.title}
                  </Typography>
                  <Chip 
                    label={form.difficulty} 
                    size="small" 
                    sx={{ 
                      mb: 2,
                      backgroundColor: 
                        form.difficulty === 'Easy' ? '#E7F7ED' :
                        form.difficulty === 'Medium' ? '#FFF4E5' : '#FEECEC',
                      color:
                        form.difficulty === 'Easy' ? '#2D7738' :
                        form.difficulty === 'Medium' ? '#B76E00' : '#C62828'
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {form.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon sx={{ color: ORANGE, fontSize: 16 }} />
                      <Typography variant="caption" color="text.secondary">
                        <strong>Start:</strong> {form.start_time ? form.start_time.toLocaleString() : 'Not set'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon sx={{ color: ORANGE, fontSize: 16 }} />
                      <Typography variant="caption" color="text.secondary">
                        <strong>End:</strong> {form.end_time ? form.end_time.toLocaleString() : 'Not set'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Max Participants:</strong> {form.max_participants}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ 
      background: '#F7F9FC', 
      minHeight: '100vh',
      p: 3
    }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton
            onClick={() => navigate('/contests')}
            sx={{ mr: 2, color: 'text.secondary' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 700, color: DARK }}>
            Create New Contest
          </Typography>
        </Box>

        {/* Stepper */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #E0E3E7', borderRadius: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Content */}
          <Box>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}
            
            {getStepContent(activeStep)}

            {/* Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                }}
              >
                Back
              </Button>
              <Box>
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    sx={{
                      backgroundColor: ORANGE,
                      '&:hover': { backgroundColor: '#e59114' },
                      px: 4,
                      py: 1.5,
                      fontWeight: 600
                    }}
                  >
                    {loading ? 'Creating Contest...' : 'Create Contest'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{
                      backgroundColor: ORANGE,
                      '&:hover': { backgroundColor: '#e59114' },
                      px: 4,
                      py: 1.5,
                      fontWeight: 600
                    }}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
} 