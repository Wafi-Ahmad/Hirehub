import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from './ProtectedRoute';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { USER_TYPES } from '../utils/permissions';

// Lazy load pages for better performance
const Login = React.lazy(() => import('../pages/auth/Login'));
const Register = React.lazy(() => import('../pages/auth/Register'));
const ForgotPassword = React.lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('../pages/auth/ResetPassword'));
const Home = React.lazy(() => import('../pages/Home'));
const Profile = React.lazy(() => import('../pages/profile/Profile'));
const Jobs = React.lazy(() => import('../pages/jobs/Jobs'));
const Network = React.lazy(() => import('../pages/network/Network'));
const NotFound = React.lazy(() => import('../pages/NotFound'));
const Applications = React.lazy(() => import('../pages/applications/Applications'));
const PostJob = React.lazy(() => import('../pages/post-job/PostJob'));
const Unauthorized = React.lazy(() => import('../pages/Unauthorized'));

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        {/* Protected Routes */}
        <Route element={<Layout />}>
          {/* Home Route */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute allowedUserTypes={[USER_TYPES.NORMAL, USER_TYPES.COMPANY]}>
                <Home />
              </ProtectedRoute>
            } 
          />

          {/* Normal User Routes */}
          <Route
            path="/applications"
            element={
              <ProtectedRoute allowedUserTypes={USER_TYPES.NORMAL}>
                <Applications />
              </ProtectedRoute>
            }
          />

          {/* Company User Routes */}
          <Route
            path="/post-job"
            element={
              <ProtectedRoute allowedUserTypes={USER_TYPES.COMPANY}>
                <PostJob />
              </ProtectedRoute>
            }
          />

          {/* Common Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedUserTypes={[USER_TYPES.NORMAL, USER_TYPES.COMPANY]}>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes; 