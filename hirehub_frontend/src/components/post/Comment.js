import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  TextField,
  Button,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  Reply as ReplyIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { postService } from '../../services/postService';
import { toast } from 'react-toastify';

const Comment = ({ comment, onDelete, onReply, onLike, currentUser }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleReply = async () => {
    try {
      const response = await postService.createComment(
        comment.post_id,
        replyContent,
        comment.id
      );
      onReply(response.data);
      setReplyContent('');
      setIsReplying(false);
    } catch (error) {
      toast.error('Failed to post reply');
    }
  };

  const handleLike = async () => {
    try {
      await postService.likeComment(comment.id);
      onLike(comment.id);
    } catch (error) {
      toast.error('Failed to like comment');
    }
  };

  const handleDelete = async () => {
    try {
      await postService.deleteComment(comment.id);
      onDelete(comment.id);
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Avatar src={comment.user.profile_picture} sx={{ width: 32, height: 32 }} />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 2 }}>
            <Typography variant="subtitle2">{comment.user.name}</Typography>
            <Typography variant="body2">{comment.content}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
            <Button
              size="small"
              startIcon={<ThumbUpIcon />}
              onClick={handleLike}
            >
              Like ({comment.like_count})
            </Button>
            <Button
              size="small"
              startIcon={<ReplyIcon />}
              onClick={() => setIsReplying(!isReplying)}
            >
              Reply
            </Button>
            {currentUser.id === comment.user.id && (
              <IconButton size="small" onClick={handleDelete}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          {isReplying && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
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

          {/* Render replies */}
          {comment.replies?.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              onDelete={onDelete}
              onReply={onReply}
              onLike={onLike}
              currentUser={currentUser}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default Comment; 