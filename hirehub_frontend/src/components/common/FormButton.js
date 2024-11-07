import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import PropTypes from 'prop-types';

const FormButton = ({ children, isSubmitting, ...props }) => {
  return (
    <Button
      {...props}
      disabled={isSubmitting}
      sx={{
        height: 48,
        position: 'relative',
        ...props.sx,
      }}
    >
      {isSubmitting ? (
        <CircularProgress
          size={24}
          sx={{
            color: 'inherit',
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '-12px',
            marginLeft: '-12px',
          }}
        />
      ) : (
        children
      )}
    </Button>
  );
};

FormButton.propTypes = {
  children: PropTypes.node.isRequired,
  isSubmitting: PropTypes.bool,
};

export default FormButton; 