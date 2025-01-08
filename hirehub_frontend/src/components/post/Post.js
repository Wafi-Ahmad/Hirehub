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
  Button,
  TextField,
  CircularProgress,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
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
import Comments from '../comments/Comments';

const Post = ({ post, onDelete }) => {
  const { user: currentUser } = useAuth();
  const { updatePost } = usePost();
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
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                is_liked: !comment.is_liked,
                likes_count: response.data.likes_count
              };
            }
            if (comment.replies?.length > 0) {
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

  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      
      // Update local state
      setComments(prevComments => {
        const filteredComments = prevComments.filter(c => c.id !== commentId);
        const updatedComments = filteredComments.map(comment => ({

          ...comment,
          replies: comment.replies?.filter(reply => reply.id !== commentId) || []
        }));
        return updatedComments;
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
    // Get the current state before updating
    const currentLikeState = post.is_liked;
    const currentLikeCount = post.likes_count || 0;

    try {
      // Optimistically update UI
      const newLikeState = !currentLikeState;
      const newLikeCount = currentLikeCount + (newLikeState ? 1 : -1);
      
      // Update UI immediately
      updatePost(post.id, {
        is_liked: newLikeState,
        likes_count: newLikeCount
      });

      // Make API call
      const response = await postService.toggleLike(post.id);
      
      // Update with actual server response if different
      if (response?.data?.likes_count !== newLikeCount) {
        updatePost(post.id, {
          likes_count: response.data.likes_count
        });
      }
    } catch (error) {
      console.error('Failed to update like:', error);
      toast.error('Failed to update like');
      // Revert changes on error
      updatePost(post.id, {
        is_liked: currentLikeState,
        likes_count: currentLikeCount
      });
    }
  };

  const handleFollow = async () => {
    try {
      await userService.followUser(post.user.id);
      // Update local state
      updatePost(post.id, {
        user: {
          ...post.user,
          is_following: true
        }
      });
      toast.success('Successfully followed user');
    } catch (error) {
      toast.error('Failed to follow user');
      console.error('Follow error:', error);
    }
  };

  const handleUnfollow = async () => {
    try {
      await userService.followUser(post.user.id);
      // Update local state
      updatePost(post.id, {
        user: {
          ...post.user,
          is_following: false
        }
      });
      toast.success('Successfully unfollowed user');
    } catch (error) {
      toast.error('Failed to unfollow user');
      console.error('Unfollow error:', error);
    }
  };

  const renderMedia = () => {
    if (!post.media_urls) return null;

    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    if (post.media_type === 'image') {
      return (
        <Box
          component="img"
          src={`${baseURL}${post.media_urls.image}`}
          sx={{
            width: '100%',
            borderRadius: 1,
            mb: 2,
            maxHeight: 500,
            objectFit: 'contain'
          }}
          loading="lazy"
          alt="Post image"
        />
      );
    }

    if (post.media_type === 'video') {
      return (
        <Box
          component="video"
          controls
          sx={{
            width: '100%',
            borderRadius: 1,
            mb: 2,
            maxHeight: 500,
          }}
        >
          <source src={`${baseURL}${post.media_urls.video}`} />
          Your browser does not support the video tag.
        </Box>
      );
    }

    return null;
  };

  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    try {
      await postService.deletePost(post.id);
      toast.success('Post deleted successfully');
      onDelete(post.id);
    } catch (error) {
      toast.error('Failed to delete post');
      console.error('Error deleting post:', error);
    }
    handleMenuClose();
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        avatar={
          <Avatar 
            src={post.user?.profile_picture} 
            alt={post.user?.user_type === 'Company' ? post.user?.company_name : `${post.user?.first_name} ${post.user?.last_name}`}
            sx={{ cursor: 'pointer' }}
            onClick={() => handleProfileClick(post.user?.id)}
          />
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{ 
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={() => handleProfileClick(post.user?.id)}
            >
              {post.user?.user_type === 'Company' ? post.user?.company_name : `${post.user?.first_name} ${post.user?.last_name}`}
            </Typography>
            {currentUser?.id !== post.user?.id && (
              <Tooltip title={post.user?.is_following ? "Unfollow" : "Follow"}>
                <IconButton
                  size="small"
                  onClick={post.user?.is_following ? handleUnfollow : handleFollow}
                  color={post.user?.is_following ? "primary" : "default"}
                >
                  {post.user?.is_following ? <PersonRemoveIcon /> : <PersonAddIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        }
        action={
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        }
        subheader={formatTimeAgo(post.created_at)}
      />
      
      <CardContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {post.content}
        </Typography>
        {renderMedia()}
      </CardContent>

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
                  onLike={handleCommentLike}
                  onDelete={handleDeleteComment}
                  onReply={handleComment}
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
    </Card>
  );
};

export default Post;