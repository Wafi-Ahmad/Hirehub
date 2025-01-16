import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import RecommendIcon from '@mui/icons-material/Recommend';
import { formatDistanceToNow } from 'date-fns';
import { saveJob } from '../../services/jobService';
import toast from 'react-hot-toast';

const JobCard = ({ job }) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(job.is_saved || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e) => {
    e.stopPropagation();
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await saveJob(job.id);
      setIsSaved(!isSaved);
      toast.success(response.message);
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error(error.message || 'Failed to save job');
      // Revert the saved state if there was an error
      setIsSaved(isSaved);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        '&:hover': { boxShadow: 6 },
        position: 'relative'
      }}
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" gutterBottom noWrap>
              {job.title}
              {job.is_recommended && (
                <Tooltip title="Recommended for you">
                  <RecommendIcon 
                    color="primary" 
                    sx={{ ml: 1, verticalAlign: 'middle' }} 
                  />
                </Tooltip>
              )}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              {job.company_name}
            </Typography>
          </Box>
          <Box>
            <Tooltip title={isSaved ? "Remove from saved" : "Save job"}>
              <IconButton 
                onClick={handleSave} 
                size="small"
                disabled={isLoading}
              >
                {isSaved ? <BookmarkIcon color="primary" /> : <BookmarkBorderIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Chip 
            label={job.employment_type} 
            size="small" 
            sx={{ mr: 1, mb: 1 }} 
          />
          <Chip 
            label={job.location_type} 
            size="small" 
            sx={{ mr: 1, mb: 1 }} 
          />
          <Chip 
            label={job.experience_level} 
            size="small" 
            sx={{ mb: 1 }} 
          />
          {job.is_recommended && (
            <Chip
              icon={<RecommendIcon />}
              label="Recommended"
              color="primary"
              variant="outlined"
              size="small"
              sx={{ ml: 1, mb: 1 }}
            />
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} noWrap>
          {job.description}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Posted {formatDistanceToNow(new Date(job.created_at))} ago
          </Typography>
          <Button 
            variant="contained" 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/jobs/${job.id}`);
            }}
          >
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default JobCard; 