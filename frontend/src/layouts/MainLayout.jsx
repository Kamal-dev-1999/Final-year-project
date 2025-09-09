import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemText, Box, CssBaseline } from '@mui/material';

const drawerWidth = 240;
const ORANGE = '#FFA116';
const DARK = '#262626';
const LIGHT_BG = '#F7F9FC';

const navItems = [
  { text: 'Dashboard', path: '/' },
  { text: 'Contests', path: '/contests' },
  { text: 'Create Contest', path: '/contests/create' },
  { text: 'Profile', path: '/profile' },
];

function isAuthenticated() {
  return !!localStorage.getItem('token');
}

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      background: LIGHT_BG, 
      minHeight: '100vh',
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: '#fff',
          color: DARK,
          borderBottom: '1px solid #E0E3E7',
          width: '100%',
        }}
      >
        <Box sx={{ 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}>
          <Toolbar sx={{ 
            maxWidth: '1200px', 
            width: '100%', 
            margin: '0 auto',
            px: { xs: 2, sm: 3 },
            py: 1,
          }}>
            <Typography variant="h5" noWrap component="div" sx={{ fontWeight: 700, color: ORANGE }}>
              Coding Contest Platform
            </Typography>
          </Toolbar>
        </Box>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: '#fff',
            borderRight: '1px solid #E0E3E7',
            boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
            pt: 1,
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2, px: 2 }}>
          <List sx={{ py: 1 }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem
                  button
                  key={item.text}
                  component={Link}
                  to={item.path}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    fontWeight: 600,
                    color: isActive ? ORANGE : DARK,
                    background: isActive ? 'rgba(255,161,22,0.08)' : 'transparent',
                    '&:hover': {
                      color: ORANGE,
                      background: 'rgba(255,161,22,0.12)',
                    },
                    transition: 'all 0.2s ease',
                    py: 1.5,
                  }}
                >
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                    }}
                  />
                </ListItem>
              );
            })}
            {!authenticated && (
              <>
                <ListItem
                  button
                  key="Login"
                  component={Link}
                  to="/login"
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    fontWeight: 600,
                    color: location.pathname === '/login' ? ORANGE : DARK,
                    background: location.pathname === '/login' ? 'rgba(255,161,22,0.08)' : 'transparent',
                    '&:hover': {
                      color: ORANGE,
                      background: 'rgba(255,161,22,0.12)',
                    },
                    transition: 'all 0.2s ease',
                    py: 1.5,
                  }}
                >
                  <ListItemText
                    primary="Login"
                    primaryTypographyProps={{
                      fontWeight: location.pathname === '/login' ? 700 : 500,
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                    }}
                  />
                </ListItem>
                <ListItem
                  button
                  key="Signup"
                  component={Link}
                  to="/signup"
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    fontWeight: 600,
                    color: location.pathname === '/signup' ? ORANGE : DARK,
                    background: location.pathname === '/signup' ? 'rgba(255,161,22,0.08)' : 'transparent',
                    '&:hover': {
                      color: ORANGE,
                      background: 'rgba(255,161,22,0.12)',
                    },
                    transition: 'all 0.2s ease',
                    py: 1.5,
                  }}
                >
                  <ListItemText
                    primary="Signup"
                    primaryTypographyProps={{
                      fontWeight: location.pathname === '/signup' ? 700 : 500,
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                    }}
                  />
                </ListItem>
              </>
            )}
            {authenticated && (
              <ListItem
                button
                key="Logout"
                onClick={handleLogout}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  fontWeight: 600,
                  color: DARK,
                  background: 'transparent',
                  '&:hover': {
                    color: ORANGE,
                    background: 'rgba(255,161,22,0.12)',
                  },
                  transition: 'all 0.2s ease',
                  py: 1.5,
                }}
              >
                <ListItemText
                  primary="Logout"
                  primaryTypographyProps={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                  }}
                />
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${drawerWidth}px)`,
          mt: 8,
          background: LIGHT_BG,
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
} 