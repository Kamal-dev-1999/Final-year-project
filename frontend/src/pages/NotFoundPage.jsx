import React from 'react';
import { Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const ORANGE = '#FFA116';
const DARK = '#262626';

export default function NotFoundPage() {
  return (
    <Box sx={{ 
      textAlign: 'center', 
      mt: 8, 
      p: 3,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh'
    }}>
      <Typography variant="h2" gutterBottom sx={{ fontWeight: 700, color: DARK, mb: 2 }}>
        404 - Page Not Found
      </Typography>
      <Typography variant="body1" gutterBottom sx={{ color: 'text.secondary', fontSize: '1.1rem', mb: 4 }}>
        The page you are looking for does not exist.
      </Typography>
      <Button 
        variant="contained" 
        component={Link} 
        to="/"
        sx={{
          backgroundColor: ORANGE,
          '&:hover': { backgroundColor: '#e59114' },
          px: 4,
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 600
        }}
      >
        Go to Dashboard
      </Button>
    </Box>
  );
} 