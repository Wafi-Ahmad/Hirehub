import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  Reply as ReplyIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { commentService } from '../../services/commentService';
import { postService } from '../../services/postService';
import { toast } from 'react-toastify';
import { formatTimeAgo } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';

const Comment = ({ comment, postId, onDelete, onLike, currentUser, isReply = false }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replies, setReplies] = useState(null);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const navigate = useNavigate();

  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // Load replies only when needed
  const loadReplies = async () => {
    if (loadingReplies || replies !== null) return;
    
    try {
      setLoadingReplies(true);
      const response = await commentService.getReplies(comment.id);

      if (response.data?.replies) {  // Fixed: Access correct response structure
        setReplies(response.data.replies);
        setNextCursor(response.data.next_cursor);
      }
    } catch (error) {
      console.error('Failed to load replies:', error);
      toast.error('Failed to load replies');
    } finally {
      setLoadingReplies(false);
    }
  };

  // Load more replies
  const loadMoreReplies = async () => {
    if (loadingReplies || !nextCursor) return;
    
    try {
      setLoadingReplies(true);
      const response = await commentService.getReplies(comment.id, nextCursor);

      if (response.data?.replies) {  // Fixed: Access correct response structure
        setReplies(prev => [...prev, ...response.data.replies]);
        setNextCursor(response.data.next_cursor);
      }
    } catch (error) {
      console.error('Failed to load more replies:', error);
      toast.error('Failed to load more replies');
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    
    try {
      const response = await commentService.createReply(comment.id, replyContent);
      if (response.data) {
        // Initialize replies array if it's null
        if (replies === null) {
          setReplies([response.data]);
        } else {
          setReplies(prev => [response.data, ...prev]);
        }
        comment.replies_count = (comment.replies_count || 0) + 1;
        setReplyContent('');
        setIsReplying(false);
        toast.success('Reply posted successfully');
      }
    } catch (error) {
      toast.error('Failed to post reply');
    }
  };

  const handleLike = async () => {
    try {
      const response = await postService.toggleCommentLike(comment.id);
      // Update local state first for immediate feedback
      const newLikeState = !comment.is_liked;
      comment.is_liked = newLikeState;
      comment.likes_count = response.likes_count;
      // Notify parent to update UI
      onLike(comment.id, response.likes_count);
    } catch (error) {
      toast.error('Failed to like comment');
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Avatar
          src={comment.user?.profile_picture}
          alt={`${comment.user?.first_name} ${comment.user?.last_name}`}
          sx={{ 
            width: 32, 
            height: 32, 
            mr: 1, 
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8
            }
          }}
          onClick={() => handleProfileClick(comment.user.id)}
        />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography
                variant="subtitle2"
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
                onClick={() => handleProfileClick(comment.user.id)}
              >
                {comment.user?.first_name} {comment.user?.last_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTimeAgo(comment.created_at)}
              </Typography>
            </Box>
            <Typography variant="body2">{comment.content}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
            <IconButton
              size="small"
              onClick={handleLike}
              color={comment.is_liked ? "primary" : "inherit"}
            >
              <ThumbUpIcon fontSize="small" />
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                {comment.likes_count || 0}
              </Typography>
            </IconButton>
            
            {!isReply && comment.replies_count > 0 && replies === null && (
              <Button
                size="small"
                startIcon={<ReplyIcon />}
                onClick={loadReplies}
                disabled={loadingReplies}
              >
                Show replies ({comment.replies_count})
              </Button>
            )}

            {!isReply && (
              <IconButton
                size="small"
                onClick={() => setIsReplying(!isReplying)}
              >
                <ReplyIcon fontSize="small" />
              </IconButton>
            )}

            {currentUser?.id === comment.user?.id && (
              <IconButton
                size="small"
                onClick={() => onDelete(comment.id)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          {!isReply && isReplying && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
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

          {!isReply && replies?.length > 0 && (
            <Box sx={{ ml: 4 }}>
              {replies.map((reply) => (
                <Comment
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  onDelete={onDelete}
                  onLike={onLike}
                  currentUser={currentUser}
                  isReply={true}
                />
              ))}
              
              {nextCursor && (
                <Button
                  size="small"
                  onClick={loadMoreReplies}
                  disabled={loadingReplies}
                  sx={{ mt: 1 }}
                >
                  {loadingReplies ? (
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                  ) : (
                    'Show more replies'
                  )}
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Comment; 