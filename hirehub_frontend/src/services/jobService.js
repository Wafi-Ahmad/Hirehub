import axios from 'axios';
import { API_BASE_URL } from '../config';

const JOB_API = `${API_BASE_URL}/jobs`;
const QUIZ_API = `${API_BASE_URL}/quizzes`; // Added for potential future quiz-specific calls

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
    console.log('JobService: getJobs called with params:', params);
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
      // Skip followed_only parameter if it's false
      if (key === 'followed_only' && value === false) {
        return;
      }
      
      // Handle skills array
      if (key === 'skills') {
        if (Array.isArray(value) && value.length > 0) {
          // Send each skill as a separate parameter for proper backend handling
          value.forEach(skill => {
            if (skill && skill.trim()) {
              queryParams.append('skills', skill.trim());
            }
          });
        } else if (typeof value === 'string' && value.trim()) {
          // If skills is a comma-separated string, split and send each skill
          const skillsArray = value.split(',').map(s => s.trim()).filter(s => s);
          skillsArray.forEach(skill => {
            queryParams.append('skills', skill);
          });
        }
      } 
      // Handle text search parameters (title, location)
      else if (['title', 'location'].includes(key) && typeof value === 'string') {
        const trimmedValue = value.trim();
        if (trimmedValue) {
          queryParams.append(key, trimmedValue);
        }
      }
      // Handle all other parameters
      else if (value !== null && value !== undefined && value !== '') {
        console.log(`Adding parameter ${key}=${value}`);
        queryParams.append(key, value);
      }
    });

    // Add user data for recommendations if user is normal type
    if (user?.user_type === 'Normal') {
      console.log('Adding recommendation data for normal user');
      
      // Add user profile data for recommendations
      if (params.recommended) {
        queryParams.set('recommended', 'true');
        console.log('Setting recommended=true');
      }
      
      // Only add followed_only when it's explicitly true
      if (params.followed_only === true) {
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
      console.log(`Making GET request to ${JOB_API}?${queryParams.toString()}`);
      const response = await axios.get(`${JOB_API}?${queryParams.toString()}`);
      console.log('Jobs response:', response.data);
      
      // Log recommended jobs count
      if (response.data && response.data.jobs) {
        const recommendedCount = response.data.jobs.filter(job => job.is_recommended).length;
        console.log(`Found ${recommendedCount} recommended jobs out of ${response.data.jobs.length} total jobs`);
      }
      
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

  // --- NEW ADAPTIVE QUIZ METHODS ---

  /**
   * Starts or resumes a quiz attempt for a given job.
   * @param {number | string} jobId The ID of the job.
   * @returns {Promise<object>} Promise resolving to the initial quiz step data (question or finished status).
   */
  async startQuiz(jobId) {
    try {
      console.log(`JobService: Starting quiz for job ${jobId}`);
      const response = await axios.post(`${JOB_API}/${jobId}/quiz/start/`);
      console.log("Quiz start response:", response.data);
      return response.data; // Expected format: { status: 'in_progress'/'finished', question?: {...}, ...results }
    } catch (error) {
      console.error('Error starting quiz:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }

  /**
   * Submits an answer for the current quiz step and gets the next step.
   * @param {number | string} jobId The ID of the job.
   * @param {object} answerData The answer data ({ question_ref, answer_index }).
   * @returns {Promise<object>} Promise resolving to the next quiz step data (question or finished status).
   */
  async submitQuizAnswer(jobId, answerData) {
    try {
      console.log(`JobService: Submitting answer for job ${jobId}:`, answerData);
      const response = await axios.post(`${JOB_API}/${jobId}/quiz/step/`, answerData);
      console.log("Quiz step response:", response.data);
      return response.data; // Expected format: { status: 'in_progress'/'finished', question?: {...}, ...results }
    } catch (error) {
      console.error('Error submitting quiz answer:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }

  /**
    * Gets the result of a completed quiz attempt.
    * @param {number | string} jobId The ID of the job.
    * @returns {Promise<object>} Promise resolving to the quiz result.
    */
  async getQuizResult(jobId) {
    try {
        console.log(`JobService: Getting quiz result for job ${jobId}`);
        const response = await axios.get(`${JOB_API}/${jobId}/quiz/result/`);
        console.log("Quiz result response:", response.data);
        return response.data; // Expected format: { score, passed, completed_at, ... }
    } catch (error) {
        console.error('Error getting quiz result:', error.response?.data || error.message);
        // Handle 404 specifically maybe?
        if (error.response && error.response.status === 404) {
            console.log('No completed quiz attempt found.');
            return null; // Indicate no result found
        }
        throw error.response?.data || error;
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