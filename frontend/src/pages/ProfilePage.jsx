import React from 'react';
import { Typography, Box } from '@mui/material';

const DARK = '#262626';

export default function ProfilePage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: DARK, mb: 3 }}>
        My Profile
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.1rem' }}>
        (User profile details and update form will be displayed here. API integration coming soon.)
      </Typography>
    </Box>
  );
} 