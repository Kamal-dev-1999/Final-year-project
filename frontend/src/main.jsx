import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import theme from './theme';
import App from './App';
import './index.css';

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>Please refresh the page or contact support if the problem persists.</p>
          <pre style={{ color: 'red' }}>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Initial render
function Main() {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ErrorBoundary>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}

// Get the root element
const container = document.getElementById('root');

if (!container) {
  console.error('Failed to find the root element');
} else {
  try {
    // Create a root
    const root = createRoot(container);
    // Render the app
    root.render(<Main />);
  } catch (error) {
    console.error('Failed to render the app:', error);
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <h2>Failed to load the application</h2>
        <p>Please refresh the page or contact support if the problem persists.</p>
        <pre style="color: red">${error?.toString()}</pre>
      </div>
    `;
  }
}

