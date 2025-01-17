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
import Comment from '../post/Comment';  // Import the reply Comment component

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

    // Handle Like for both comments and replies
    const handleLikeComment = async (commentId) => {
        try {
            const response = await commentService.toggleLike(commentId);
            const newIsLiked = response.data.is_liked;
            const newLikesCount = parseInt(response.data.likes_count);

            // Console log to check updates
            console.log('Comment Liked:', commentId, newIsLiked, newLikesCount);

            // Update both comments and replies state
            setComments(prevComments =>
                prevComments.map(comment => {
                    if (comment.id === commentId) {
                        // Update main comment
                        return { ...comment, is_liked: newIsLiked, likes_count: newLikesCount };
                    }
                    if (comment.replies && comment.replies.length > 0) {
                        const updatedReplies = comment.replies.map(reply =>
                            reply.id === commentId
                                ? { ...reply, is_liked: newIsLiked, likes_count: newLikesCount }
                                : reply
                        );
                        return { ...comment, replies: updatedReplies };
                    }
                    return comment;
                })
            );
        } catch (error) {
            console.error('Failed to like comment:', error);
            toast.error('Failed to update like');
        }
    };
    /**
     * Delete a comment or reply
     * @param {number} commentId   - the ID of the comment or reply you want to delete
     * @param {boolean} isReply    - whether this is a reply
     */

    const handleDeleteComment = async (commentId, isReply = false, parentCommentId = null) => {
        try {
            // Enhanced debug logging
            console.log('Comments.js - Attempting to delete:', {
                commentId,
                isReply,
                parentCommentId,
                currentUserId: user?.id,
                timestamp: new Date().toISOString()
            });

            // Find the comment/reply to verify ownership
            const findComment = (id, isReply) => {
                for (const comment of comments) {
                    if (!isReply && comment.id === id) return comment;
                    if (comment.replies) {
                        const reply = comment.replies.find(r => r.id === id);
                        if (reply) return { reply, parentId: comment.id };
                    }
                }
                return null;
            };

            const target = findComment(commentId, isReply);
            if (!target) {
                toast.error('Comment not found');
                return;
            }

            const targetComment = isReply ? target.reply : target;
            const effectiveParentId = isReply ? target.parentId : null;

            // Verify ownership
            if (targetComment.user.id !== user?.id) {
                toast.error('You can only delete your own comments');
                return;
            }

            // Delete the comment/reply using appropriate method
            if (isReply) {
                await commentService.deleteReply(effectiveParentId, commentId);
            } else {
                await commentService.deleteComment(commentId);
            }

            // Update state based on whether it's a reply or main comment
            setComments(prevComments => {
                if (!isReply) {
                    // If it's a parent comment, remove it completely
                    return prevComments.filter(c => c.id !== commentId);
                }
                
                // For replies, find the parent comment and remove only the specific reply
                return prevComments.map(comment => {
                    if (comment.id !== effectiveParentId) return comment;
                    
                    const updatedReplies = comment.replies.filter(reply => reply.id !== commentId);
                    return {
                        ...comment,
                        replies: updatedReplies,
                        reply_count: Math.max(0, comment.reply_count - 1)
                    };
                });
            });

            toast.success('Successfully deleted');
        } catch (error) {
            console.error('Delete error:', error.response?.data);
            toast.error(error.response?.data?.error || 'Failed to delete');
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

                            {/* Replies Section */}
                            {comment.replies?.map(reply => (
                                <Box key={reply.id} sx={{ ml: 4, mt: 1 }}>
                                    <Comment
                                    comment={reply}
                                    onLike={handleLikeComment}
                                    onDelete={(replyId) => handleDeleteComment(replyId, true)}
                                    currentUser={user}
                                    isReply={true}
                                    />
                             </Box>
                            ))}

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
