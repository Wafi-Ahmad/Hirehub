import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import {
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { MEDIA_BASE_URL } from '../../config';

const MediaUpload = ({ onFileSelect, selectedFiles, onRemoveFile }) => {
  const [previews, setPreviews] = useState({
    image: null,
    video: null
  });

  const getMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob:')) {
      return url;
    }
    if (url.startsWith('/media/')) {
      return `${MEDIA_BASE_URL}${url}`;
    }
    return `${MEDIA_BASE_URL}/media/${url}`;
  };

  useEffect(() => {
    // Create object URLs for previews
    if (selectedFiles.image) {
      const imageUrl = selectedFiles.image instanceof File 
        ? URL.createObjectURL(selectedFiles.image)
        : getMediaUrl(selectedFiles.image);
      console.log('Setting image preview URL:', imageUrl);
      setPreviews(prev => ({ ...prev, image: imageUrl }));
    } else {
      setPreviews(prev => ({ ...prev, image: null }));
    }

    if (selectedFiles.video) {
      const videoUrl = selectedFiles.video instanceof File 
        ? URL.createObjectURL(selectedFiles.video)
        : getMediaUrl(selectedFiles.video);
      setPreviews(prev => ({ ...prev, video: videoUrl }));
    } else {
      setPreviews(prev => ({ ...prev, video: null }));
    }

    // Cleanup
    return () => {
      Object.values(previews).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [selectedFiles]);

  const handleFileSelect = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      onFileSelect(file, type);
    }
  };

  const renderPreview = (type) => {
    const previewUrl = previews[type];
    if (!previewUrl) return null;

    return (
      <Box sx={{ position: 'relative', mt: 2 }}>
        {type === 'image' ? (
          <img
            src={previewUrl}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '200px',
              borderRadius: '8px',
              objectFit: 'cover'
            }}
          />
        ) : (
          <video
            controls
            style={{
              maxWidth: '100%',
              maxHeight: '200px',
              borderRadius: '8px'
            }}
          >
            <source src={previewUrl} />
          </video>
        )}
        <IconButton
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
          }}
          onClick={() => {
            // Clear the preview
            setPreviews(prev => ({
              ...prev,
              [type]: null
            }));
            // Call the parent handler
            onRemoveFile(type);
          }}
        >
          <CloseIcon sx={{ color: 'white' }} />
        </IconButton>
      </Box>
    );
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

      {renderPreview('image')}
      {renderPreview('video')}
    </Box>
  );
};

export default MediaUpload; 