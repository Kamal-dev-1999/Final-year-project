import React from 'react';
import { Formik, Form, Field } from 'formik';
import { TextField, Button, Typography, MenuItem, Box, Card, CardContent, Alert } from '@mui/material';
import * as Yup from 'yup';
import { signup } from '../api/auth';

const ORANGE = '#FFA116';
const DARK = '#262626';

const SignupSchema = Yup.object().shape({
  username: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(6, 'Too Short!').required('Required'),
  role: Yup.string().oneOf(['student', 'admin']).required('Required'),
  branch: Yup.string().when('role', {
    is: 'student',
    then: Yup.string().required('Required'),
    otherwise: Yup.string().notRequired(),
  }),
  year: Yup.number().when('role', {
    is: 'student',
    then: Yup.number().required('Required').min(1).max(5),
    otherwise: Yup.number().notRequired(),
  }),
});

export default function SignupPage() {
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
        maxWidth: 500, 
        width: '100%', 
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid #E0E3E7',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: DARK, mb: 3, textAlign: 'center' }}>
            Sign Up
          </Typography>
          <Formik
            initialValues={{ username: '', email: '', password: '', role: '', branch: '', year: '' }}
            validationSchema={SignupSchema}
            onSubmit={async (values, { setSubmitting, setStatus }) => {
              try {
                await signup(values);
                setStatus({ success: 'Signup successful! Please log in.' });
              } catch (error) {
                setStatus({ error: error.response?.data?.detail || 'Signup failed' });
              }
              setSubmitting(false);
            }}
          >
            {({ isSubmitting, errors, touched, values, handleChange, status }) => (
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
                  name="email"
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  error={touched.email && !!errors.email}
                  helperText={touched.email && errors.email}
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
                  sx={{ mb: 2 }}
                />
                <Field
                  as={TextField}
                  name="role"
                  label="Role"
                  select
                  fullWidth
                  margin="normal"
                  error={touched.role && !!errors.role}
                  helperText={touched.role && errors.role}
                  value={values.role}
                  onChange={handleChange}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Field>
                {values.role === 'student' && (
                  <>
                    <Field
                      as={TextField}
                      name="branch"
                      label="Branch"
                      fullWidth
                      margin="normal"
                      error={touched.branch && !!errors.branch}
                      helperText={touched.branch && errors.branch}
                      sx={{ mb: 2 }}
                    />
                    <Field
                      as={TextField}
                      name="year"
                      label="Year"
                      type="number"
                      fullWidth
                      margin="normal"
                      error={touched.year && !!errors.year}
                      helperText={touched.year && errors.year}
                      sx={{ mb: 3 }}
                    />
                  </>
                )}
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
                  {isSubmitting ? 'Signing up...' : 'Sign Up'}
                </Button>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </Box>
  );
} 