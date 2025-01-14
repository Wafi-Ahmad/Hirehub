import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import {
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const MediaUpload = ({ onImageSelect, onVideoSelect, currentImage, currentVideo }) => {
  const handleFileSelect = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      if (type === 'image') {
        onImageSelect(file);
      } else if (type === 'video') {
        onVideoSelect(file);
      }
    }
  };

  const renderPreview = (type, url) => {
    if (!url) return null;

    if (type === 'image') {
      return (
        <Box sx={{ position: 'relative', mt: 2 }}>
          <img
            src={url}
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
            onClick={() => type === 'image' ? onImageSelect(null) : onVideoSelect(null)}
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
            <source src={url} />
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
            onClick={() => type === 'image' ? onImageSelect(null) : onVideoSelect(null)}
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
          <IconButton component="span" color={currentImage ? 'primary' : 'default'}>
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
          <IconButton component="span" color={currentVideo ? 'primary' : 'default'}>
            <VideoIcon />
          </IconButton>
        </label>

        <Typography variant="caption" color="text.secondary">
          Add photos or videos
        </Typography>
      </Box>

      {renderPreview('image', currentImage)}
      {renderPreview('video', currentVideo)}
    </Box>
  );
};

export default MediaUpload; 