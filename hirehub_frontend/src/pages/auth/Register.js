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
} from '@mui/material';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import FormInput from '../../components/common/FormInput';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Simple frontend validation
const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required'),
  user_type: Yup.string()
    .required('Please select user type'),
  company_name: Yup.string()
    .when('user_type', {
      is: 'Company',
      then: () => Yup.string().required('Company name is required'),
      otherwise: () => Yup.string()
    }),
  first_name: Yup.string()
    .when('user_type', {
      is: 'Normal',
      then: () => Yup.string().required('First name is required'),
      otherwise: () => Yup.string()
    }),
  last_name: Yup.string()
    .when('user_type', {
      is: 'Normal',
      then: () => Yup.string().required('Last name is required'),
      otherwise: () => Yup.string()
    })
}).test('at-least-one-name', null, function(value) {
  if (value.user_type === 'Company' && !value.company_name) {
    return new Yup.ValidationError('Company name is required', null, 'company_name');
  }
  if (value.user_type === 'Normal' && (!value.first_name || !value.last_name)) {
    return new Yup.ValidationError(
      'First name and last name are required',
      null,
      value.first_name ? 'last_name' : 'first_name'
    );
  }
  return true;
});

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Format the date to match Django's expected format (YYYY-MM-DD)
      const formattedDate = values.date_of_birth ? 
        new Date(values.date_of_birth).toISOString().split('T')[0] : 
        null;

      // Prepare the data exactly as your Django backend expects it
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

      console.log('Sending registration data:', registrationData);
      
      const response = await api.post('users/register/', registrationData);
      console.log('Registration response:', response.data);
      
      toast.success('Registration successful!');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error.response?.data || error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          'Registration failed';
      toast.error(errorMessage);
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
          >
            {({ handleSubmit, isSubmitting, values, setFieldValue }) => (
              <form onSubmit={handleSubmit} noValidate>
                <Box sx={{ my: 2 }}>
                  <RadioGroup
                    row
                    name="user_type"
                    value={values.user_type}
                    onChange={(e) => {
                      setFieldValue('user_type', e.target.value);
                      // Clear fields when switching user type
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
                  />
                </Box>

                <Box sx={{ my: 2 }}>
                  <Field
                    component={FormInput}
                    name="password"
                    type="password"
                    label="Password"
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
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Field
                          component={FormInput}
                          name="last_name"
                          label="Last Name"
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
                      />
                    </Box>
                  </>
                ) : (
                  <Box sx={{ my: 2 }}>
                    <Field
                      component={FormInput}
                      name="company_name"
                      label="Company Name"
                    />
                  </Box>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={isSubmitting}
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