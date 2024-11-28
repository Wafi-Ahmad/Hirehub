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
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  ThumbUp as ThumbUpIcon,
  ChatBubbleOutline as CommentIcon,
} from '@mui/icons-material';
import { commentService } from '../../services/commentService';
import { likeService } from '../../services/likeService';
import { toast } from 'react-toastify';
import Comment from './Comment';
import { useAuth } from '../../context/AuthContext';
import { formatTimeAgo } from '../../utils/dateUtils';

const Post = ({ post, onPostUpdate }) => {
  const { user: currentUser } = useAuth();
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
      
      if (response.data?.comments) {  // Fixed: Access correct response structure
        setComments(prev => cursor ? [...prev, ...response.data.comments] : response.data.comments);
        setCommentCursor(response.data.next_cursor);
        setHasMoreComments(!!response.data.next_cursor);
      }
    } catch (error) {
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
        setComments(prev => [response.data, ...prev]);
        onPostUpdate(post.id, { comments_count: post.comments_count + 1 });
        setCommentContent('');
        setIsCommenting(false);
        toast.success('Comment posted successfully');
      }
    } catch (error) {
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
        // Remove the comment if it's a top-level comment
        const filteredComments = prevComments.filter(c => c.id !== commentId);
        // Remove the comment if it's a reply
        return filteredComments.map(comment => ({
          ...comment,
          replies: comment.replies?.filter(reply => reply.id !== commentId) || []
        }));
      });
      
      onPostUpdate(post.id, { comments_count: post.comments_count - 1 });
      toast.success('Comment deleted successfully');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleLikePost = async () => {
    try {
      const response = await likeService.togglePostLike(post.id);
      onPostUpdate(post.id, {
        is_liked: !post.is_liked,
        likes_count: response.likes_count
      });
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const renderMedia = () => {
    if (!post.media_urls) return null;

    // Get the backend base URL from your environment or config
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    if (post.media_type === 'image') {
      return (
        <Box
          component="img"
          src={`${baseURL}${post.media_urls.image}`}  // Prepend base URL
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
          <source src={`${baseURL}${post.media_urls.video}`} />  // Prepend base URL
          Your browser does not support the video tag.
        </Box>
      );
    }

    if (post.media_type === 'both') {
      return (
        <>
          <Box
            component="img"
            src={`${baseURL}${post.media_urls.image}`}  // Prepend base URL
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
            <source src={`${baseURL}${post.media_urls.video}`} />  // Prepend base URL
            Your browser does not support the video tag.
          </Box>
        </>
      );
    }
  };

  return (
    <Card sx={{ mb: 3, borderRadius: 2 }}>
      <CardHeader
        avatar={
          <Avatar 
            src={post.user.profile_picture}
            alt={`${post.user.first_name} ${post.user.last_name}`}
          />
        }
        action={<IconButton><MoreVertIcon /></IconButton>}
        title={
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {`${post.user.first_name} ${post.user.last_name}`}
          </Typography>
        }
        subheader={
          <Typography variant="body2" color="text.secondary">
            {formatTimeAgo(post.created_at)}
          </Typography>
        }
      />
      <CardContent>
        <Typography variant="body1" paragraph>
          {post.content}
        </Typography>
        {renderMedia()}
      </CardContent>
      <CardActions sx={{ px: 2 }}>
        <IconButton
          onClick={handleLikePost}
          color={post.is_liked ? "primary" : "inherit"}
        >
          <ThumbUpIcon />
          <Typography variant="caption" sx={{ ml: 0.5 }}>
            {post.likes_count || 0}
          </Typography>
        </IconButton>
        <IconButton onClick={() => setShowComments(!showComments)}>
          <CommentIcon />
          <Typography variant="caption" sx={{ ml: 0.5 }}>
            {post.comments_count || 0}
          </Typography>
        </IconButton>
      </CardActions>

      {showComments && (
        <Box sx={{ px: 2, pb: 2 }}>
          {isCommenting ? (
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
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
                onClick={handleComment}
                disabled={!commentContent.trim()}
              >
                Post
              </Button>
            </Box>
          ) : (
            <Button
              fullWidth
              sx={{ mt: 1 }}
              onClick={() => setIsCommenting(true)}
            >
              Write a comment...
            </Button>
          )}

          {loadingComments ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
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
                <Button
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => fetchComments(commentCursor)}
                  disabled={loadingComments}
                >
                  {loadingComments ? (
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                  ) : (
                    'Load more comments'
                  )}
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