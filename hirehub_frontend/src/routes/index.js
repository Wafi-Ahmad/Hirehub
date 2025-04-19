import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProtectedRoute from './ProtectedRoute';
import QuizUI from '../components/quiz/_QuizUI';
import JobQuiz from '../pages/jobs/JobQuiz';

// Lazy load pages for better performance
const Login = React.lazy(() => import('../pages/auth/Login'));
const Register = React.lazy(() => import('../pages/auth/Register'));
const ForgotPassword = React.lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('../pages/auth/ResetPassword'));
const Home = React.lazy(() => import('../pages/Home'));
const Profile = React.lazy(() => import('../pages/profile/Profile'));
const Jobs = React.lazy(() => import('../pages/jobs/Jobs'));
const PostJob = React.lazy(() => import('../pages/post-job/PostJob'));
const JobDetails = React.lazy(() => import('../pages/jobs/JobDetails'));
const Network = React.lazy(() => import('../pages/network/Network'));
const SavedJobs = React.lazy(() => import('../pages/SavedJobs'));
const NotFound = React.lazy(() => import('../pages/NotFound'));
const Unauthorized = React.lazy(() => import('../pages/Unauthorized'));
const MessagesPage = React.lazy(() => import('../pages/messages/MessagesPage'));

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public Routes - No Layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes - With Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <Layout>
                <Jobs />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/create"
          element={
            <ProtectedRoute allowedUserTypes={['Company']}>
              <Layout>
                <PostJob />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/edit/:id"
          element={
            <ProtectedRoute allowedUserTypes={['Company']}>
              <Layout>
                <PostJob />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <JobDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/network"
          element={
            <ProtectedRoute>
              <Layout>
                <Network />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved-jobs"
          element={
            <ProtectedRoute>
              <Layout>
                <SavedJobs />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <Layout>
                <QuizUI />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:jobId/quiz"
          element={
            <ProtectedRoute>
              <Layout>
                <JobQuiz />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Messages Routes */}
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Layout>
                <MessagesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:conversationId"
          element={
            <ProtectedRoute>
              <Layout>
                <MessagesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes; 