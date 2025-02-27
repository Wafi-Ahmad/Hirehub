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
  Chip,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  ThumbUp as ThumbUpIcon,
  ChatBubbleOutline as CommentIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Close as CloseIcon,
  Recommend as RecommendIcon,
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
import { MEDIA_BASE_URL } from '../../config';
import { useProfile } from '../../context/ProfileContext';
import { Link } from 'react-router-dom';

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
  const [isMediaDeleted, setIsMediaDeleted] = useState(false);
  const [tempMediaUrls, setTempMediaUrls] = useState(post.media_urls || {});
  const [tempMediaType, setTempMediaType] = useState(post.media_type);
  const [editSelectedFiles, setEditSelectedFiles] = useState({
    image: null,
    video: null
  });
  const { followData, updateFollowData } = useProfile();
  const [isFollowing, setIsFollowing] = useState(post?.is_following || false);

  // Reset states when post changes
  useEffect(() => {
    if (post) {
      setEditedContent(post.content);
      setEditedImage(null);
      setEditedVideo(null);
      setIsMediaDeleted(false);
      setTempMediaUrls(post.media_urls || {});
      setTempMediaType(post.media_type);
    }
  }, [post]);

  // Update isFollowing when followData changes
  useEffect(() => {
    setIsFollowing(followData?.following?.includes(post.user.id) || false);
  }, [followData, post.user.id]);

  // Fetch comments when comments section is opened
  const fetchComments = async (cursor = null) => {
    try {
      setLoadingComments(true);
      const response = await commentService.getComments(post.id, cursor);
      
      if (response?.data?.comments) {
        const newComments = response.data.comments;
        
        // Update comments with proper reply counts
        const commentsWithCounts = newComments.map(comment => ({
          ...comment,
          reply_count: comment.replies?.length || 0
        }));
        
        setComments(prev => cursor ? [...prev, ...commentsWithCounts] : commentsWithCounts);
        setCommentCursor(response.data.next_cursor);
        setHasMoreComments(!!response.data.next_cursor);
        
        // Show comments section automatically if there are comments
        if (newComments.length > 0) {
          setShowComments(true);
        }

        // Update post's comment count to include replies
        const totalCount = newComments.reduce((acc, comment) => 
          acc + 1 + (comment.replies?.length || 0), 0
        );
        updatePost(post.id, { comments_count: totalCount });
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

  const handleDeleteComment = async (commentId, isReply = false, parentCommentId = null) => {
    try {
      console.log('Deleting comment:', { commentId, isReply, parentCommentId }); // Debug log
      
      // First make the API call to ensure deletion is successful
      if (isReply) {
        if (!parentCommentId) {
          // Find parent comment ID if not provided
          const parentComment = comments.find(c => 
            c.replies && c.replies.some(r => r.id === commentId)
          );
          if (parentComment) {
            parentCommentId = parentComment.id;
          } else {
            console.error('Parent comment not found for reply:', commentId);
            toast.error('Could not delete reply: parent comment not found');
            return;
          }
        }
        await commentService.deleteReply(parentCommentId, commentId);
        
        // Update the parent comment's replies
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment.id === parentCommentId) {
              const updatedReplies = comment.replies.filter(reply => reply.id !== commentId);
              return {
                ...comment,
                replies: updatedReplies,
                reply_count: updatedReplies.length
              };
            }
            return comment;
          })
        );
      } else {
        // For parent comment deletion
        await commentService.deleteComment(commentId, post.comments_count || 0);
        
        // Remove the comment and its replies from the state
        const commentToDelete = comments.find(c => c.id === commentId);
        const totalCount = 1 + (commentToDelete?.replies?.length || 0); // Parent + replies
        
        setComments(prevComments => prevComments.filter(c => c.id !== commentId));
        
        // Update post's comment count
        updatePost(post.id, { 
          comments_count: Math.max(0, (post.comments_count || 0) - totalCount)
        });
      }

      // Refresh comments to ensure everything is in sync
      await fetchComments();
      
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error(error.response?.data?.error || 'Failed to delete comment');
      
      // Revert the changes if the API call failed
      fetchComments();
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
    // Reset all edit-related states
    setEditedContent(post.content);
    setEditedImage(null);
    setEditedVideo(null);
    setIsMediaDeleted(false);
    setTempMediaUrls(post.media_urls || {});
    setTempMediaType(post.media_type);
    
    // Start editing
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
    setIsMediaDeleted(false);
    setTempMediaUrls(post.media_urls || {});
    setTempMediaType(post.media_type);
  };

  const handleSaveEdit = async () => {
    try {
      setIsSubmitting(true);
      console.log('Saving edit with state:', {
        content: editedContent,
        isMediaDeleted,
        hasEditedImage: !!editedImage,
        hasEditedVideo: !!editedVideo
      });

      const response = await postService.editPost(
        post.id,
        {
          content: editedContent,
          image: editedImage,
          video: editedVideo,
          isMediaDeleted: isMediaDeleted
        }
      );
      
      if (response?.data) {
        // Force media to be cleared if it was deleted
        const updatedPost = {
          ...post,
          ...response.data,
          content: editedContent,
          // Always ensure media is cleared if it was deleted
          media_type: isMediaDeleted ? 'none' : response.data.media_type,
          media_urls: isMediaDeleted ? {} : response.data.media_urls || {}
        };

        // Update post in context
        updatePost(post.id, updatedPost);
        
        // Force update the original post object to ensure future edits start clean
        post.media_type = updatedPost.media_type;
        post.media_urls = updatedPost.media_urls;
        
        // Reset all media-related states
        setIsEditing(false);
        setEditedImage(null);
        setEditedVideo(null);
        setTempMediaUrls(isMediaDeleted ? {} : updatedPost.media_urls);
        setTempMediaType(isMediaDeleted ? 'none' : updatedPost.media_type);
        
        // Keep isMediaDeleted state if media was deleted
        if (!isMediaDeleted) {
          setIsMediaDeleted(false);
        }
        
        toast.success('Post updated successfully');
      }
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

  const handleMediaChange = (file, type) => {
    console.log(`handleMediaChange called with file type: ${type}, file:`, file);
    
    if (type === 'image') {
      // Force clear any existing image preview URLs
      if (tempMediaUrls?.image) {
        setTempMediaUrls(prev => ({
          ...prev,
          image: null
        }));
      }
      
      setEditedImage(file);
      if (file) {
        setEditedVideo(null); // Remove video if image is selected
        setIsMediaDeleted(false); // Reset the media deleted flag when new media is selected
        
        // Force update the preview
        const newImageUrl = URL.createObjectURL(file);
        console.log('Created new image URL:', newImageUrl);
      }
    } else if (type === 'video') {
      // Force clear any existing video preview URLs
      if (tempMediaUrls?.video) {
        setTempMediaUrls(prev => ({
          ...prev,
          video: null
        }));
      }
      
      setEditedVideo(file);
      if (file) {
        setEditedImage(null); // Remove image if video is selected
        setIsMediaDeleted(false); // Reset the media deleted flag when new media is selected
        
        // Force update the preview
        const newVideoUrl = URL.createObjectURL(file);
        console.log('Created new video URL:', newVideoUrl);
      }
    }
  };

  const handleRemoveMedia = (type) => {
    // Clear the edited media state
    if (type === 'image') {
      setEditedImage(null);
    } else if (type === 'video') {
      setEditedVideo(null);
    }
    
    // Mark media as deleted and update temporary states
    setIsMediaDeleted(true);
    setTempMediaUrls(prev => ({
      ...prev,
      [type]: null
    }));
    setTempMediaType('none');
    
    console.log('Media removed:', type); // Debug log
  };

  const getMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob:')) {
      return url;
    }
    // Handle both full and partial media paths
    if (url.startsWith('/media/')) {
      return `${MEDIA_BASE_URL}${url}`;
    }
    return `${MEDIA_BASE_URL}/media/${url}`;
  };

  const renderMedia = () => {
    if (isEditing) {
      // When editing, use temporary media state
      if (!tempMediaUrls?.image && !tempMediaUrls?.video && !editedImage && !editedVideo) return null;
    } else {
      // When not editing, use post's media state
      if (!post.media_urls && !post.image && !post.video) return null;
    }

    // Handle image display
    if ((tempMediaType === 'image' && tempMediaUrls?.image) || editedImage) {
      const imageUrl = editedImage 
        ? URL.createObjectURL(editedImage)
        : getMediaUrl(tempMediaUrls?.image);
      return (
        <Box
          component="img"
          src={imageUrl}
          alt="Post image"
          sx={{
            width: '100%',
            maxHeight: 500,
            objectFit: 'cover',
            borderRadius: 1,
            mb: 2
          }}
          onError={(e) => {
            console.error('Image load error:', e);
            console.error('Failed URL:', imageUrl);
            e.target.style.display = 'none';
          }}
        />
      );
    }

    // Handle video display
    if ((tempMediaType === 'video' && tempMediaUrls?.video) || editedVideo) {
      const videoUrl = editedVideo
        ? URL.createObjectURL(editedVideo)
        : getMediaUrl(tempMediaUrls?.video);
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
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </Box>
      );
    }

    return null;
  };

  const handleEditFileSelect = (file, type) => {
    setEditSelectedFiles(prev => ({
      ...prev,
      [type]: file,
      // Remove the other type of media when one is selected
      [type === 'image' ? 'video' : 'image']: null
    }));
  };

  const handleEditRemoveFile = (type) => {
    setEditSelectedFiles(prev => ({
      ...prev,
      [type]: null
    }));
  };

  const handleFollow = async () => {
    try {
      const response = await userService.followUser(post.user.id);
      const { followers_count, following_count, is_following, message } = response.data;

      // Update follow data
      updateFollowData(prev => ({
        ...prev,
        followers_count,
        following_count,
        following: [...(prev?.following || []), post.user.id]
      }));

      // Update local state
      setIsFollowing(true);
      toast.success(message || 'Successfully followed user');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to follow user');
    }
  };

  const handleUnfollow = async () => {
    try {
      const response = await userService.unfollowUser(post.user.id);
      const { followers_count, following_count, is_following, message } = response.data;

      // Update follow data
      updateFollowData(prev => ({
        ...prev,
        followers_count,
        following_count,
        following: (prev?.following || []).filter(id => id !== post.user.id)
      }));

      // Update local state
      setIsFollowing(false);
      toast.success(message || 'Successfully unfollowed user');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unfollow user');
    }
  };

  // Reset edit states when edit mode changes
  useEffect(() => {
    if (isEditing) {
      console.log('Edit mode activated, resetting states');
      setEditedContent(post.content);
      setEditedImage(null);
      setEditedVideo(null);
      setIsMediaDeleted(false);
      setTempMediaUrls(post.media_urls || {});
      setTempMediaType(post.media_type);
    }
  }, [isEditing, post]);

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        avatar={
          <Avatar
            src={post.user.profile_picture}
            alt={post.user.company_name || `${post.user.first_name} ${post.user.last_name}`}
          />
        }
        action={
          <>
            {post.is_recommended && (
              <Chip
                icon={<RecommendIcon />}
                label="Recommended"
                color="primary"
                variant="outlined"
                size="small"
                sx={{ mr: 1 }}
              />
            )}
            {post.user.id === currentUser?.id && (
              <IconButton onClick={handleMenuClick}>
                <MoreVertIcon />
              </IconButton>
            )}
          </>
        }
        title={
          <Link
            to={`/profile/${post.user.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            {post.user.company_name || `${post.user.first_name} ${post.user.last_name}`}
          </Link>
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
          
          {/* Show current image with delete option if not already deleted and no new image selected */}
          {!isMediaDeleted && tempMediaUrls?.image && !editedImage && (
            <Box sx={{ position: 'relative', mb: 2 }}>
              <img
                src={getMediaUrl(tempMediaUrls.image)}
                alt="Current post image"
                style={{
                  width: '100%',
                  maxHeight: 300,
                  objectFit: 'contain',
                  borderRadius: 8
                }}
              />
              <IconButton
                onClick={() => handleRemoveMedia('image')}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' },
                }}
              >
                <CloseIcon sx={{ color: 'white' }} />
              </IconButton>
            </Box>
          )}

          {/* Show current video with delete option if not already deleted and no new video selected */}
          {!isMediaDeleted && tempMediaUrls?.video && !editedVideo && (
            <Box sx={{ position: 'relative', mb: 2 }}>
              <video
                controls
                style={{
                  width: '100%',
                  maxHeight: 300,
                  borderRadius: 8
                }}
              >
                <source src={getMediaUrl(tempMediaUrls.video)} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <IconButton
                onClick={() => handleRemoveMedia('video')}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' },
                }}
              >
                <CloseIcon sx={{ color: 'white' }} />
              </IconButton>
            </Box>
          )}

          {/* Show preview of newly selected image */}
          {editedImage && (
            <Box sx={{ position: 'relative', mb: 2 }}>
              <img
                src={URL.createObjectURL(editedImage)}
                alt="New post image"
                style={{
                  width: '100%',
                  maxHeight: 300,
                  objectFit: 'contain',
                  borderRadius: 8
                }}
              />
              <IconButton
                onClick={() => handleRemoveMedia('image')}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' },
                }}
              >
                <CloseIcon sx={{ color: 'white' }} />
              </IconButton>
            </Box>
          )}

          {/* Show preview of newly selected video */}
          {editedVideo && (
            <Box sx={{ position: 'relative', mb: 2 }}>
              <video
                controls
                style={{
                  width: '100%',
                  maxHeight: 300,
                  borderRadius: 8
                }}
              >
                <source src={URL.createObjectURL(editedVideo)} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <IconButton
                onClick={() => handleRemoveMedia('video')}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' },
                }}
              >
                <CloseIcon sx={{ color: 'white' }} />
              </IconButton>
            </Box>
          )}

          {/* Always show media upload in edit mode */}
          <MediaUpload
            key={`edit-media-${post.id}`}
            onFileSelect={handleMediaChange}
            selectedFiles={{
              image: editedImage,
              video: editedVideo
            }}
            onRemoveFile={handleRemoveMedia}
            hidePreview={true}
            isEditMode={true}
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
                  onDelete={handleDeleteComment}
                  currentUser={currentUser}
                  parentId={null}
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