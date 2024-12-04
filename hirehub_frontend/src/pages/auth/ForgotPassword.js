import React, { useState } from 'react';
import { Formik, Field } from 'formik';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Link,
  Paper,
  useTheme,
  useMediaQuery,
  Alert,
} from '@mui/material';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import FormInput from '../../components/common/FormInput';
import api from '../../services/api';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

const ForgotPassword = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await api.post('/users/password-reset/', {
        email: values.email
      });
      setEmailSent(true);
      setSentEmail(values.email);
      toast.success('Password reset instructions have been sent to your email');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail ||
                          'Failed to send reset instructions. Please try again.';
      toast.error(errorMessage);
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
            Reset Password
          </Typography>
          
          {emailSent ? (
            <>
              <Alert severity="success" sx={{ mb: 3 }}>
                We've sent reset instructions to {sentEmail}
              </Alert>
              <Typography
                variant="body1"
                color="text.secondary"
                align="center"
                sx={{ mb: 4 }}
              >
                Please check your email and follow the instructions to reset your password.
                If you don't see the email, please check your spam folder.
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                component={RouterLink}
                to="/login"
                sx={{ mt: 2 }}
              >
                Back to Login
              </Button>
            </>
          ) : (
            <>
              <Typography
                variant="body1"
                color="text.secondary"
                align="center"
                sx={{ mb: 4 }}
              >
                Enter your email address and we'll send you instructions to reset your password
              </Typography>

              <Formik
                initialValues={{ email: '' }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ handleSubmit, isSubmitting }) => (
                  <form onSubmit={handleSubmit} noValidate>
                    <Box sx={{ mb: 4 }}>
                      <Field
                        component={FormInput}
                        name="email"
                        type="email"
                        label="Email Address"
                        autoComplete="email"
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
                      {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
                    </Button>

                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Remember your password?{' '}
                        <Link
                          component={RouterLink}
                          to="/login"
                          color="primary"
                          underline="hover"
                        >
                          Back to login
                        </Link>
                      </Typography>
                    </Box>
                  </form>
                )}
              </Formik>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword; 