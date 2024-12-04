import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import { ConnectionProvider } from './context/ConnectionContext';
import { PostProvider } from './context/PostContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppRoutes from './routes';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProfileProvider>
          <ConnectionProvider>
            <PostProvider>
              <AppRoutes />
              <ToastContainer position="top-right" autoClose={5000} />
            </PostProvider>
          </ConnectionProvider>
        </ProfileProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
