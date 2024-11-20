import React from 'react';
import { Formik, Field } from 'formik';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Link,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import FormInput from '../../components/common/FormInput';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const response = await api.post('/login/', values);
      
      localStorage.setItem('access', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);
      
      login(response.data.access, {
        id: response.data.id,
        email: response.data.user.email,
        userType: response.data.user.user_type,
        firstName: response.data.user.first_name,
        lastName: response.data.user.last_name
      });
      
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 3,
        }}
      >
        <Paper
          elevation={isMobile ? 0 : 1}
          sx={{
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            align="center"
            sx={{ fontWeight: 600 }}
          >
            Welcome Back
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ mb: 4 }}
          >
            Enter your credentials to access your account
          </Typography>

          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleSubmit, isSubmitting }) => (
              <form onSubmit={handleSubmit} noValidate>
                <Box sx={{ mb: 3 }}>
                  <Field
                    component={FormInput}
                    name="email"
                    type="email"
                    label="Email Address"
                    autoComplete="email"
                  />
                </Box>
                <Box sx={{ mb: 4 }}>
                  <Field
                    component={FormInput}
                    name="password"
                    type="password"
                    label="Password"
                    autoComplete="current-password"
                  />
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={isSubmitting}
                  sx={{ mb: 2 }}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    color="primary"
                    underline="hover"
                  >
                    Forgot password?
                  </Link>
                </Box>
                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    OR
                  </Typography>
                </Divider>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Don't have an account?{' '}
                    <Link
                      component={RouterLink}
                      to="/register"
                      color="primary"
                      underline="hover"
                    >
                      Sign up
                    </Link>
                  </Typography>
                </Box>
              </form>
            )}
          </Formik>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 