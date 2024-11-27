import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Box,
  Avatar,
  Typography,
  Button,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  IconButton,
  Divider,
  CircularProgress,
  TextField,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  ThumbUp as ThumbUpIcon,
  ChatBubbleOutline as CommentIcon,
} from '@mui/icons-material';
import CreatePost from '../components/post/CreatePost';
import Comment from '../components/post/Comment';
import { postService } from '../services/postService';
import { toast } from 'react-toastify';
import api from '../services/api';

const demoConnections = [
  {
    id: 1,
    name: 'Frances Guerrero',
    title: 'News anchor',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg'
  },
  {
    id: 2,
    name: 'Lori Ferguson',
    title: 'Web Developer',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
  },
  {
    id: 3,
    name: 'Samuel Bishop',
    title: 'News anchor',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
  },
  {
    id: 4,
    name: 'Dennis Barrett',
    title: 'Web Developer at Stackbros',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg'
  },
  {
    id: 5,
    name: 'Judy Nguyen',
    title: 'News anchor',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg'
  },
];

const Home = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState({});
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch posts with cursor-based pagination
  const fetchPosts = useCallback(async (nextCursor = null) => {
    try {
      const response = await postService.getPosts(nextCursor);
      const { posts: newPosts, next_cursor } = response.data;
      
      setPosts(prev => nextCursor ? [...prev, ...newPosts] : newPosts);
      setCursor(next_cursor);
      setHasMore(!!next_cursor);
    } catch (error) {
      toast.error('Failed to fetch posts');
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Load more posts
  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchPosts(cursor);
  };

  // Handle new post creation
  const handlePostCreated = useCallback((newPost) => {
    setPosts(prev => [newPost, ...prev]);
  }, []);

  // Handle comment like
  const handleCommentLike = async (commentId) => {
    try {
      const response = await postService.likeComment(commentId);
      setPosts(prevPosts => 
        prevPosts.map(post => ({
          ...post,
          comments: post.comments?.map(comment => 
            comment.id === commentId
              ? {
                  ...comment,
                  is_liked: !comment.is_liked,
                  likes_count: response.likes_count
                }
              : comment
          )
        }))
      );
    } catch (error) {
      toast.error('Failed to like comment');
    }
  };

  // Post Component
  const Post = ({ post }) => {
    const [isCommenting, setIsCommenting] = useState(false);
    const [commentContent, setCommentContent] = useState('');
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentCursor, setCommentCursor] = useState(null);
    const [hasMoreComments, setHasMoreComments] = useState(true);

    // Fetch comments when comments section is opened
    const fetchComments = async (postId, cursor = null) => {
      try {
        setLoadingComments(true);
        const response = await api.get(`/comments/${postId}/comments/`, {
          params: { cursor, limit: 10 }
        });
        
        const { comments: newComments, next_cursor } = response.data;
        setComments(prev => cursor ? [...prev, ...newComments] : newComments);
        setCommentCursor(next_cursor);
        setHasMoreComments(!!next_cursor);
      } catch (error) {
        toast.error('Failed to load comments');
      } finally {
        setLoadingComments(false);
      }
    };

    // Load comments when comment section is opened
    useEffect(() => {
      if (showComments[post.id] && comments.length === 0) {
        fetchComments(post.id);
      }
    }, [showComments[post.id], post.id]);

    const handleComment = async () => {
      if (!commentContent.trim()) return;

      try {
        const response = await postService.createComment(post.id, commentContent);
        
        if (response?.data) {
          // Add new comment to the beginning of the list
          setComments(prev => [response.data, ...prev]);
          // Update post comment count
          setPosts(prevPosts => 
            prevPosts.map(p => 
              p.id === post.id 
                ? { ...p, comments_count: p.comments_count + 1 }
                : p
            )
          );

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
          // Also check and update replies if they exist
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
        await postService.deleteComment(commentId);
        
        // Remove comment from state
        setComments(prevComments => {
          const newComments = prevComments.filter(c => c.id !== commentId);
          // Also filter out the comment if it's a reply
          return prevComments.map(comment => ({
            ...comment,
            replies: comment.replies?.filter(reply => reply.id !== commentId) || []
          }));
        });
        
        // Update post comment count
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === post.id 
              ? { ...p, comments_count: p.comments_count - 1 }
              : p
          )
        );
        
        toast.success('Comment deleted successfully');
      } catch (error) {
        toast.error('Failed to delete comment');
      }
    };

    const handleReplyToComment = async (commentId, replyContent) => {
      try {
        const response = await postService.replyToComment(commentId, replyContent);
        
        if (response?.data) {
          setComments(prevComments =>
            prevComments.map(comment =>
              comment.id === commentId
                ? {
                    ...comment,
                    replies: [...(comment.replies || []), response.data],
                    replies_count: (comment.replies_count || 0) + 1
                  }
                : comment
            )
          );
          
          // Update post comment count
          setPosts(prevPosts => 
            prevPosts.map(p => 
              p.id === post.id 
                ? { ...p, comments_count: p.comments_count + 1 }
                : p
            )
          );
        }
      } catch (error) {
        toast.error('Failed to post reply');
      }
    };

    const handleLikePost = async () => {
      try {
        const response = await postService.likePost(post.id);
        setPosts(prevPosts => prevPosts.map(p => {
          if (p.id === post.id) {
            return {
              ...p,
              is_liked: !p.is_liked,
              likes_count: response.likes_count
            };
          }
          return p;
        }));
      } catch (error) {
        toast.error('Failed to like post');
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
              {new Date(post.created_at).toLocaleString()}
            </Typography>
          }
        />
        <CardContent>
          <Typography variant="body1" paragraph>
            {post.content}
          </Typography>
          {post.attachment && (
            <Box
              component="img"
              src={post.attachment}
              sx={{
                width: '100%',
                borderRadius: 1,
                mb: 2,
                maxHeight: 500,
                objectFit: 'contain'
              }}
              loading="lazy"
            />
          )}
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
          <IconButton
            onClick={() => setShowComments(prev => ({...prev, [post.id]: !prev[post.id]}))}
          >
            <CommentIcon />
            <Typography variant="caption" sx={{ ml: 0.5 }}>
              {post.comments_count || 0}
            </Typography>
          </IconButton>
        </CardActions>

        {showComments[post.id] && (
          <Box sx={{ px: 2, pb: 2 }}>
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
                    onReply={handleReplyToComment}
                    currentUser={user}
                  />
                ))}
                
                {hasMoreComments && (
                  <Button
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => fetchComments(post.id, commentCursor)}
                    disabled={loadingComments}
                  >
                    Load more comments
                  </Button>
                )}
              </>
            )}

            {/* Comment input section */}
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
          </Box>
        )}
      </Card>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper elevation={1} sx={{ p: 0, mb: 3, borderRadius: 2 }}>
            <Box sx={{ position: 'relative', height: 200 }}>
              <Box
                component="img"
                src="https://picsum.photos/800/200"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '8px 8px 0 0',
                }}
              />
              <Avatar
                sx={{
                  width: 90,
                  height: 90,
                  border: '4px solid white',
                  position: 'absolute',
                  bottom: -45,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
                src={user?.profile_picture || "https://randomuser.me/api/portraits/men/88.jpg"}
              />
            </Box>
            <Box sx={{ pt: 6, pb: 3, px: 3, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Sam Lanson</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Web Developer at Stackbros
              </Typography>
              <Box sx={{ mt: 2, mb: 3, display: 'flex', justifyContent: 'center', gap: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">256</Typography>
                  <Typography variant="body2" color="text.secondary">Posts</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">2.5K</Typography>
                  <Typography variant="body2" color="text.secondary">Connections</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">365</Typography>
                  <Typography variant="body2" color="text.secondary">Following</Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                I'd love to change the world, but they won't give me the source code.
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Button fullWidth variant="text" color="primary">
                View Profile
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <CreatePost onPostCreated={handlePostCreated} user={user} />
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : posts.length > 0 ? (
            <>
              {posts.map((post) => (
                <Post key={post.id} post={post} />
              ))}
              {hasMore && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    onClick={loadMorePosts}
                    disabled={loadingMore}
                    variant="outlined"
                  >
                    {loadingMore ? <CircularProgress size={24} /> : 'Load More'}
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No posts yet. Be the first to share something!
              </Typography>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Who to connect with
              </Typography>
            </Box>
            {demoConnections.map((connection, index) => (
              <Box key={connection.id} sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={connection.avatar} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{connection.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {connection.title}
                    </Typography>
                  </Box>
                  <Button 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      borderRadius: 5,
                      minWidth: 32,
                      width: 32,
                      height: 32,
                      p: 0
                    }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                {index < demoConnections.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}
            <Button fullWidth sx={{ mt: 1 }} color="primary">
              View more
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home; 