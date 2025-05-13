import api from './api';

export const interviewService = {
    /**
     * Schedule an interview for a job applicant
     * @param {number} jobId - The ID of the job
     * @param {number} applicantId - The ID of the applicant
     * @param {Object} interviewData - Interview details
     * @returns {Promise} - Promise with interview data
     */
    scheduleInterview: async (jobId, applicantId, interviewData) => {
        try {
            const response = await api.post(`/interviews/schedule/${jobId}/${applicantId}/`, interviewData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to schedule interview' };
        }
    },

    /**
     * Get all interviews for a specific job
     * @param {number} jobId - The ID of the job
     * @returns {Promise} - Promise with interviews data
     */
    getJobInterviews: async (jobId) => {
        try {
            const response = await api.get(`/interviews/job/${jobId}/`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to get job interviews' };
        }
    },

    /**
     * Get all interviews for the current user
     * @returns {Promise} - Promise with interviews data
     */
    getAllInterviews: async () => {
        try {
            const response = await api.get('/interviews/');
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to get interviews' };
        }
    },

    /**
     * Get upcoming interviews for the current user
     * @returns {Promise} - Promise with upcoming interviews data
     */
    getUpcomingInterviews: async () => {
        try {
            const response = await api.get('/interviews/upcoming/');
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to get upcoming interviews' };
        }
    },

    /**
     * Get completed interviews for the current user
     * @returns {Promise} - Promise with completed interviews data
     */
    getCompletedInterviews: async () => {
        try {
            const response = await api.get('/interviews/completed/');
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to get completed interviews' };
        }
    },

    /**
     * Get details of a specific interview
     * @param {number} interviewId - The ID of the interview
     * @returns {Promise} - Promise with interview details
     */
    getInterviewDetails: async (interviewId) => {
        try {
            const response = await api.get(`/interviews/${interviewId}/`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to get interview details' };
        }
    },

    /**
     * Update an interview
     * @param {number} interviewId - The ID of the interview
     * @param {Object} updateData - Data to update
     * @returns {Promise} - Promise with updated interview data
     */
    updateInterview: async (interviewId, updateData) => {
        try {
            const response = await api.put(`/interviews/${interviewId}/`, updateData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to update interview' };
        }
    },

    /**
     * Cancel an interview
     * @param {number} interviewId - The ID of the interview
     * @param {string} reason - Reason for cancellation
     * @returns {Promise} - Promise with cancelled interview data
     */
    cancelInterview: async (interviewId, reason) => {
        try {
            const response = await api.put(`/interviews/${interviewId}/`, {
                status: 'cancelled',
                cancellation_reason: reason
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to cancel interview' };
        }
    }
}; 