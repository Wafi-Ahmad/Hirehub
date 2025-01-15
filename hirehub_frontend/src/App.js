import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import { ConnectionProvider } from './context/ConnectionContext';
import { PostProvider } from './context/PostContext';
import { JobProvider } from './context/JobContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes';
import SavedJobs from './pages/SavedJobs';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProfileProvider>
          <ConnectionProvider>
            <PostProvider>
              <JobProvider>
                <NotificationProvider>
                  <AppRoutes />
                  <Toaster position="top-right" />
                </NotificationProvider>
              </JobProvider>
            </PostProvider>
          </ConnectionProvider>
        </ProfileProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
