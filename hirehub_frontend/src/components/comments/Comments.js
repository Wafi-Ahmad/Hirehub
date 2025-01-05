import React, { useState, useEffect } from 'react';
import {
    Box,
    Avatar,
    TextField,
    Typography,
    IconButton,
    CircularProgress,
    Button,
    Divider
} from '@mui/material';
import {
    ThumbUp as ThumbUpIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { commentService } from '../../services/commentService';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';

const Comments = ({ postId, onCommentAdded }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const response = await commentService.getComments(postId, cursor);
            if (response.data) {
                setComments(prev => cursor ? [...prev, ...response.data.comments] : response.data.comments);
                setCursor(response.data.next_cursor);
                setHasMore(!!response.data.next_cursor);
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error);
            toast.error('Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setSubmitting(true);
            const response = await commentService.createComment(postId, newComment.trim());
            if (response.data) {
                setComments(prev => [response.data, ...prev]);
                setNewComment('');
                if (onCommentAdded) {
                    onCommentAdded();
                }
                toast.success('Comment added successfully');
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
            toast.error('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLikeComment = async (commentId) => {
        try {
            const response = await commentService.toggleLike(commentId);
            setComments(prev => prev.map(comment => {
                if (comment.id === commentId) {
                    return {
                        ...comment,
                        is_liked: !comment.is_liked,
                        likes_count: response.data.likes_count
                    };
                }
                return comment;
            }));
        } catch (error) {
            console.error('Failed to like comment:', error);
            toast.error('Failed to update like');
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await commentService.deleteComment(commentId);
            setComments(prev => prev.filter(comment => comment.id !== commentId));
            if (onCommentAdded) {
                onCommentAdded(-1); // Decrease comment count
            }
            toast.success('Comment deleted successfully');
        } catch (error) {
            console.error('Failed to delete comment:', error);
            toast.error('Failed to delete comment');
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            {/* Comment Input */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Avatar 
                    src={user?.profile_image} 
                    alt={user?.full_name}
                    sx={{ width: 32, height: 32 }}
                />
                <Box 
                    component="form" 
                    onSubmit={handleSubmitComment} 
                    sx={{ flex: 1, display: 'flex', gap: 1 }}
                >
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={submitting}
                    />
                    <Button 
                        type="submit" 
                        variant="contained" 
                        size="small"
                        disabled={submitting || !newComment.trim()}
                    >
                        {submitting ? <CircularProgress size={20} /> : 'Post'}
                    </Button>
                </Box>
            </Box>

            {/* Comments List */}
            {comments.map(comment => (
                <Box key={comment.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Avatar 
                            src={comment.user.profile_image} 
                            alt={comment.user.full_name}
                            sx={{ width: 32, height: 32 }}
                        />
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                                <Typography variant="subtitle2">
                                    {comment.user.full_name}
                                </Typography>
                                <Typography variant="body2">
                                    {comment.content}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <IconButton 
                                    size="small" 
                                    onClick={() => handleLikeComment(comment.id)}
                                    color={comment.is_liked ? "primary" : "default"}
                                >
                                    <ThumbUpIcon fontSize="small" />
                                </IconButton>
                                <Typography variant="caption" color="text.secondary">
                                    {comment.likes_count} likes
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </Typography>
                                {comment.user.id === user?.id && (
                                    <IconButton 
                                        size="small" 
                                        onClick={() => handleDeleteComment(comment.id)}
                                        color="error"
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            ))}

            {/* Load More Button */}
            {hasMore && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button 
                        onClick={fetchComments} 
                        disabled={loading}
                        size="small"
                    >
                        {loading ? <CircularProgress size={20} /> : 'Load more comments'}
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default Comments; 