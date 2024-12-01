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
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  ThumbUp as ThumbUpIcon,
  ChatBubbleOutline as CommentIcon,
} from '@mui/icons-material';
import { commentService } from '../../services/commentService';
import { postService } from '../../services/postService';
import { toast } from 'react-toastify';
import Comment from './Comment';
import { useAuth } from '../../context/AuthContext';
import { usePost } from '../../context/PostContext';
import { formatTimeAgo } from '../../utils/dateUtils';

const Post = ({ post }) => {
  const { user: currentUser } = useAuth();
  const { updatePost } = usePost();
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentCursor, setCommentCursor] = useState(null);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [showComments, setShowComments] = useState(false);

  // Fetch comments when comments section is opened
  const fetchComments = async (cursor = null) => {
    try {
      setLoadingComments(true);
      const response = await commentService.getComments(post.id, cursor);
      
      if (response?.data?.comments) {
        setComments(prev => cursor ? [...prev, ...response.data.comments] : response.data.comments);
        setCommentCursor(response.data.next_cursor);
        setHasMoreComments(!!response.data.next_cursor);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  // Load comments when comment section is opened
  useEffect(() => {
    if (showComments && comments.length === 0) {
      fetchComments();
    }
  }, [showComments]);

  const handleComment = async () => {
    if (!commentContent.trim()) return;

    try {
      const response = await commentService.createComment(post.id, commentContent);
      
      if (response?.data) {
        // Update local state first
        const newComment = response.data;
        setComments(prev => [newComment, ...prev]);
        setCommentContent('');
        
        // Update post comment count
        const newCommentCount = (post.comments_count || 0) + 1;
        updatePost(post.id, { comments_count: newCommentCount });
        
        toast.success('Comment added successfully');
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast.error('Failed to post comment');
    }
  };

  const handleCommentLike = async (commentId, newLikeCount) => {
    setComments(prevComments => 
      prevComments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            is_liked: !comment.is_liked,
            likes_count: newLikeCount
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
                    likes_count: newLikeCount
                  }
                : reply
            )
          };
        }
        return comment;
      })
    );
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      
      setComments(prevComments => {
        const filteredComments = prevComments.filter(c => c.id !== commentId);
        return filteredComments.map(comment => ({
          ...comment,
          replies: comment.replies?.filter(reply => reply.id !== commentId) || []
        }));
      });
      
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
      await postService.toggleLike(post.id);
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

  return (
    <Card sx={{ mb: 3, borderRadius: 2 }}>
      <CardHeader
        avatar={
          <Avatar 
            src={post.user?.profile_picture} 
            alt={`${post.user?.first_name} ${post.user?.last_name}`}
          />
        }
        action={
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        }
        title={`${post.user?.first_name} ${post.user?.last_name}`}
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
        <Box sx={{ width: '100%', display: 'flex', gap: 2 }}>
          <Button
            startIcon={
              <ThumbUpIcon 
                sx={{ 
                  color: post.is_liked ? 'primary.main' : 'inherit'
                }}
              />
            }
            onClick={handleLikePost}
            size="small"
            sx={{
              color: post.is_liked ? 'primary.main' : 'inherit',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)'
              }
            }}
          >
            {post.likes_count || 0} {post.likes_count === 1 ? 'Like' : 'Likes'}
          </Button>
          <Button
            startIcon={<CommentIcon />}
            onClick={() => setShowComments(!showComments)}
            size="small"
          >
            {post.comments_count || 0} Comments
          </Button>
        </Box>
      </CardActions>

      {showComments && (
        <Box sx={{ p: 2, pt: 0 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Avatar 
              src={currentUser?.profile_picture} 
              sx={{ width: 32, height: 32 }}
            />
            <Box sx={{ flex: 1 }}>
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
            </Box>
          </Box>

          {comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              postId={post.id}
              onDelete={handleDeleteComment}
              onLike={handleCommentLike}
              currentUser={currentUser}
            />
          ))}

          {hasMoreComments && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                size="small"
                onClick={() => fetchComments(commentCursor)}
                disabled={loadingComments}
              >
                {loadingComments ? <CircularProgress size={20} /> : 'Load more comments'}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Card>
  );
};

export default Post;