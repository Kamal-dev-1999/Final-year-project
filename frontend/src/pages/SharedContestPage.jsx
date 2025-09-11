import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Typography,
  Container,
  Paper,
  Alert,
  Button
} from '@mui/material';

export default function SharedContestPage() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const resolveSharedContest = async () => {
      try {
        // First check if we have an auth token
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login', { state: { from: `/contests/share/${shareId}` } });
          return;
        }

        const response = await fetch(`/api/contests/resolve-share/${shareId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Invalid or expired share link');
        }

        const data = await response.json();
        // Redirect to the actual contest page
        navigate(`/contests/${data.contest_id}`);
      } catch (err) {
        console.error('Share link resolution error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    resolveSharedContest();
  }, [shareId, navigate]);

  if (loading && !error) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            gap: 2
          }}
        >
          <CircularProgress />
          <Typography>Verifying contest link...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Typography variant="body1" sx={{ mb: 2 }}>
              This contest link may be invalid or expired. Please contact the contest organizer for a new link.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/contests')}
              sx={{ mt: 2 }}
            >
              Back to Contests
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return null;
}
