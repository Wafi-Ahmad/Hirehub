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
  Alert,
} from '@mui/material';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import FormInput from '../../components/common/FormInput';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import backgroundImage from '../../assets/background.png';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Please enter a valid email address')
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

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      const response = await api.post('/users/login/', values);
      
      if (response.data.access) {
        await login(response.data);
        toast.success('Login successful!');
        navigate('/home');
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 400) {
        setFieldError('email', ' ');
        setFieldError('password', 'Invalid email or password. Please try again.');
        toast.error('Invalid credentials. Please check your email and password.');
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
        if (error.response.data.email) {
          setFieldError('email', error.response.data.email);
        }
        if (error.response.data.password) {
          setFieldError('password', error.response.data.password);
        }
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box 
      sx={{ 
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        bgcolor: "#f5f5f5",
        "&::before": {
          content: '""',
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "45%",
          height: "85%",
          background: `url(${backgroundImage}) no-repeat bottom right`,
          backgroundSize: "contain",
          zIndex: 0,
          opacity: 0.9
        }
      }}
    >
      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <Paper 
            elevation={isMobile ? 0 : 2} 
            sx={{ 
              p: 4,  
              border: 2,
              borderRadius: 2,
              borderColor: "rgba(0,0,0,0.27)",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(5px)",
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.07)"
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 600 }}>
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
              Enter your credentials to access your account
            </Typography>

            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              validateOnChange={true}
              validateOnBlur={true}
            >
              {({ handleSubmit, isSubmitting, touched, errors }) => (
                <form onSubmit={handleSubmit} noValidate>
                  {((Object.keys(errors).length > 0 && touched.email && touched.password) || 
                    (errors.password && errors.password.includes('Invalid email or password'))) && (
                    <Box sx={{ mb: 2 }}>
                      <Alert 
                        severity="error" 
                        sx={{ 
                          mb: 2,
                          '& .MuiAlert-message': {
                            width: '100%'
                          }
                        }}
                      >
                        {errors.password && errors.password.includes('Invalid email or password') 
                          ? 'Invalid credentials. Please check your email and password.'
                          : 'Please correct the errors below'}
                      </Alert>
                    </Box>
                  )}

                  <Box sx={{ mb: 3 }}>
                    <Field
                      component={FormInput}
                      name="email"
                      type="email"
                      label="Email Address"
                      autoComplete="email"
                      error={touched.email && (Boolean(errors.email) || Boolean(errors.password))}
                      helperText={touched.email && errors.email}
                    />
                  </Box>

                  <Box sx={{ mb: 4 }}>
                    <Field
                      component={FormInput}
                      name="password"
                      type="password"
                      label="Password"
                      autoComplete="current-password"
                      error={touched.password && (Boolean(errors.password) || Boolean(errors.email))}
                      helperText={touched.password && errors.password}
                    />
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={isSubmitting || (Object.keys(errors).length > 0 && Object.keys(touched).length > 0)}
                    sx={{ mb: 2 }}
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                  </Button>

                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Link component={RouterLink} to="/forgot-password" color="primary" underline="hover">
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
                      <Link component={RouterLink} to="/register" color="primary" underline="hover">
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
    </Box>
  );
};

export default Login; 