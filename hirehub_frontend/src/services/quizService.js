import api from './api';

export const quizService = {
    getJobQuiz: async (jobId) => {
        try {
            const response = await api.get(`/jobs/${jobId}/quiz/`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 400) {
                throw error;
            }
            throw error.response?.data || error.message;
        }
    },

    submitQuiz: async (jobId, answers) => {
        try {
            const response = await api.post(`/jobs/${jobId}/quiz/submit/`, { answers });
            return response.data;
        } catch (error) {
            console.error('Quiz submission error:', error.response?.data || error);
            throw error.response?.data || error.message;
        }
    },

    getQuizResult: async (jobId) => {
        try {
            const response = await api.get(`/jobs/${jobId}/quiz/result/`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getJobApplicants: async (jobId) => {
        try {
            const response = await api.get(`/jobs/${jobId}/applicants/`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    uploadCV: async (cvFile) => {
        try {
            const formData = new FormData();
            formData.append('cv_file', cvFile);
            const response = await api.post('/users/cv/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getCVInfo: async () => {
        try {
            const response = await api.get('/users/cv/');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
};