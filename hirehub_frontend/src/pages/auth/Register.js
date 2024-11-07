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
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import FormInput from '../../components/common/FormInput';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const validationSchema = Yup.object({
  firstName: Yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: Yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
});

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const { confirmPassword, ...registrationData } = values;
      const response = await api.post('/register/', registrationData);
      login(response.data.token, response.data.user);
      toast.success('Welcome to HireHub!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
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
            Create Account
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ mb: 4 }}
          >
            Join HireHub and start your professional journey
          </Typography>

          <Formik
            initialValues={{
              firstName: '',
              lastName: '',
              email: '',
              password: '',
              confirmPassword: '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleSubmit, isSubmitting }) => (
              <form onSubmit={handleSubmit} noValidate>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Field
                      component={FormInput}
                      name="firstName"
                      label="First Name"
                      autoComplete="given-name"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      component={FormInput}
                      name="lastName"
                      label="Last Name"
                      autoComplete="family-name"
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mb: 3 }}>
                  <Field
                    component={FormInput}
                    name="email"
                    type="email"
                    label="Email Address"
                    autoComplete="email"
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Field
                    component={FormInput}
                    name="password"
                    type="password"
                    label="Password"
                    autoComplete="new-password"
                  />
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Field
                    component={FormInput}
                    name="confirmPassword"
                    type="password"
                    label="Confirm Password"
                    autoComplete="new-password"
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
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?{' '}
                    <Link
                      component={RouterLink}
                      to="/login"
                      color="primary"
                      underline="hover"
                    >
                      Sign in
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

export default Register; 