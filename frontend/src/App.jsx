import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';

// Lazy load components for better performance
const MainLayout = React.lazy(() => import('./layouts/MainLayout'));
const AuthLayout = React.lazy(() => import('./layouts/AuthLayout'));
const SignupPage = React.lazy(() => import('./pages/SignupPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ContestListPage = React.lazy(() => import('./pages/ContestListPage'));
const ContestDetailPage = React.lazy(() => import('./pages/ContestDetailPage'));
const CreateContestPage = React.lazy(() => import('./pages/CreateContestPage'));
const SharedContestPage = React.lazy(() => import('./pages/SharedContestPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// Loading component
const Loading = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="100vh"
    bgcolor="background.default"
  >
    <CircularProgress color="primary" />
  </Box>
);

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Box 
            sx={{ 
              p: 4, 
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 1,
              textAlign: 'center'
            }}
          >
            <Typography variant="h4" color="error" gutterBottom>
              Something went wrong
            </Typography>
            <Typography paragraph>
              We're sorry, but an unexpected error occurred.
            </Typography>
            {process.env.NODE_ENV === 'development' && (
              <Box 
                component="details" 
                sx={{ 
                  textAlign: 'left',
                  mt: 2,
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto'
                }}
              >
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo?.componentStack}
              </Box>
            )}
            <Button 
              variant="contained" 
              color="primary" 
              onClick={this.handleReset}
              sx={{ mt: 3 }}
            >
              Try Again
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

// Protected Route
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');
  
  if (!isAuthenticated) {
    // Redirect to login page, saving the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public Route - Redirects to dashboard if already authenticated
const PublicRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <CssBaseline />
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public Routes */}
          <Route 
            element={
              <PublicRoute>
                <AuthLayout />
              </PublicRoute>
            }
          >
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          {/* Protected Routes */}
          <Route 
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="/" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/contests" element={<ContestListPage />} />
            <Route path="/contests/create" element={<CreateContestPage />} />
            <Route path="/contests/share/:shareId" element={<SharedContestPage />} />
            <Route path="/contests/:id" element={<ContestDetailPage />} />
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
