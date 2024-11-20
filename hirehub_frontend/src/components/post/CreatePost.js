import React, { useState } from 'react';
import {
  Paper,
  Box,
  Avatar,
  TextField,
  Button,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Photo as PhotoIcon,
  Videocam as VideoIcon,
  Event as EventIcon,
  EmojiEmotions as EmojiIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { postService } from '../../services/postService';
import { toast } from 'react-toastify';
import api from '../../services/api';

const CreatePost = ({ onPostCreated, user }) => {
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAttachment(file);
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
    setPreviewUrl('');
  };

  const handleSubmit = async () => {
    if (!content.trim() && !attachment) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (attachment) {
        formData.append('attachment', attachment);
      }

      const response = await api.post('/posts/create/', formData);
      
      setContent('');
      clearAttachment();
      onPostCreated(response.data);
      toast.success('Post created successfully!');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Please log in again to continue');
        // Let the API interceptor handle the redirect
      } else {
        toast.error(error.response?.data?.error || 'Failed to create post');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <Avatar src={user?.profile_picture} />
        <TextField
          fullWidth
          multiline
          rows={2}
          variant="outlined"
          placeholder="Share your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
        />
      </Box>

      {previewUrl && (
        <Box sx={{ position: 'relative', mb: 2 }}>
          <img
            src={previewUrl}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '200px',
              objectFit: 'cover',
              borderRadius: '8px',
            }}
          />
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'background.paper',
            }}
            onClick={clearAttachment}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <input
            type="file"
            id="file-input"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            accept="image/*,.pdf"
          />
          <label htmlFor="file-input">
            <Button
              component="span"
              startIcon={<PhotoIcon />}
              disabled={isSubmitting}
            >
              Photo
            </Button>
          </label>
          <Button startIcon={<VideoIcon />} disabled={isSubmitting}>
            Video
          </Button>
          <Button startIcon={<EventIcon />} disabled={isSubmitting}>
            Event
          </Button>
          <Button startIcon={<EmojiIcon />} disabled={isSubmitting}>
            Feeling
          </Button>
        </Box>

        <Button
          variant="contained"
          disabled={isSubmitting || (!content.trim() && !attachment)}
          onClick={handleSubmit}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Post'}
        </Button>
      </Box>
    </Paper>
  );
};

export default CreatePost; 