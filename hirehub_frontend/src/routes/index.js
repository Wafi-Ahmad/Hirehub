import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from './ProtectedRoute';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

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

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        {/* Protected Routes */}
        <Route element={<Layout />}>
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/jobs" element={
            <ProtectedRoute>
              <Jobs />
            </ProtectedRoute>
          } />
          <Route path="/network" element={
            <ProtectedRoute>
              <Network />
            </ProtectedRoute>
          } />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes; 