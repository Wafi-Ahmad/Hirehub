import React, { useState } from 'react';
import {
  Paper,
  Box,
  Avatar,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import MediaUpload from './MediaUpload';
import { usePost } from '../../context/PostContext';

const CreatePost = ({ onPostCreated }) => {
  const { createPost } = usePost();
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
      const postData = {
        content: content.trim(),
        image: selectedFiles.image,
        video: selectedFiles.video
      };

      await createPost(postData);
      
      // Clear form
      setContent('');
      setSelectedFiles({ image: null, video: null });
      
      // Notify parent component
      if (onPostCreated) {
        onPostCreated();
      }

      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file, type) => {
    setSelectedFiles(prev => ({
      ...prev,
      [type]: file,
      // Remove the other type of media when one is selected
      [type === 'image' ? 'video' : 'image']: null
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
        <Avatar 
          src={user?.profile_picture}
          alt={user?.userType === 'Company' ? user?.company_name : `${user?.first_name} ${user?.last_name}`}
        />
        <Box sx={{ flex: 1 }}>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Share Posts With Your Connections!"
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