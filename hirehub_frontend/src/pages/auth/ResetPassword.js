import React from 'react';
import { Formik, Field } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import FormInput from '../../components/common/FormInput';
import api from '../../services/api';

const validationSchema = Yup.object({
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

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await api.post('/auth/reset-password/', {
        token,
        password: values.password,
      });
      toast.success('Password reset successful! Please login with your new password.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset failed');
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
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ mb: 4 }}
          >
            Please enter your new password
          </Typography>

          <Formik
            initialValues={{
              password: '',
              confirmPassword: '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleSubmit, isSubmitting }) => (
              <form onSubmit={handleSubmit} noValidate>
                <Box sx={{ mb: 3 }}>
                  <Field
                    component={FormInput}
                    name="password"
                    type="password"
                    label="New Password"
                    autoComplete="new-password"
                  />
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Field
                    component={FormInput}
                    name="confirmPassword"
                    type="password"
                    label="Confirm New Password"
                    autoComplete="new-password"
                  />
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                </Button>
              </form>
            )}
          </Formik>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword; 