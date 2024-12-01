import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProtectedRoute = ({ children, allowedUserTypes }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Save the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedUserTypes && !allowedUserTypes.includes(user?.userType)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedUserTypes: PropTypes.arrayOf(PropTypes.string)
};

export default ProtectedRoute; 