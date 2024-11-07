import React from 'react';
import { TextField } from '@mui/material';
import PropTypes from 'prop-types';

const FormInput = ({ field, form: { touched, errors }, ...props }) => {
  return (
    <TextField
      {...field}
      {...props}
      fullWidth
      variant="outlined"
      error={touched[field.name] && Boolean(errors[field.name])}
      helperText={touched[field.name] && errors[field.name]}
      sx={{
        '& .MuiOutlinedInput-root': {
          backgroundColor: '#ffffff',
          '& fieldset': {
            borderColor: 'rgba(0, 0, 0, 0.15)',
          },
          '&:hover fieldset': {
            borderColor: 'rgba(0, 0, 0, 0.25)',
          },
          '&.Mui-focused fieldset': {
            borderColor: 'primary.main',
            borderWidth: '1px',
          },
        },
        '& .MuiInputLabel-root': {
          color: 'text.secondary',
        },
      }}
    />
  );
};

FormInput.propTypes = {
  field: PropTypes.object.isRequired,
  form: PropTypes.object.isRequired,
};

export default FormInput; 