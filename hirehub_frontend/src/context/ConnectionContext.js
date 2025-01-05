import React, { createContext, useContext, useState } from 'react';
import connectionService from '../services/connectionService';
import { toast } from 'react-toastify';

const ConnectionContext = createContext();

export const ConnectionProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);

    const handleConnectionRequest = async (requestId, action) => {
        setLoading(true);
        try {
            await connectionService.handleRequest(requestId, action);
            toast.success(`Connection request ${action.toLowerCase()}ed successfully`);
            return true;
        } catch (error) {
            console.error('Error handling connection request:', error);
            toast.error(error.response?.data?.error || 'Failed to handle connection request');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return (
        <ConnectionContext.Provider value={{
            loading,
            handleConnectionRequest
        }}>
            {children}
        </ConnectionContext.Provider>
    );
};

export const useConnection = () => useContext(ConnectionContext); 