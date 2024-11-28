import React, { useState } from 'react';
import {
  Paper,
  Box,
  Avatar,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { postService } from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import MediaUpload from './MediaUpload';

const CreatePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState({
    image: null,
    video: null
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedFiles.image && !selectedFiles.video) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      
      if (selectedFiles.image) {
        formData.append('image', selectedFiles.image);
      }
      if (selectedFiles.video) {
        formData.append('video', selectedFiles.video);
      }

      const response = await postService.createPost(formData);
      
      if (response) {
        onPostCreated(response);
        setContent('');
        setSelectedFiles({ image: null, video: null });
        toast.success('Post created successfully!');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file, type) => {
    setSelectedFiles(prev => ({
      ...prev,
      [type]: file
    }));
  };

  const handleRemoveFile = (type) => {
    setSelectedFiles(prev => ({
      ...prev,
      [type]: null
    }));
  };

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Avatar src={user?.profile_picture} />
        <Box sx={{ flex: 1 }}>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            
            <MediaUpload
              onFileSelect={handleFileSelect}
              selectedFiles={selectedFiles}
              onRemoveFile={handleRemoveFile}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                type="submit"
                disabled={loading || (!content.trim() && !selectedFiles.image && !selectedFiles.video)}
              >
                {loading ? <CircularProgress size={24} /> : 'Post'}
              </Button>
            </Box>
          </form>
        </Box>
      </Box>
    </Paper>
  );
};

export default CreatePost; 