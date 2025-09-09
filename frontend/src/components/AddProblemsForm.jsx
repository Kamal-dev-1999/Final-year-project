import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Card,
  CardContent,
  Typography,
  Grid,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BugReportIcon from '@mui/icons-material/BugReport';
import { createProblems } from '../api/api';

const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];
const ORANGE = '#FFA116';
const DARK = '#262626';

// Language options for Judge0
const LANGUAGE_OPTIONS = [
  { id: 71, name: 'Python (3.8.1)', extension: '.py' },
  { id: 54, name: 'C++ (GCC 9.2.0)', extension: '.cpp' },
  { id: 62, name: 'Java (OpenJDK 13.0.1)', extension: '.java' },
  { id: 63, name: 'JavaScript (Node.js 12.14.0)', extension: '.js' },
  { id: 50, name: 'C (GCC 9.2.0)', extension: '.c' },
  { id: 51, name: 'C# (Mono 6.6.0.161)', extension: '.cs' },
  { id: 60, name: 'Go (1.13.5)', extension: '.go' },
  { id: 72, name: 'Ruby (2.7.0)', extension: '.rb' },
  { id: 73, name: 'Rust (1.40.0)', extension: '.rs' },
  { id: 78, name: 'Kotlin (1.3.70)', extension: '.kt' },
];

const emptyProblem = {
  title: '',
  statement: '',
  difficulty: 'Medium',
  points: 100,
  time_limit: 2000,
  memory_limit: 128000,
  cpu_time_limit: 2000,
  enable_network: false,
  max_submissions: 10,
  allow_multiple_languages: true,
  default_language_id: 71, // Python 3
  test_cases: [{
    name: 'Sample Test Case',
    input_data: '',
    expected_output: '',
    is_sample: true,
    is_public: true,
    order: 1
  }]
};

export default function AddProblemsForm({ contestId, onSuccess }) {
  const [problems, setProblems] = useState([{ ...emptyProblem }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const handleAddProblem = () => {
    setProblems([...problems, { ...emptyProblem }]);
  };

  const handleRemoveProblem = (index) => {
    const newProblems = problems.filter((_, i) => i !== index);
    setProblems(newProblems);
  };

  const handleProblemChange = (index, field, value) => {
    const newProblems = [...problems];
    const numericFields = ['points', 'time_limit', 'memory_limit', 'cpu_time_limit', 'max_submissions', 'default_language_id'];
    newProblems[index] = {
      ...newProblems[index],
      [field]: numericFields.includes(field) ? parseInt(value) || 0 : 
               field === 'enable_network' || field === 'allow_multiple_languages' ? value :
               value,
    };
    setProblems(newProblems);
  };

  const handleTestCaseChange = (problemIndex, testCaseIndex, field, value) => {
    const newProblems = [...problems];
    const newTestCases = [...newProblems[problemIndex].test_cases];
    newTestCases[testCaseIndex] = {
      ...newTestCases[testCaseIndex],
      [field]: field === 'order' ? parseInt(value) || 0 :
               field === 'is_sample' || field === 'is_public' ? value :
               value
    };
    newProblems[problemIndex].test_cases = newTestCases;
    setProblems(newProblems);
  };

  const addTestCase = (problemIndex) => {
    const newProblems = [...problems];
    const currentTestCases = newProblems[problemIndex].test_cases;
    const newOrder = currentTestCases.length + 1;
    newProblems[problemIndex].test_cases.push({
      name: `Test Case ${newOrder}`,
      input_data: '',
      expected_output: '',
      is_sample: false,
      is_public: false,
      order: newOrder
    });
    setProblems(newProblems);
  };

  const removeTestCase = (problemIndex, testCaseIndex) => {
    const newProblems = [...problems];
    newProblems[problemIndex].test_cases = newProblems[problemIndex].test_cases.filter(
      (_, index) => index !== testCaseIndex
    );
    setProblems(newProblems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createProblems(contestId, problems);
      setSuccessMessage('Problems added successfully!');
      setProblems([{ ...emptyProblem }]);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add problems');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ mb: 3, color: DARK }}>
        Add Problems
      </Typography>

      {problems.map((problem, index) => (
        <Card 
          key={index} 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <CardContent>
            <Grid container spacing={3}>
              {/* Basic Problem Info */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ color: DARK, fontWeight: 600, mb: 2 }}>
                  Problem {index + 1}: Basic Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Problem Title"
                  value={problem.title}
                  onChange={(e) => handleProblemChange(index, 'title', e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Difficulty"
                  value={problem.difficulty}
                  onChange={(e) => handleProblemChange(index, 'difficulty', e.target.value)}
                  required
                  sx={{ mb: 2 }}
                >
                  {DIFFICULTY_LEVELS.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Problem Statement"
                  value={problem.statement}
                  onChange={(e) => handleProblemChange(index, 'statement', e.target.value)}
                  required
                  placeholder="Describe the problem, input format, output format, and constraints..."
                  sx={{ mb: 2 }}
                />
              </Grid>

              {/* Judge0 Configuration */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ color: DARK, fontWeight: 600, mb: 2 }}>
                  Judge Configuration
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Points"
                  value={problem.points}
                  onChange={(e) => handleProblemChange(index, 'points', e.target.value)}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Time Limit (ms)"
                  value={problem.time_limit}
                  onChange={(e) => handleProblemChange(index, 'time_limit', e.target.value)}
                  required
                  inputProps={{ min: 100, max: 20000 }}
                  helperText="Max 20 seconds (Judge0 free)"
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Memory Limit (KB)"
                  value={Math.floor(problem.memory_limit / 1000)}
                  onChange={(e) => handleProblemChange(index, 'memory_limit', parseInt(e.target.value) * 1000)}
                  required
                  inputProps={{ min: 32, max: 512 }}
                  helperText="Max 512KB (Judge0 free)"
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Submissions"
                  value={problem.max_submissions}
                  onChange={(e) => handleProblemChange(index, 'max_submissions', e.target.value)}
                  required
                  inputProps={{ min: 1, max: 50 }}
                />
              </Grid>

              {/* Language Settings */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ color: DARK, fontWeight: 600, mb: 2 }}>
                  Language Settings
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Default Language"
                  value={problem.default_language_id}
                  onChange={(e) => handleProblemChange(index, 'default_language_id', e.target.value)}
                  required
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <MenuItem key={lang.id} value={lang.id}>
                      {lang.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={problem.allow_multiple_languages}
                      onChange={(e) => handleProblemChange(index, 'allow_multiple_languages', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: ORANGE,
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: ORANGE,
                        },
                      }}
                    />
                  }
                  label="Allow Multiple Languages"
                  sx={{ mt: 2 }}
                />
              </Grid>

              {/* Test Cases Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: DARK, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BugReportIcon sx={{ color: ORANGE }} />
                    Test Cases
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => addTestCase(index)}
                    sx={{ color: ORANGE }}
                  >
                    Add Test Case
                  </Button>
                </Box>
                
                {problem.test_cases.map((testCase, testIndex) => (
                  <Accordion key={testIndex} sx={{ mb: 1, border: '1px solid #E0E3E7' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Typography sx={{ fontWeight: 600 }}>
                          {testCase.name}
                        </Typography>
                        {testCase.is_sample && (
                          <Chip size="small" label="Sample" sx={{ backgroundColor: '#E7F7ED', color: '#2D7738' }} />
                        )}
                        {testCase.is_public && (
                          <Chip size="small" label="Public" sx={{ backgroundColor: '#FFF4E5', color: '#B76E00' }} />
                        )}
                        <Box sx={{ flexGrow: 1 }} />
                        {problem.test_cases.length > 1 && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTestCase(index, testIndex);
                            }}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Test Case Name"
                            value={testCase.name}
                            onChange={(e) => handleTestCaseChange(index, testIndex, 'name', e.target.value)}
                            size="small"
                            sx={{ mb: 2 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Order"
                            value={testCase.order}
                            onChange={(e) => handleTestCaseChange(index, testIndex, 'order', e.target.value)}
                            size="small"
                            sx={{ mb: 2 }}
                            inputProps={{ min: 1 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Input Data"
                            value={testCase.input_data}
                            onChange={(e) => handleTestCaseChange(index, testIndex, 'input_data', e.target.value)}
                            size="small"
                            sx={{ mb: 2 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Expected Output"
                            value={testCase.expected_output}
                            onChange={(e) => handleTestCaseChange(index, testIndex, 'expected_output', e.target.value)}
                            size="small"
                            sx={{ mb: 2 }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={testCase.is_sample}
                                  onChange={(e) => handleTestCaseChange(index, testIndex, 'is_sample', e.target.checked)}
                                  size="small"
                                />
                              }
                              label="Sample Test Case"
                            />
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={testCase.is_public}
                                  onChange={(e) => handleTestCaseChange(index, testIndex, 'is_public', e.target.checked)}
                                  size="small"
                                />
                              }
                              label="Public Test Case"
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Grid>
            </Grid>

            {problems.length > 1 && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton
                  onClick={() => handleRemoveProblem(index)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}

      <Box sx={{ mb: 3 }}>
        <Button
          type="button"
          onClick={handleAddProblem}
          startIcon={<AddIcon />}
          sx={{
            color: ORANGE,
            borderColor: ORANGE,
            '&:hover': {
              borderColor: ORANGE,
              backgroundColor: 'rgba(255, 161, 22, 0.04)',
            },
          }}
        >
          Add Another Problem
        </Button>
      </Box>

      <Button
        type="submit"
        variant="contained"
        disabled={loading}
        sx={{
          backgroundColor: ORANGE,
          '&:hover': {
            backgroundColor: '#e59114',
          },
        }}
      >
        {loading ? 'Adding Problems...' : 'Save Problems'}
      </Button>

      <Snackbar
        open={!!error || !!successMessage}
        autoHideDuration={6000}
        onClose={() => {
          setError(null);
          setSuccessMessage('');
        }}
      >
        <Alert
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
