import React from 'react';
import { Formik, Form, Field } from 'formik';
import { TextField, Button, Typography, Box, Card, CardContent, Alert } from '@mui/material';
import * as Yup from 'yup';
import { login } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const ORANGE = '#FFA116';
const DARK = '#262626';

const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Required'),
  password: Yup.string().required('Required'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#F7F9FC',
      p: 3
    }}>
      <Card sx={{ 
        maxWidth: 400, 
        width: '100%', 
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid #E0E3E7',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: DARK, mb: 3, textAlign: 'center' }}>
            Login
          </Typography>
          <Formik
            initialValues={{ username: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={async (values, { setSubmitting, setStatus }) => {
              try {
                console.log('Attempting login with:', values);
                const response = await login(values);
                console.log('Login response:', response);
                
                // Check if we got a token in the response
                const token = response.data?.access;
                if (token) {
                  // Store the token if it's in the response
                  localStorage.setItem('token', token);
                  
                  // If user data is in the response, store it
                  if (response.data?.user) {
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                  }
                  
                  setStatus({ success: 'Login successful!' });
                  navigate('/'); // Redirect to dashboard
                } else {
                  setStatus({ error: 'No access token received' });
                }
              } catch (error) {
                console.error('Login error:', error);
                const errorMessage = error.response?.data?.detail || 
                                  error.response?.data?.message || 
                                  error.message || 
                                  'Login failed';
                setStatus({ error: errorMessage });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, errors, touched, status }) => (
              <Form>
                {status?.error && <Alert severity="error" sx={{ mb: 3 }}>{status.error}</Alert>}
                {status?.success && <Alert severity="success" sx={{ mb: 3 }}>{status.success}</Alert>}
                <Field
                  as={TextField}
                  name="username"
                  label="Username"
                  fullWidth
                  margin="normal"
                  error={touched.username && !!errors.username}
                  helperText={touched.username && errors.username}
                  sx={{ mb: 2 }}
                />
                <Field
                  as={TextField}
                  name="password"
                  label="Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  error={touched.password && !!errors.password}
                  helperText={touched.password && errors.password}
                  sx={{ mb: 3 }}
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  fullWidth 
                  sx={{ 
                    mt: 2,
                    backgroundColor: ORANGE,
                    '&:hover': { backgroundColor: '#e59114' },
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600
                  }} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </Button>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </Box>
  );
} 