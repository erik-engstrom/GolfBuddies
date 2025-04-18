import React, { useState, useEffect, useCallback } from 'react'; // Add useEffect, useCallback
import Modal from 'react-modal';
import { fetchWithAuth } from '../utils/auth';
import './PostModal.css';

// Make sure to bind modal to your appElement (usually #root)
// You can do this once in your main App.js or index.js
// Modal.setAppElement('#root');

function PostModal({ isOpen, onRequestClose, post, onPostUpdate }) {
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState(null);

  const [likeCount, setLikeCount] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [isLoadingLikeStatus, setIsLoadingLikeStatus] = useState(false);
  const [likeStatusError, setLikeStatusError] = useState(null);

  const [isLiking, setIsLiking] = useState(false);
  const [likeError, setLikeError] = useState(null);
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentError, setCommentError] = useState(null);

  // --- Fetch Comments --- 
  const fetchComments = useCallback(async () => {
    if (!post) return;
    setIsLoadingComments(true);
    setCommentsError(null);
    try {
      const fetchedComments = await fetchWithAuth(`http://localhost:3005/api/v1/posts/${post.id}/comments`);
      setComments(fetchedComments || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setCommentsError(err.message || 'Could not load comments.');
    } finally {
      setIsLoadingComments(false);
    }
  }, [post]); // Dependency: post

  // --- Fetch Like Status --- 
  const fetchLikeStatus = useCallback(async () => {
    if (!post) return;
    setIsLoadingLikeStatus(true);
    setLikeStatusError(null);
    try {
      const status = await fetchWithAuth(`http://localhost:3005/api/v1/posts/${post.id}/like/status`);
      setLikeCount(status.like_count || 0);
      setUserLiked(status.user_liked || false);
    } catch (err) {
      console.error('Failed to fetch like status:', err);
      setLikeStatusError(err.message || 'Could not load like status.');
    } finally {
      setIsLoadingLikeStatus(false);
    }
  }, [post]); // Dependency: post

  // --- Fetch data when modal opens (post changes) --- 
  useEffect(() => {
    if (isOpen && post) {
      fetchComments();
      fetchLikeStatus();
    } else {
      // Reset state when modal closes or post is null
      setComments([]);
      setLikeCount(0);
      setUserLiked(false);
      setCommentsError(null);
      setLikeStatusError(null);
      setLikeError(null);
      setCommentError(null);
    }
  }, [isOpen, post, fetchComments, fetchLikeStatus]); // Dependencies

  // --- Handle Like/Unlike --- 
  const handleLikeToggle = async () => {
    if (isLiking || !post) return;
    setIsLiking(true);
    setLikeError(null);

    const method = userLiked ? 'DELETE' : 'POST';
    const url = `http://localhost:3005/api/v1/posts/${post.id}/like`;

    try {
      // Optimistic UI update
      const originalLiked = userLiked;
      const originalCount = likeCount;
      setUserLiked(!originalLiked);
      setLikeCount(originalLiked ? originalCount - 1 : originalCount + 1);

      await fetchWithAuth(url, { method });
      // No need to refetch status, UI is already updated
      
      // Update the post in parent component state
      if (onPostUpdate && post) {
        const updatedPost = { 
          ...post, 
          like_count: originalLiked ? (post.like_count || 0) - 1 : (post.like_count || 0) + 1 
        };
        onPostUpdate(updatedPost);
      }

    } catch (err) {
      console.error('Failed to toggle like:', err);
      setLikeError(err.message || 'Failed to update like status.');
      // Revert optimistic update on error
      setUserLiked(userLiked);
      setLikeCount(likeCount);
    } finally {
      setIsLiking(false);
    }
  };

  // --- Handle Comment Submit --- 
  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (isCommenting || !post) return;

    const commentInput = event.target.elements.comment;
    const commentText = commentInput.value.trim();

    if (!commentText) {
      setCommentError('Comment cannot be empty.');
      return;
    }

    setIsCommenting(true);
    setCommentError(null);

    try {
      const newComment = await fetchWithAuth(`http://localhost:3005/api/v1/posts/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment: { content: commentText } }),
      });
      // Add the new comment to the beginning of the list
      setComments(prevComments => [newComment, ...prevComments]);
      commentInput.value = ''; // Clear input
      
      // Update the post in parent component state
      if (onPostUpdate && post) {
        const updatedPost = { 
          ...post, 
          comment_count: (post.comment_count || 0) + 1 
        };
        onPostUpdate(updatedPost);
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
      setCommentError(err.message || 'Failed to post comment.');
    } finally {
      setIsCommenting(false);
    }
  };

  // --- Render --- 
  if (!post) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Post Details"
      className="modal-content"
      overlayClassName="modal-overlay"
      ariaHideApp={true} // Keep this for accessibility
    >
      <div className="modal-header">
        <h2>Post Details</h2>
        <button onClick={onRequestClose} className="close-button">&times;</button>
      </div>
      <div className="modal-body">
        <p className="post-author">By: {post.user ? `${post.user.first_name} ${post.user.last_name}` : 'Unknown'}</p>
        <p className="post-timestamp">{new Date(post.created_at).toLocaleString()}</p>
        <p className="post-content-full">{post.content}</p>
        <hr />
        {/* --- Like Section --- */}
        <div className="like-section">
          <button onClick={handleLikeToggle} className={`like-button ${userLiked ? 'liked' : ''}`} disabled={isLiking || isLoadingLikeStatus}>
            {isLiking ? '...' : (userLiked ? 'Unlike' : 'Like')}
          </button>
          <span className="like-count">
            {isLoadingLikeStatus ? 'Loading...' : `${likeCount} Like${likeCount !== 1 ? 's' : ''}`}
          </span>
          {likeError && <p className="error-message small">Error: {likeError}</p>}
          {likeStatusError && <p className="error-message small">Error loading status: {likeStatusError}</p>}
        </div>
        <hr />
        {/* --- Comment Section --- */}
        <div className="comment-section">
          <h3>Comments ({comments.length})</h3>
          {commentsError && <p className="error-message">Error loading comments: {commentsError}</p>}
          <div className="comment-list">
            {isLoadingComments ? (
              <p>Loading comments...</p>
            ) : comments.length === 0 ? (
              <p><i>No comments yet.</i></p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <p className="comment-author">
                    <strong>{comment.user ? `${comment.user.first_name} ${comment.user.last_name}` : 'Unknown'}:</strong>
                  </p>
                  <p className="comment-content">{comment.content}</p>
                  <p className="comment-timestamp">{new Date(comment.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea name="comment" placeholder="Add a comment..." required rows={3} disabled={isCommenting}></textarea>
            {commentError && <p className="error-message small">Error: {commentError}</p>}
            <button type="submit" disabled={isCommenting}>
              {isCommenting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
}

export default PostModal;
