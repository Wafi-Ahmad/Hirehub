import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Avatar,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  Reply as ReplyIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { postService } from '../../services/postService';
import { toast } from 'react-toastify';

const Comment = ({ comment, postId, onDelete, onLike, currentUser, isReply = false }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replies, setReplies] = useState(null);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);

  // Load replies only when needed
  const loadReplies = async () => {
    if (loadingReplies || replies !== null) return;
    
    try {
      setLoadingReplies(true);
      const response = await postService.getCommentReplies(comment.id);

      if (response.replies) {
        setReplies(response.replies);
        setNextCursor(response.next_cursor);
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
      const response = await postService.getCommentReplies(comment.id, nextCursor);

      if (response.replies) {
        setReplies(prev => [...prev, ...response.replies]);
        setNextCursor(response.next_cursor);
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
      const response = await postService.replyToComment(comment.id, replyContent);
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
      const response = await postService.likeComment(comment.id);
      // Let parent handle the state update with the new like count
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
          sx={{ width: 32, height: 32 }}
        />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
            <Typography variant="subtitle2">
              {comment.user?.first_name} {comment.user?.last_name}
            </Typography>
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
            </Box>
          )}

          {!isReply && replies?.length > 0 && nextCursor && (
            <Button
              size="small"
              onClick={loadMoreReplies}
              disabled={loadingReplies}
              sx={{ mt: 1, ml: 4 }}
            >
              {loadingReplies ? 'Loading...' : 'Show more replies'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Comment; 