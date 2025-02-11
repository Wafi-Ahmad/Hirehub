import React, { useState } from 'react';
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
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
} from '@mui/material';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import FormInput from '../../components/common/FormInput';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Update the validation schema
const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required')
    .matches(
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      'Invalid email format'
    ),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  user_type: Yup.string()
    .required('Please select user type'),
  company_name: Yup.string()
    .when('user_type', {
      is: 'Company',
      then: () => Yup.string()
        .required('Company name is required')
        .min(2, 'Company name must be at least 2 characters')
        .matches(
          /^[a-zA-Z0-9\s&-]+$/,
          'Company name can only contain letters, numbers, spaces, & and -'
        ),
    }),
  first_name: Yup.string()
    .when('user_type', {
      is: 'Normal',
      then: () => Yup.string()
        .required('First name is required')
        .min(2, 'First name must be at least 2 characters')
        .matches(
          /^[a-zA-Z\s-]+$/,
          'First name can only contain letters, spaces and -'
        ),
    }),
  last_name: Yup.string()
    .when('user_type', {
      is: 'Normal',
      then: () => Yup.string()
        .required('Last name is required')
        .min(2, 'Last name must be at least 2 characters')
        .matches(
          /^[a-zA-Z\s-]+$/,
          'Last name can only contain letters, spaces and -'
        ),
    }),
  date_of_birth: Yup.date()
    .when('user_type', {
      is: 'Normal',
      then: () => Yup.date()
        .required('Date of birth is required')
        .max(new Date(), 'Date of birth cannot be in the future')
        .min(new Date(1900, 0, 1), 'Invalid date of birth')
        .test('age', 'You must be at least 16 years old', function(value) {
          if (!value) return false;
          const cutoff = new Date();
          cutoff.setFullYear(cutoff.getFullYear() - 16);
          return value <= cutoff;
        }),
    }),
});

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      const formattedDate = values.date_of_birth ? 
        new Date(values.date_of_birth).toISOString().split('T')[0] : 
        null;

      const registrationData = {
        email: values.email,
        password: values.password,
        user_type: values.user_type,
        ...(values.user_type === 'Normal' ? {
          first_name: values.first_name,
          last_name: values.last_name,
          date_of_birth: formattedDate
        } : {
          company_name: values.company_name
        })
      };
      
      const response = await api.post('users/register/', registrationData);
      toast.success('Registration successful!');
      navigate('/login');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          'Registration failed';
      toast.error(errorMessage);

      // Set field-specific errors if they exist in the response
      if (error.response?.data) {
        Object.keys(error.response.data).forEach(field => {
          if (field !== 'error' && field !== 'message') {
            setFieldError(field, error.response.data[field]);
          }
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '80vh', py: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Paper elevation={isMobile ? 0 : 1} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 600 }}>
            Create Account
          </Typography>

          <Formik
            initialValues={{
              email: '',
              password: '',
              user_type: 'Normal',
              first_name: '',
              last_name: '',
              company_name: '',
              date_of_birth: ''
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            validateOnChange={true}
            validateOnBlur={true}
          >
            {({ handleSubmit, isSubmitting, values, setFieldValue, touched, errors }) => (
              <form onSubmit={handleSubmit} noValidate>
                {Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                      Please correct the errors below
                    </Alert>
                  </Box>
                )}

                <Box sx={{ my: 2 }}>
                  <RadioGroup
                    row
                    name="user_type"
                    value={values.user_type}
                    onChange={(e) => {
                      setFieldValue('user_type', e.target.value);
                      if (e.target.value === 'Company') {
                        setFieldValue('first_name', '');
                        setFieldValue('last_name', '');
                        setFieldValue('date_of_birth', '');
                      } else {
                        setFieldValue('company_name', '');
                      }
                    }}
                  >
                    <FormControlLabel 
                      value="Normal" 
                      control={<Radio />} 
                      label="Job Seeker" 
                    />
                    <FormControlLabel 
                      value="Company" 
                      control={<Radio />} 
                      label="Employer" 
                    />
                  </RadioGroup>
                </Box>

                <Box sx={{ my: 2 }}>
                  <Field
                    component={FormInput}
                    name="email"
                    type="email"
                    label="Email Address"
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                  />
                </Box>

                <Box sx={{ my: 2 }}>
                  <Field
                    component={FormInput}
                    name="password"
                    type="password"
                    label="Password"
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                  />
                </Box>

                {values.user_type === 'Normal' ? (
                  <>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Field
                          component={FormInput}
                          name="first_name"
                          label="First Name"
                          error={touched.first_name && Boolean(errors.first_name)}
                          helperText={touched.first_name && errors.first_name}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Field
                          component={FormInput}
                          name="last_name"
                          label="Last Name"
                          error={touched.last_name && Boolean(errors.last_name)}
                          helperText={touched.last_name && errors.last_name}
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{ my: 2 }}>
                      <Field
                        component={FormInput}
                        name="date_of_birth"
                        type="date"
                        label="Date of Birth"
                        InputLabelProps={{ shrink: true }}
                        error={touched.date_of_birth && Boolean(errors.date_of_birth)}
                        helperText={touched.date_of_birth && errors.date_of_birth}
                      />
                    </Box>
                  </>
                ) : (
                  <Box sx={{ my: 2 }}>
                    <Field
                      component={FormInput}
                      name="company_name"
                      label="Company Name"
                      error={touched.company_name && Boolean(errors.company_name)}
                      helperText={touched.company_name && errors.company_name}
                    />
                  </Box>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={isSubmitting || (Object.keys(errors).length > 0 && Object.keys(touched).length > 0)}
                  sx={{ mt: 3 }}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?{' '}
                    <Link component={RouterLink} to="/login" color="primary">
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