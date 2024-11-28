import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import {
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const MediaUpload = ({ onFileSelect, selectedFiles, onRemoveFile }) => {
  const handleFileSelect = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      onFileSelect(file, type);
    }
  };

  const renderPreview = (file, type) => {
    if (!file) return null;

    if (type === 'image') {
      return (
        <Box sx={{ position: 'relative', mt: 2 }}>
          <img
            src={URL.createObjectURL(file)}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '200px',
              borderRadius: '8px',
            }}
          />
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
            }}
            onClick={() => onRemoveFile(type)}
          >
            <CloseIcon sx={{ color: 'white' }} />
          </IconButton>
        </Box>
      );
    }

    if (type === 'video') {
      return (
        <Box sx={{ position: 'relative', mt: 2 }}>
          <video
            controls
            style={{
              maxWidth: '100%',
              maxHeight: '200px',
              borderRadius: '8px',
            }}
          >
            <source src={URL.createObjectURL(file)} />
            Your browser does not support the video tag.
          </video>
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
            }}
            onClick={() => onRemoveFile(type)}
          >
            <CloseIcon sx={{ color: 'white' }} />
          </IconButton>
        </Box>
      );
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <input
          accept="image/*"
          type="file"
          id="image-upload"
          hidden
          onChange={(e) => handleFileSelect(e, 'image')}
        />
        <label htmlFor="image-upload">
          <IconButton component="span" color={selectedFiles.image ? 'primary' : 'default'}>
            <ImageIcon />
          </IconButton>
        </label>

        <input
          accept="video/*"
          type="file"
          id="video-upload"
          hidden
          onChange={(e) => handleFileSelect(e, 'video')}
        />
        <label htmlFor="video-upload">
          <IconButton component="span" color={selectedFiles.video ? 'primary' : 'default'}>
            <VideoIcon />
          </IconButton>
        </label>

        <Typography variant="caption" color="text.secondary">
          Add photos or videos
        </Typography>
      </Box>

      {renderPreview(selectedFiles.image, 'image')}
      {renderPreview(selectedFiles.video, 'video')}
    </Box>
  );
};

export default MediaUpload; 