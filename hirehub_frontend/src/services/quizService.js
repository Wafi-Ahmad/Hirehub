import api from './api';

export const quizService = {
    getJobQuiz: async (jobId) => {
        try {
            const response = await api.get(`/jobs/${jobId}/quiz/`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    submitQuiz: async (quizId, answers) => {
        try {
            const response = await api.post(`/jobs/quiz/${quizId}/submit/`, { answers });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    getQuizResult: async (quizId) => {
        try {
            const response = await api.get(`/jobs/quiz/${quizId}/result/`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
}; 