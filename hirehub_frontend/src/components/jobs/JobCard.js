import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useJob } from '../../context/JobContext';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import { formatDistance } from 'date-fns';

const JobCard = ({ job }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deleteJob } = useJob();
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event) => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
  };

  const handleEdit = (event) => {
    event.stopPropagation();
    handleMenuClose();
    navigate(`/jobs/edit/${job.id}`);
  };

  const handleDelete = async () => {
    try {
      await deleteJob(job.id);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const handleCardClick = () => {
    navigate(`/jobs/${job.id}`);
  };

  const isOwner = user?.id === job.company_id;

  return (
    <Card 
      sx={{ 
        mb: 1.5,
        cursor: 'pointer',
        bgcolor: 'white',
        color: 'black',
        borderRadius: 1,
        //maxWidth: '100%',
        height: '200px',
        width: '500px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        '&:hover': {
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
        },
        position: 'relative'
      }}
      onClick={handleCardClick}
      elevation={0}
    >
      <CardContent sx={{ p: '16px', '&:last-child': { pb: '16px' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: '1.1rem', 
              fontWeight: 500,
              pr: isOwner ? 4 : 0
            }}
          >
            {job.title}
          </Typography>
          {isOwner && (
            <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
              <IconButton 
                size="small" 
                onClick={handleMenuClick}
                sx={{ 
                  p: 0.5,
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={(e) => e.stopPropagation()}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleEdit}>Edit</MenuItem>
                <MenuItem onClick={() => {
                  handleMenuClose();
                  setDeleteDialogOpen(true);
                }}>Delete</MenuItem>
              </Menu>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationOnIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
            <Typography variant="body2" color="text.secondary">
              {job.location} {job.location_type === 'ON_SITE' ? '(On Site)' : ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <WorkIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
            <Typography variant="body2" color="text.secondary">
              {job.employment_type}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          <Chip 
            label={job.experience_level}
            size="small"
            sx={{ 
              bgcolor: 'grey.100',
              color: 'text.primary',
              borderRadius: '16px',
              height: '24px',
              '& .MuiChip-label': { px: 1 }
            }}
          />
          {job.required_skills.slice(0, 3).map((skill, index) => (
            <Chip 
              key={index} 
              label={skill} 
              size="small"
              sx={{ 
                bgcolor: 'grey.100',
                color: 'text.primary',
                borderRadius: '16px',
                height: '24px',
                '& .MuiChip-label': { px: 1 }
              }}
            />
          ))}
          {job.required_skills.length > 3 && (
            <Chip 
              label={`+${job.required_skills.length - 3} more`}
              size="small"
              sx={{ 
                bgcolor: 'grey.100',
                color: 'text.primary',
                borderRadius: '16px',
                height: '24px',
                '& .MuiChip-label': { px: 1 }
              }}
            />
          )}
        </Box>

        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary',
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.4
          }}
        >
          {job.description}
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <Typography variant="body2" color="text.secondary">
            Posted {formatDistance(new Date(job.created_at), new Date(), { addSuffix: true })}
            {job.days_until_expiry && ` • ${job.days_until_expiry} days left`}
          </Typography>
          {job.salary_min && job.salary_max && (
            <Typography variant="body2" color="primary">
              Salary: ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
            </Typography>
          )}
        </Box>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this job posting? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default JobCard; 