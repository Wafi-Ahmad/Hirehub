import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Avatar,
  Menu,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  MoreVert as MoreVertIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { formatTimeAgo } from '../../utils/dateUtils';
import { commentService } from '../../services/commentService';
import { toast } from 'react-toastify';

const Comment = ({ comment: initialComment, onLike, onDelete, onReply, currentUser, isReply = false, parentId }) => {
  const [replyContent, setReplyContent] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [replies, setReplies] = useState(initialComment.replies || []);
  const [showReplies, setShowReplies] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [commentState, setCommentState] = useState(initialComment);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(initialComment.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setCommentState(initialComment);
    setEditContent(initialComment.content);
  }, [initialComment]);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
    setShowMenu(true);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setShowMenu(false);
  };

  const handleEdit = () => {
    handleMenuClose();
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(commentState.content);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      const response = await commentService.updateComment(commentState.id, editContent);
      setCommentState(prev => ({ ...prev, content: response.data.content }));
      setIsEditing(false);
      toast.success('Comment updated successfully');
    } catch (error) {
      console.error('Failed to update comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleLike = async () => {
    if (isLiking) return;
    try {
      setIsLiking(true);
      const response = await commentService.toggleLike(commentState.id);
      const updatedComment = {
        ...commentState,
        is_liked: response.data.is_liked,
        likes_count: response.data.likes_count,
      };
      setCommentState(updatedComment);
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
      const response = await commentService.createReply(commentState.id, replyContent.trim());
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

  const handleDelete = async () => {
    try {
      console.log('Deleting comment/reply:', {
        id: commentState.id,
        content: commentState.content,
        isReply,
        userId: currentUser?.id,
        commentOwnerId: commentState.user?.id,
        parent_comment_id: commentState.parent_comment_id
      });

      if (currentUser?.id !== commentState.user?.id) {
        toast.error('You can only delete your own comments');
        return;
      }

      await commentService.deleteComment(commentState.id);
      
      await onDelete(commentState.id, isReply);
      handleMenuClose();
      
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error(error.response?.data?.error || 'Failed to delete comment');
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Avatar
          src={commentState.user.profile_picture}
          alt={commentState.user.username}
          sx={{ width: 32, height: 32 }}
        />
        <Box sx={{ flex: 1 }}>
          {isEditing ? (
            <Box sx={{ mb: 1 }}>
              <TextField
                fullWidth
                multiline
                size="small"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button size="small" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim()}
                >
                  Save
                </Button>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                backgroundColor: 'grey.100',
                borderRadius: 2,
                p: 1,
                mb: 0.5,
              }}
            >
              <Typography variant="subtitle2">
                {commentState.user.username}
              </Typography>
              <Typography variant="body2">
                {commentState.content}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
            <IconButton
              size="small"
              onClick={handleLike}
              disabled={isLiking}
              color={commentState.is_liked ? "primary" : "default"}
            >
              <ThumbUpIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption">
              {commentState.likes_count || 0}
            </Typography>
            <Button
              size="small"
              onClick={() => setShowReplyInput(!showReplyInput)}
              startIcon={<ReplyIcon />}
            >
              Reply
            </Button>
            <Typography variant="caption" color="text.secondary">
              {formatTimeAgo(commentState.created_at)}
            </Typography>
            
            {(currentUser?.id === commentState.user.id) && (
              <>
                <IconButton size="small" onClick={handleMenuClick}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={handleEdit}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    Edit
                  </MenuItem>
                  <MenuItem onClick={handleDelete}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Delete
                  </MenuItem>
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
                      isReply={true}
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