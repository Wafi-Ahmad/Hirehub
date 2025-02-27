import React, { createContext, useContext, useState, useCallback } from 'react';
import { jobService } from '../services/jobService';
import toast from 'react-hot-toast';

const JobContext = createContext();

export const JobProvider = ({ children }) => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);

  const getJobs = useCallback(async (filters) => {
    setLoading(true);
    setError(null);
    try {
      console.log('JobContext: Fetching jobs with filters:', filters);
      const response = await jobService.getJobs(filters);
      console.log('JobContext: Jobs response:', response.data);
      
      if (filters.cursor) {
        console.log('JobContext: Appending jobs to existing list');
        setJobs(prev => [...prev, ...response.data.jobs]);
      } else {
        console.log('JobContext: Setting new jobs list');
        setJobs(response.data.jobs);
      }
      setNextCursor(response.data.next_cursor);
      
      // Return the response for direct use
      return response;
    } catch (error) {
      console.error('JobContext: Error fetching jobs:', error);
      setError(error.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  const getJobById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobService.getJobById(id);
      setSelectedJob(response.data);
      return response.data;
    } catch (error) {
      setError(error.message || 'Failed to fetch job details');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveJob = useCallback(async (id) => {
    try {
      const response = await jobService.saveJob(id);
      // Update the selected job's saved status
      if (selectedJob && selectedJob.id === parseInt(id)) {
        setSelectedJob(prev => ({
          ...prev,
          is_saved: !prev.is_saved
        }));
      }
      // Update the job in the jobs list
      setJobs(prev => prev.map(job => {
        if (job.id === parseInt(id)) {
          return { ...job, is_saved: !job.is_saved };
        }
        return job;
      }));
      return response;
    } catch (error) {
      throw error;
    }
  }, [selectedJob]);

  const createJob = useCallback(async (jobData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobService.createJob(jobData);
      toast.success('Job posted successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create job';
      toast.error(errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteJob = useCallback(async (jobId) => {
    setLoading(true);
    setError(null);
    try {
      await jobService.deleteJob(jobId);
      setJobs(prev => prev.filter(job => job.id !== jobId));
      toast.success('Job deleted successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete job';
      toast.error(errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateJob = useCallback(async (jobId, jobData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobService.updateJob(jobId, jobData);
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, ...response.data } : job
      ));
      toast.success('Job updated successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update job';
      toast.error(errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    selectedJob,
    jobs,
    loading,
    error,
    nextCursor,
    getJobById,
    getJobs,
    saveJob,
    createJob,
    deleteJob,
    updateJob,
    setSelectedJob
  };

  return (
    <JobContext.Provider value={value}>
      {children}
    </JobContext.Provider>
  );
};

export const useJob = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJob must be used within a JobProvider');
  }
  return context;
};
