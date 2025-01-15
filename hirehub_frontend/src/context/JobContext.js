import React, { createContext, useContext, useState } from 'react';
import { jobService } from '../services/jobService';
import toast from 'react-hot-toast';

const JobContext = createContext();

export const JobProvider = ({ children }) => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);

  const getJobs = async (filters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobService.getJobs(filters);
      if (filters.cursor) {
        setJobs(prev => [...prev, ...response.data.jobs]);
      } else {
        setJobs(response.data.jobs);
      }
      setNextCursor(response.data.next_cursor);
    } catch (error) {
      setError(error.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const getJobById = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobService.getJobById(id);
      setSelectedJob(response.data);
    } catch (error) {
      setError(error.message || 'Failed to fetch job details');
    } finally {
      setLoading(false);
    }
  };

  const saveJob = async (id) => {
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
  };

  return (
    <JobContext.Provider
      value={{
        selectedJob,
        jobs,
        loading,
        error,
        nextCursor,
        getJobById,
        getJobs,
        saveJob,
        setSelectedJob
      }}
    >
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
