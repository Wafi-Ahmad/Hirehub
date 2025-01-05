import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  MoreVert as MoreVertIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import { formatTimeAgo } from '../../utils/dateUtils';
import { commentService } from '../../services/commentService';
import { toast } from 'react-toastify';

const Comment = ({ comment, onLike, onDelete, onReply, currentUser }) => {
  const [replyContent, setReplyContent] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [replies, setReplies] = useState(comment.replies || []);
  const [showReplies, setShowReplies] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLike = async () => {
    if (isLiking) return;
    try {
      setIsLiking(true);
      await onLike(comment.id);
    } catch (error) {
      console.error('Failed to like comment:', error);
      toast.error('Failed to like comment');
    } finally {
      setIsLiking(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    try {
      const response = await commentService.createReply(comment.id, replyContent.trim());
      
      if (response?.data) {
        setReplies(prev => [...prev, response.data]);
        setReplyContent('');
        setShowReplyInput(false);
        setShowReplies(true);
        toast.success('Reply added successfully');
      }
    } catch (error) {
      console.error('Failed to post reply:', error);
      toast.error('Failed to post reply');
    }
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete(comment.id);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Avatar
          src={comment.user.profile_picture}
          alt={comment.user.username}
          sx={{ width: 32, height: 32 }}
        />
        <Box sx={{ flex: 1 }}>
          <Box
            sx={{
              backgroundColor: 'grey.100',
              borderRadius: 2,
              p: 1,
              mb: 0.5,
            }}
          >
            <Typography variant="subtitle2">
              {comment.user.username}
            </Typography>
            <Typography variant="body2">
              {comment.content}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
            <IconButton
              size="small"
              onClick={handleLike}
              disabled={isLiking}
              color={comment.is_liked ? "primary" : "default"}
            >
              <ThumbUpIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption">
              {comment.likes_count || 0}
            </Typography>
            <Button
              size="small"
              onClick={() => setShowReplyInput(!showReplyInput)}
              startIcon={<ReplyIcon />}
            >
              Reply
            </Button>
            <Typography variant="caption" color="text.secondary">
              {formatTimeAgo(comment.created_at)}
            </Typography>
            
            {(currentUser?.id === comment.user.id) && (
              <>
                <IconButton size="small" onClick={handleMenuClick}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={handleDelete}>Delete</MenuItem>
                </Menu>
              </>
            )}
          </Box>

          {showReplyInput && (
            <Box sx={{ display: 'flex', mt: 1, gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleReply}
                disabled={!replyContent.trim()}
              >
                Reply
              </Button>
            </Box>
          )}

          {replies.length > 0 && (
            <>
              <Button
                size="small"
                onClick={() => setShowReplies(!showReplies)}
                sx={{ mt: 1 }}
              >
                {showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </Button>
              
              {showReplies && (
                <Box sx={{ ml: 4, mt: 1 }}>
                  {replies.map((reply) => (
                    <Comment
                      key={reply.id}
                      comment={reply}
                      onLike={onLike}
                      onDelete={onDelete}
                      onReply={onReply}
                      currentUser={currentUser}
                    />
                  ))}
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Comment; 