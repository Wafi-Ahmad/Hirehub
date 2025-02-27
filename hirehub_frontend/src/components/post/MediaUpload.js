import React, { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import {
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { MEDIA_BASE_URL } from '../../config';

const MediaUpload = ({ onFileSelect, selectedFiles, onRemoveFile, hidePreview = false, isEditMode = false }) => {
  const [previews, setPreviews] = useState({
    image: null,
    video: null
  });
  
  // Create refs for the file inputs to reset them
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

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

  // Reset file inputs when component mounts or when isEditMode changes
  useEffect(() => {
    // Reset file inputs
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
    console.log('MediaUpload: Reset file inputs');
  }, [isEditMode]);

  const handleFileSelect = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      console.log(`File selected in MediaUpload: ${type}`, file);
      onFileSelect(file, type);
      
      // Reset the file input so the same file can be selected again
      if (type === 'image' && imageInputRef.current) {
        imageInputRef.current.value = '';
      } else if (type === 'video' && videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const renderPreview = (type) => {
    // If hidePreview is true, don't show previews (used in edit form where parent handles previews)
    if (hidePreview) return null;
    
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

  // Generate unique IDs for file inputs to avoid conflicts
  const imageInputId = isEditMode ? 'edit-image-upload' : 'image-upload';
  const videoInputId = isEditMode ? 'edit-video-upload' : 'video-upload';

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <input
          accept="image/*"
          type="file"
          id={imageInputId}
          hidden
          ref={imageInputRef}
          onChange={(e) => handleFileSelect(e, 'image')}
        />
        <label htmlFor={imageInputId}>
          <IconButton component="span" color={selectedFiles.image ? 'primary' : 'default'}>
            <ImageIcon />
          </IconButton>
        </label>

        <input
          accept="video/*"
          type="file"
          id={videoInputId}
          hidden
          ref={videoInputRef}
          onChange={(e) => handleFileSelect(e, 'video')}
        />
        <label htmlFor={videoInputId}>
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