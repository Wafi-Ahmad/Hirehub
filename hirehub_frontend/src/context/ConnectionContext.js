import React, { createContext, useContext, useState, useCallback } from 'react';
import connectionService from '../services/connectionService';

const ConnectionContext = createContext();

export const ConnectionProvider = ({ children }) => {
  const [connections, setConnections] = useState({
    sent: [],
    received: [],
    connected: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendConnectionRequest = useCallback(async (receiverId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await connectionService.sendRequest(receiverId);
      setConnections(prev => ({
        ...prev,
        sent: [...prev.sent, { id: response.request_id, receiverId }]
      }));
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConnectionRequest = useCallback(async (requestId, action) => {
    try {
      setLoading(true);
      setError(null);
      const response = await connectionService.handleRequest(requestId, action);
      // Update connections state based on action
      if (action === 'ACCEPT') {
        setConnections(prev => ({
          ...prev,
          connected: [...prev.connected, requestId],
          received: prev.received.filter(req => req.id !== requestId)
        }));
      } else {
        setConnections(prev => ({
          ...prev,
          received: prev.received.filter(req => req.id !== requestId)
        }));
      }
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    connections,
    loading,
    error,
    sendConnectionRequest,
    handleConnectionRequest
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
}; 