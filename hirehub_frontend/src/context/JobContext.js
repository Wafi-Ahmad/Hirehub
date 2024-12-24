import React, { createContext, useContext, useState, useCallback } from 'react';
import { jobService } from '../services/jobService';
import { toast } from 'react-toastify';

const JobContext = createContext();

export const useJob = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJob must be used within a JobProvider');
  }
  return context;
};

export const JobProvider = ({ children }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);

  const getJobs = useCallback(async (params = {}) => {
    try {
      setError(null);
      setLoading(true);
      const response = await jobService.getJobs(params);
      setJobs(prev => params.cursor ? [...prev, ...response.data.jobs] : response.data.jobs);
      setNextCursor(response.data.next_cursor);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch jobs';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getJobById = useCallback(async (id) => {
    try {
      setError(null);
      const response = await jobService.getJobById(id);
      setSelectedJob(response.data);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch job details';
      setError(message);
      toast.error(message);
      throw error;
    }
  }, []);

  const createJob = useCallback(async (jobData) => {
    try {
      setError(null);
      const response = await jobService.createJob(jobData);
      setJobs(prev => [response.data, ...prev]);
      toast.success('Job posted successfully!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create job';
      setError(message);
      toast.error(message);
      throw error;
    }
  }, []);

  const updateJob = useCallback(async (id, jobData) => {
    try {
      setError(null);
      const response = await jobService.updateJob(id, jobData);
      setJobs(prev => prev.map(job => job.id === id ? response.data : job));
      setSelectedJob(response.data);
      toast.success('Job updated successfully!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update job';
      setError(message);
      toast.error(message);
      throw error;
    }
  }, []);

  const deleteJob = useCallback(async (id) => {
    try {
      setError(null);
      await jobService.deleteJob(id);
      setJobs(prev => prev.filter(job => job.id !== id));
      toast.success('Job deleted successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete job';
      setError(message);
      toast.error(message);
      throw error;
    }
  }, []);
  const saveJob = useCallback(async (id) => {
    try {
      setError(null);
      await jobService.saveJob(id);
      
      // Find the job before updating state
      const jobToUpdate = jobs.find(j => j.id === id);
      const newSavedState = !jobToUpdate.is_saved;

      setJobs(prev => prev.map(job => 
        job.id === id ? { ...job, is_saved: newSavedState } : job
      ));

      // Update savedJobs list
      setSavedJobs(prev => {
        if (newSavedState) {
          return [...prev, {...jobToUpdate, is_saved: true}];
        } else {
          return prev.filter(j => j.id !== id);
        }
      });

      toast.success(newSavedState ? 'Job saved successfully!' : 'Job removed from saved jobs');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save job';
      setError(message);
      toast.error(message);
      throw error;
    }
  }, [jobs]);

  const provideFeedback = useCallback(async (id, feedback) => {
    try {
      setError(null);
      await jobService.provideFeedback(id, feedback);
      toast.success('Feedback submitted successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit feedback';
      setError(message);
      toast.error(message);
      throw error;
    }
  }, []);

  const clearSelectedJob = useCallback(() => {
    setSelectedJob(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    jobs,
    loading,
    error,
    nextCursor,
    selectedJob,
    savedJobs,
    getJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
    saveJob,
    provideFeedback,
    clearSelectedJob,
    clearError
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};
