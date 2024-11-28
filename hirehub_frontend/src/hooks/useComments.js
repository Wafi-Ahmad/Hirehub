import { useState, useEffect, useCallback } from 'react';
import { commentService } from '../services/commentService';
import { toast } from 'react-toastify';

export const useComments = (postId) => {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentCursor, setCommentCursor] = useState(null);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [showComments, setShowComments] = useState(false);

  // Fetch comments
  const fetchComments = useCallback(async (cursor = null) => {
    try {
      setLoadingComments(true);
      const response = await commentService.getComments(postId, cursor);
      
      if (response.data?.comments) {
        setComments(prev => cursor ? [...prev, ...response.data.comments] : response.data.comments);
        setCommentCursor(response.data.next_cursor);
        setHasMoreComments(!!response.data.next_cursor);
      }
    } catch (error) {
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  }, [postId]);

  // Load initial comments when comments section is opened
  useEffect(() => {
    if (showComments && comments.length === 0) {
      fetchComments();
    }
  }, [showComments, comments.length, fetchComments]);

  // Add new comment
  const addComment = useCallback(async (content) => {
    try {
      const response = await commentService.createComment(postId, content);
      if (response?.data) {
        setComments(prev => [response.data, ...prev]);
        return response.data;
      }
    } catch (error) {
      toast.error('Failed to post comment');
      throw error;
    }
  }, [postId]);

  // Update comment (like/unlike)
  const updateComment = useCallback((commentId, updates) => {
    setComments(prevComments => 
      prevComments.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, ...updates };
        }
        if (comment.replies?.length > 0) {
          return {
            ...comment,
            replies: comment.replies.map(reply =>
              reply.id === commentId
                ? { ...reply, ...updates }
                : reply
            )
          };
        }
        return comment;
      })
    );
  }, []);

  // Delete comment
  const deleteComment = useCallback(async (commentId) => {
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
      
      return true;
    } catch (error) {
      toast.error('Failed to delete comment');
      throw error;
    }
  }, []);

  return {
    comments,
    loadingComments,
    hasMoreComments,
    showComments,
    setShowComments,
    fetchComments,
    addComment,
    updateComment,
    deleteComment,
    commentCursor
  };
}; 