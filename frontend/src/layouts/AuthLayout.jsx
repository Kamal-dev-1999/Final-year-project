import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Paper } from '@mui/material';

export default function AuthLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
      <Paper elevation={3} sx={{ p: 4, minWidth: 350, maxWidth: 400 }}>
        <Outlet />
      </Paper>
    </Box>
  );
} 