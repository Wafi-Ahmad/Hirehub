import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  ThumbUp as ThumbUpIcon,
  ChatBubbleOutline as CommentIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
} from '@mui/icons-material';
import { commentService } from '../../services/commentService';
import { postService } from '../../services/postService';
import { userService } from '../../services/userService';
import { toast } from 'react-toastify';
import Comment from './Comment';
import { useAuth } from '../../context/AuthContext';
import { usePost } from '../../context/PostContext';
import { formatTimeAgo } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import MediaUpload from './MediaUpload';

const Post = ({ post, onDelete, showRecommended = false }) => {
  const { user: currentUser } = useAuth();
  const { updatePost, removePost } = usePost();
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentCursor, setCommentCursor] = useState(null);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const isPostOwner = currentUser?.id === post.user.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [editedImage, setEditedImage] = useState(null);
  const [editedVideo, setEditedVideo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset edited state when post changes
  useEffect(() => {
    if (post) {
      setEditedContent(post.content);
      setEditedImage(null);
      setEditedVideo(null);
    }
  }, [post]);

  // Fetch comments when comments section is opened
  const fetchComments = async (cursor = null) => {
    try {
      setLoadingComments(true);
      const response = await commentService.getComments(post.id, cursor);
      
      if (response?.data?.comments) {
        const newComments = response.data.comments;
        setComments(prev => cursor ? [...prev, ...newComments] : newComments);
        setCommentCursor(response.data.next_cursor);
        setHasMoreComments(!!response.data.next_cursor);
        
        // Show comments section automatically if there are comments
        if (newComments.length > 0) {
          setShowComments(true);
        }
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  // Load comments when show comments is toggled
  useEffect(() => {
    if (showComments && comments.length === 0) {
      fetchComments();
    }
  }, [showComments]);

  const handleComment = async () => {
    if (!commentContent.trim()) return;

    try {
      const response = await commentService.createComment(post.id, commentContent.trim());
      
      if (response?.data) {
        // Update local state first
        const newComment = response.data;
        setComments(prev => [newComment, ...prev]);
        setCommentContent('');
        
        // Update post comment count
        const newCommentCount = (post.comments_count || 0) + 1;
        updatePost(post.id, { comments_count: newCommentCount });
        
        // Show comments section if not already shown
        setShowComments(true);
        
        toast.success('Comment added successfully');
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast.error('Failed to post comment');
    }
  };

  const handleCommentLike = async (commentId) => {
    try {
      const response = await commentService.toggleLike(commentId);
      if (response?.data) {
        // Update the comment in the local state
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                is_liked: !comment.is_liked,
                likes_count: response.data.likes_count
              };
            }
            if (comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map(reply =>
                  reply.id === commentId
                    ? {
                        ...reply,
                        is_liked: !reply.is_liked,
                        likes_count: response.data.likes_count
                      }
                    : reply
                )
              };
            }
            return comment;
          })
        );
      }
    } catch (error) {
      console.error('Failed to toggle comment like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleDeleteComment = async (commentId, isParentComment = false) => {
    try {
      await commentService.deleteComment(commentId);
      
      // Update local state
      setComments(prevComments => {
        if (isParentComment) {
          // If it's a parent comment, remove it and all its replies
          return prevComments.filter(c => c.id !== commentId);
        } else {
          // If it's a reply, only remove it from its parent's replies array
          return prevComments.map(comment => ({
            ...comment,
            replies: comment.replies?.filter(reply => reply.id !== commentId) || []
          }));
        }
      });
      
      // Update post comment count
      const newCommentCount = Math.max(0, (post.comments_count || 0) - 1);
      updatePost(post.id, { comments_count: newCommentCount });
      
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleLikePost = async () => {
    try {
      const response = await postService.toggleLike(post.id);
      if (response?.data) {
        updatePost(post.id, {
          is_liked: !post.is_liked,
          likes_count: response.data.likes_count
        });
      }
    } catch (error) {
      console.error('Failed to update like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    handleMenuClose();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(post.content);
    setEditedImage(null);
    setEditedVideo(null);
  };

  const handleSaveEdit = async () => {
    try {
      setIsSubmitting(true);
      const response = await postService.editPost(
        post.id,
        editedContent,
        editedImage,
        editedVideo
      );
      
      if (response?.data) {
        updatePost(post.id, response.data);
      }
      
      setIsEditing(false);
      toast.success('Post updated successfully');
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error(error.response?.data?.message || 'Failed to update post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await postService.deletePost(post.id);
      setShowDeleteConfirm(false);
      // Remove post from context and UI immediately
      removePost(post.id);
      if (onDelete) {
        onDelete(post.id);
      }
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(error.response?.data?.error || 'Failed to delete post');
      setShowDeleteConfirm(false);
    }
  };

  const handleMediaChange = (type, file) => {
    if (type === 'image') {
      setEditedImage(file);
      if (file) setEditedVideo(null); // Remove video if image is selected
    } else if (type === 'video') {
      setEditedVideo(file);
      if (file) setEditedImage(null); // Remove image if video is selected
    }
  };

  const renderMedia = () => {
    if (!post.media_urls) return null;

    if (post.media_type === 'image' && post.media_urls.image) {
      return (
        <Box
          component="img"
          src={post.media_urls.image}
          alt="Post image"
          sx={{
            width: '100%',
            maxHeight: 500,
            objectFit: 'contain',
            borderRadius: 1,
            mb: 2
          }}
        />
      );
    }

    if (post.media_type === 'video' && post.media_urls.video) {
      return (
        <Box
          component="video"
          controls
          sx={{
            width: '100%',
            maxHeight: 500,
            borderRadius: 1,
            mb: 2
          }}
        >
          <source src={post.media_urls.video} type="video/mp4" />
          Your browser does not support the video tag.
        </Box>
      );
    }

    return null;
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        avatar={
          <Avatar
            src={post.user.profile_picture}
            alt={`${post.user.first_name} ${post.user.last_name}`}
            onClick={() => navigate(`/profile/${post.user.id}`)}
            sx={{ cursor: 'pointer' }}
          />
        }
        action={
          isPostOwner && (
            <IconButton onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
          )
        }
        title={
          <Typography
            variant="h6"
            component="span"
            onClick={() => navigate(`/profile/${post.user.id}`)}
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          >
            {post.user.first_name} {post.user.last_name}
          </Typography>
        }
        subheader={formatTimeAgo(post.created_at)}
      />

      {isEditing ? (
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <MediaUpload
            onImageSelect={(file) => handleMediaChange('image', file)}
            onVideoSelect={(file) => handleMediaChange('video', file)}
            currentImage={editedImage ? URL.createObjectURL(editedImage) : post.media_urls?.image}
            currentVideo={editedVideo ? URL.createObjectURL(editedVideo) : post.media_urls?.video}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              onClick={handleCancelEdit}
              disabled={isSubmitting}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              Save
            </Button>
          </Box>
        </Box>
      ) : (
        <CardContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {post.content}
          </Typography>
          {renderMedia()}
        </CardContent>
      )}

      <Divider />

      <CardActions disableSpacing>
        <IconButton 
          onClick={handleLikePost}
          color={post.is_liked ? "primary" : "default"}
        >
          <ThumbUpIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          {post.likes_count || 0}
        </Typography>

        <IconButton onClick={() => setShowComments(!showComments)}>
          <CommentIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          {post.comments_count || 0}
        </Typography>
      </CardActions>

      {showComments && (
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Write a comment..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleComment();
                }
              }}
            />
            <Button
              variant="contained"
              sx={{ ml: 1 }}
              onClick={handleComment}
              disabled={!commentContent.trim()}
            >
              Post
            </Button>
          </Box>

          {loadingComments ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              {comments.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  onLike={() => handleCommentLike(comment.id)}
                  onDelete={() => handleDeleteComment(comment.id)}
                  currentUser={currentUser}
                />
              ))}
              
              {hasMoreComments && (
                <Button
                  fullWidth
                  onClick={() => fetchComments(commentCursor)}
                  disabled={loadingComments}
                >
                  Load More Comments
                </Button>
              )}
            </>
          )}
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditClick}>Edit</MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      >
        <DialogTitle>Delete Post</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this post? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default Post;