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
    
    // Get user profile for recommendations
    const userStr = localStorage.getItem('user');
    let user = null;
    try {
      user = JSON.parse(userStr);
      console.log('Current user:', user);
    } catch (error) {
      console.error('Error parsing user data:', error);
    }

    // Handle parameters
    Object.entries(params).forEach(([key, value]) => {
      if (key === 'skills' && Array.isArray(value)) {
        value.forEach(skill => {
          queryParams.append('skills', skill);
        });
      } else if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    // Add user data for recommendations if user is normal type
    if (user?.user_type === 'Normal') {
      console.log('Adding recommendation data for normal user');
      
      // Add user profile data for recommendations
      if (params.recommended) {
        queryParams.set('recommended', 'true');
      }
      
      if (params.followed_only) {
        queryParams.set('followed_only', 'true');
      }
      
      queryParams.set('user_id', user.id.toString());
      
      // Send skills as a JSON string to preserve array structure
      if (user.skills?.length > 0) {
        queryParams.set('user_skills', JSON.stringify(user.skills));
      }
      
      if (user.experience) {
        queryParams.set('user_experience', user.experience);
      }

      console.log('Final query params:', queryParams.toString());
    }

    try {
      const response = await axios.get(`${JOB_API}?${queryParams.toString()}`);
      console.log('Jobs response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  }

  // Get a single job by ID
  async getJobById(id) {
    try {
      const response = await axios.get(`${JOB_API}/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching job:', error);
      throw error;
    }
  }

  // Create a new job posting
  async createJob(jobData) {
    try {
      const formattedData = {
        ...jobData,
        required_skills: Array.isArray(jobData.required_skills) 
          ? jobData.required_skills 
          : jobData.required_skills.split(',').map(s => s.trim())
      };
      
      const response = await axios.post(`${JOB_API}/`, formattedData);
      return response;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  }

  // Update an existing job
  async updateJob(id, jobData) {
    try {
      const formattedData = {
        ...jobData,
        required_skills: Array.isArray(jobData.required_skills) 
          ? jobData.required_skills 
          : jobData.required_skills.split(',').map(s => s.trim())
      };
      
      const response = await axios.put(`${JOB_API}/${id}/`, formattedData);
      return response;
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  }

  // Delete a job posting
  async deleteJob(id) {
    try {
      const response = await axios.delete(`${JOB_API}/${id}/`);
      return response;
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  }

  // Save a job for later
  async saveJob(id) {
    try {
      const response = await axios.post(`${JOB_API}/${id}/save/`);
      return response.data;
    } catch (error) {
      console.error('Error saving job:', error);
      throw error.response?.data || { message: 'Failed to save job' };
    }
  }

  // Provide feedback on job recommendation
  async provideFeedback(id, feedback) {
    try {
      const response = await axios.post(`${JOB_API}/${id}/feedback/`, feedback);
      return response;
    } catch (error) {
      console.error('Error providing feedback:', error);
      throw error;
    }
  }

  // Get job applicants
  async getJobApplicants(jobId) {
    try {
      const response = await axios.get(`${JOB_API}/${jobId}/applicants/`);
      return response;
    } catch (error) {
      console.error('Error fetching applicants:', error);
      throw error;
    }
  }

  // Send job offer to applicant
  async sendJobOffer(jobId, applicantId) {
    try {
      const response = await axios.post(`${JOB_API}/${jobId}/send-offer/${applicantId}/`);
      return response;
    } catch (error) {
      console.error('Error sending job offer:', error);
      throw error;
    }
  }

  // Get recommended jobs
  async getRecommendedJobs(cursor = null) {
    try {
      const queryParams = new URLSearchParams();
      if (cursor) {
        queryParams.append('cursor', cursor);
      }
      queryParams.append('recommended', 'true');
      
      const response = await axios.get(`${JOB_API}?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching recommended jobs:', error);
      throw error;
    }
  }
}

export const jobService = new JobService(); 

export const saveJob = async (jobId) => {
  try {
    const response = await axios.post(`${JOB_API}/${jobId}/save/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to save job' };
  }
};

export const getSavedJobs = async () => {
  try {
    const response = await axios.get(`${JOB_API}/saved/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}; 