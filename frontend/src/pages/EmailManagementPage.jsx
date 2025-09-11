import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  IconButton,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ErrorIcon from '@mui/icons-material/Error';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`email-tabpanel-${index}`}
      aria-labelledby={`email-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EmailManagementPage() {
  const [templates, setTemplates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState({
    name: '',
    subject: '',
    body: ''
  });

  // Fetch templates and tasks
  useEffect(() => {
    fetchTemplates();
    fetchTasks();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/notifications/templates/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/notifications/tasks/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmitTemplate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = currentTemplate.id ? 'PUT' : 'POST';
      const url = currentTemplate.id 
        ? `/api/notifications/templates/${currentTemplate.id}/`
        : '/api/notifications/templates/';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentTemplate)
      });

      if (!response.ok) throw new Error('Failed to save template');
      
      fetchTemplates();
      setOpenDialog(false);
      setCurrentTemplate({ name: '', subject: '', body: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [selectedContest, setSelectedContest] = useState(null);
  const [contests, setContests] = useState([]);

  // Fetch contests when component mounts
  useEffect(() => {
    const fetchContests = async () => {
      try {
        const response = await fetch('/api/notifications/tasks/available_contests/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch contests');
        const data = await response.json();
        setContests(data);
        console.log('Fetched contests:', data); // Debug log
      } catch (err) {
        console.error('Contest fetch error:', err);
        setError(err.message);
      }
    };
    fetchContests();
  }, []);

  const handleSendEmails = async (templateId) => {
    // First select a contest
    if (!selectedContest) {
      setError('Please select a contest first');
      return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('template', templateId);
      formData.append('contest', selectedContest);

      try {
        console.log('Sending email task:', {
          file: file.name,
          template: templateId,
          contest: selectedContest
        });

        const response = await fetch('/api/notifications/tasks/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
            // Note: Do not set Content-Type when using FormData
          },
          body: formData
        });

        const data = await response.json();
        console.log('Task creation response:', data);

        if (!response.ok) {
          throw new Error(`Failed to send emails: ${data.error || 'Unknown error'}`);
        }
        
        fetchTasks();
      } catch (err) {
        setError(err.message);
      }
    };

    fileInput.click();
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ width: '100%', mb: 4 }}>
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h4" gutterBottom>
            Email Management
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
              <Tab label="Email Templates" />
              <Tab label="Email Tasks" />
            </Tabs>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TabPanel value={activeTab} index={0}>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setCurrentTemplate({ name: '', subject: '', body: '' });
                  setOpenDialog(true);
                }}
              >
                New Template
              </Button>
              
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="contest-select-label">Select Contest</InputLabel>
                <Select
                  labelId="contest-select-label"
                  value={selectedContest || ''}
                  label="Select Contest"
                  onChange={(e) => setSelectedContest(e.target.value)}
                >
                  {contests.map((contest) => (
                    <MenuItem key={contest.id} value={contest.id}>
                      {contest.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>{template.name}</TableCell>
                      <TableCell>{template.subject}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => {
                            setCurrentTemplate(template);
                            setOpenDialog(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleSendEmails(template.id)}>
                          <SendIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Template</TableCell>
                    <TableCell>Contest</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.template_name}</TableCell>
                      <TableCell>{task.contest_title}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography color={task.status === 'failed' ? 'error' : 'inherit'}>
                            {task.status}
                          </Typography>
                          {task.status === 'failed' && (
                            <Tooltip title={task.error_log || 'Unknown error'}>
                              <IconButton size="small">
                                <ErrorIcon color="error" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {task.sent_emails}/{task.total_emails}
                        {task.failed_emails > 0 && ` (${task.failed_emails} failed)`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Paper>
      </Box>

      {/* Template Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentTemplate.id ? 'Edit Template' : 'New Template'}
        </DialogTitle>
        <form onSubmit={handleSubmitTemplate}>
          <DialogContent>
            <TextField
              fullWidth
              label="Template Name"
              value={currentTemplate.name}
              onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Subject"
              value={currentTemplate.subject}
              onChange={(e) => setCurrentTemplate({ ...currentTemplate, subject: e.target.value })}
              margin="normal"
              required
              helperText="Available placeholders: {contest_title}"
            />
            <TextField
              fullWidth
              label="Body"
              value={currentTemplate.body}
              onChange={(e) => setCurrentTemplate({ ...currentTemplate, body: e.target.value })}
              margin="normal"
              required
              multiline
              rows={8}
              helperText="Available placeholders: {contest_title}, {start_time}, {end_time}, {contest_link}"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}
