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
  Button,
  Tooltip,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useJob } from '../../context/JobContext';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatDistance } from 'date-fns';
import RecommendIcon from '@mui/icons-material/Recommend';

const JobCard = ({ job, sx = {} }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deleteJob, saveJob } = useJob();
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(job.is_saved);

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

  const handleSave = async (event) => {
    event.stopPropagation();
    try {
      await saveJob(job.id);
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const handleCardClick = () => {
    navigate(`/jobs/${job.id}`);
  };

  const isOwner = user?.id === job.company_id;
  const isNormalUser = user?.user_type === 'Normal';

  const formatEmploymentType = (type) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <Card 
      sx={{ 
        mb: 1.5,
        cursor: 'pointer',
        bgcolor: 'white',
        color: 'black',
        borderRadius: 1,
        height: '200px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        '&:hover': {
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
        },
        position: 'relative',
        ...(job.is_recommended && isNormalUser && {
          border: '2px solid #1976d2',
          boxShadow: '0 0 10px rgba(25, 118, 210, 0.1)'
        }),
        ...sx
      }}
      onClick={handleCardClick}
      elevation={0}
    >
      <CardContent sx={{ p: '16px', '&:last-child': { pb: '16px' } }}>
        {/* Add Recommended Badge if job is recommended and user is normal */}
        {job.is_recommended && isNormalUser && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: -1,
              right: 16,
              bgcolor: '#1976d2',
              color: 'white',
              px: 1,
              py: 0.5,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              zIndex: 1
            }}
          >
            <RecommendIcon sx={{ fontSize: '1rem' }} />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              Recommended
            </Typography>
          </Box>
        )}

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isOwner && user && (
              <Tooltip title={isSaved ? "Remove from saved" : "Save job"}>
                <IconButton 
                  onClick={handleSave}
                  size="small"
                  sx={{ 
                    p: 0.5,
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  {isSaved ? (
                    <BookmarkIcon sx={{ color: 'primary.main' }} />
                  ) : (
                    <BookmarkBorderIcon />
                  )}
                </IconButton>
              </Tooltip>
            )}
            {isOwner && (
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
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationOnIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
            <Typography variant="body2" color="text.secondary">
              {job.location} {job.location_type === 'ON_SITE' ? '(On Site)' : ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <BusinessCenterIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
            <Typography variant="body2" color="text.secondary">
              {formatEmploymentType(job.employment_type)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <WorkIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
            <Typography variant="body2" color="text.secondary">
              {job.experience_level === 'SENIOR' ? 'Senior Level' :
               job.experience_level === 'MID' ? 'Mid Level' :
               job.experience_level === 'ENTRY' ? 'Entry Level' :
               job.experience_level === 'LEAD' ? 'Lead Level' : ''}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
          {job.required_skills?.map((skill, index) => (
            <Chip
              key={index}
              label={skill}
              size="small"
              sx={{
                bgcolor: 'transparent',
                border: '1px solid #1976d2',
                color: '#1976d2',
                height: '24px',
                '& .MuiChip-label': { px: 1, py: 0.5 }
              }}
            />
          ))}
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

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem onClick={() => setDeleteDialogOpen(true)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>

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