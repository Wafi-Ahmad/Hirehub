import axios from 'axios';
import { API_BASE_URL } from '../config';

const JOB_API = `${API_BASE_URL}/jobs`;

// Add auth token interceptor
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class JobService {
  // Get all jobs with optional filters and pagination
  async getJobs(params = {}) {
    const queryParams = new URLSearchParams();
    
    // Handle parameters
    Object.entries(params).forEach(([key, value]) => {
      if (key === 'skills' && Array.isArray(value)) {
        // Add each skill as a separate query parameter
        value.forEach(skill => {
          queryParams.append('skills', skill);
        });
      } else if (value) {
        queryParams.append(key, value);
      }
    });

    return axios.get(`${JOB_API}?${queryParams.toString()}`);
  }

  // Get a single job by ID
  async getJobById(id) {
    return axios.get(`${JOB_API}/${id}`);
  }

  // Create a new job posting
  async createJob(jobData) {
    // Process skills array into proper format if needed
    const formattedData = {
      ...jobData,
      required_skills: Array.isArray(jobData.required_skills) 
        ? jobData.required_skills 
        : jobData.required_skills.split(',').map(s => s.trim())
    };
    
    return axios.post(`${JOB_API}/create/`, formattedData);
  }

  // Update an existing job
  async updateJob(id, jobData) {
    // Process skills array into proper format if needed
    const formattedData = {
      ...jobData,
      required_skills: Array.isArray(jobData.required_skills) 
        ? jobData.required_skills 
        : jobData.required_skills.split(',').map(s => s.trim())
    };
    
    return axios.put(`${JOB_API}/${id}/`, formattedData);
  }

  // Delete a job posting
  async deleteJob(id) {
    return axios.delete(`${JOB_API}/${id}/`);
  }

  // Save a job for later
  async saveJob(id) {
    return axios.post(`${JOB_API}/${id}/save/`);
  }

  // Provide feedback on job recommendation
  async provideFeedback(id, feedback) {
    return axios.post(`${JOB_API}/${id}/feedback/`, feedback);
  }
}

export const jobService = new JobService(); 