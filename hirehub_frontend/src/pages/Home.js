import React, { useState, useEffect } from 'react';
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

// Demo data
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

const demoPosts = [
  {
    id: 1,
    author: {
      name: 'Frances Guerrero',
      title: 'Web Developer at Stackbros',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg'
    },
    timestamp: '2 hours ago',
    content: "I'm thrilled to share that I've completed a graduate certificate course in project management with the president's honor roll.",
    image: 'https://source.unsplash.com/random/800x400?meeting'
  },
  // Add more demo posts as needed
];

const Home = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState(demoPosts);
  const [showComments, setShowComments] = useState({});

  // Function to format post data
  const formatPost = (post) => {
    // If it's a demo post, return as is
    if (post.author) return post;

    // Format API post data to match our UI structure
    return {
      id: post.id,
      author: {
        name: `${post.user.first_name} ${post.user.last_name}`,
        title: post.user.company_name || 'User',
        avatar: post.user.profile_picture || `https://ui-avatars.com/api/?name=${post.user.first_name}+${post.user.last_name}`,
      },
      content: post.content,
      attachment: post.attachment,
      timestamp: new Date(post.created_at).toLocaleString(),
      likes: post.likes?.length || 0,
      isLiked: post.likes?.includes(user?.id),
      comments: post.comments || [],
    };
  };

  // Function to handle new post creation
  const handlePostCreated = (newPost) => {
    setPosts([formatPost(newPost), ...posts]);
  };

  // Function to handle post like
  const handleLikePost = async (postId) => {
    try {
      await postService.likePost(postId);
      // Update the posts state to reflect the new like count
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: post.likes ? post.likes + 1 : 1,
            isLiked: true
          };
        }
        return post;
      }));
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  // Function to handle comment creation
  const handleCreateComment = async (postId, content) => {
    try {
      const response = await postService.createComment(postId, content);
      // Update the posts state to include the new comment
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...(post.comments || []), response.data]
          };
        }
        return post;
      }));
    } catch (error) {
      toast.error('Failed to create comment');
    }
  };

  // Left Sidebar Component
  const ProfileSection = () => (
    <Paper elevation={1} sx={{ p: 0, mb: 3, borderRadius: 2 }}>
      <Box sx={{ position: 'relative', height: 200 }}>
        <Box
          component="img"
          src="https://source.unsplash.com/random/800x200?landscape"
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
  );

  // Right Sidebar Component
  const ConnectionsSection = () => (
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
  );

  // Updated Post Component
  const Post = ({ post }) => {
    const [isCommenting, setIsCommenting] = useState(false);
    const [commentContent, setCommentContent] = useState('');

    // Safely access post properties
    const formattedPost = formatPost(post);

    return (
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardHeader
          avatar={
            <Avatar 
              src={formattedPost.author.avatar}
              alt={formattedPost.author.name}
            />
          }
          action={<IconButton><MoreVertIcon /></IconButton>}
          title={
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {formattedPost.author.name}
            </Typography>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              {formattedPost.author.title} • {formattedPost.timestamp}
            </Typography>
          }
        />
        <CardContent>
          <Typography variant="body1" paragraph>
            {formattedPost.content}
          </Typography>
          {formattedPost.attachment && (
            <Box
              component="img"
              src={formattedPost.attachment}
              sx={{
                width: '100%',
                borderRadius: 1,
                mb: 2
              }}
            />
          )}
        </CardContent>
        <CardActions sx={{ px: 2 }}>
          <Button
            startIcon={<ThumbUpIcon color={formattedPost.isLiked ? "primary" : "inherit"} />}
            onClick={() => handleLikePost(formattedPost.id)}
          >
            Like ({formattedPost.likes})
          </Button>
          <Button
            startIcon={<CommentIcon />}
            onClick={() => setShowComments(prev => ({...prev, [formattedPost.id]: !prev[formattedPost.id]}))}
          >
            Comment ({formattedPost.comments?.length || 0})
          </Button>
        </CardActions>

        {showComments[formattedPost.id] && (
          <Box sx={{ px: 2, pb: 2 }}>
            {formattedPost.comments?.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                onDelete={(commentId) => {
                  setPosts(posts.map(p => {
                    if (p.id === formattedPost.id) {
                      return {
                        ...p,
                        comments: p.comments.filter(c => c.id !== commentId)
                      };
                    }
                    return p;
                  }));
                }}
                onReply={(newComment) => {
                  setPosts(posts.map(p => {
                    if (p.id === formattedPost.id) {
                      return {
                        ...p,
                        comments: [...p.comments, newComment]
                      };
                    }
                    return p;
                  }));
                }}
                onLike={(commentId) => {
                  setPosts(posts.map(p => {
                    if (p.id === formattedPost.id) {
                      return {
                        ...p,
                        comments: p.comments.map(c => {
                          if (c.id === commentId) {
                            return {
                              ...c,
                              likes: c.likes ? c.likes + 1 : 1
                            };
                          }
                          return c;
                        })
                      };
                    }
                    return p;
                  }));
                }}
                currentUser={user}
              />
            ))}
          </Box>
        )}
      </Card>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <ProfileSection />
        </Grid>

        <Grid item xs={12} md={6}>
          <CreatePost onPostCreated={handlePostCreated} user={user} />
          {posts.map((post) => (
            <Post key={post.id} post={post} />
          ))}
        </Grid>

        <Grid item xs={12} md={3}>
          <ConnectionsSection />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home; 