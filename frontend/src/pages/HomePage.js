import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/auth';
import PostModal from '../components/PostModal';
import './HomePage.css';
import bannerImage from '../images/golf-banner.jpg';
import defaultProfilePic from '../images/default_pic.png';

function HomePage() {
  const [postContent, setPostContent] = useState('');
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // States for editing posts
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // State for delete confirmation
  const [deletingPostId, setDeletingPostId] = useState(null);

  // Define the style for the banner using the imported image
  const bannerStyle = {
    backgroundImage: `url(${bannerImage})`
  };

  // Fetch posts when component mounts
  useEffect(() => {
    loadPosts();
    fetchCurrentUser();
  }, []); // Empty dependency array means this runs once on mount

  // Function to fetch current user data
  const fetchCurrentUser = async () => {
    try {
      const userData = await fetchWithAuth('http://localhost:3005/api/v1/users/me');
      setCurrentUserId(userData.id);
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  };

  // Function to load posts - separated for reuse
  const loadPosts = async () => {
    setIsLoadingPosts(true);
    setError(null);
    try {
      const fetchedPosts = await fetchWithAuth('http://localhost:3005/api/v1/posts');
      // Sort posts by creation date, newest first
      const sortedPosts = (fetchedPosts || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Debug: Log posts to check profile picture URLs
      console.log('Loaded posts with profile pictures:',
        sortedPosts.map(post => ({
          id: post.id,
          user: post.user?.username || 'Unknown',
          hasProfilePic: !!post.user?.profile_picture_url,
          profilePicUrl: post.user?.profile_picture_url
        }))
      );

      setPosts(sortedPosts); // Handle null response and set sorted posts
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError(err.message || 'Failed to load posts.');
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handlePostSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!postContent.trim()) {
      setError('Post content cannot be empty.');
      setIsSubmitting(false); // Reset submitting state
      return; // Prevent submission
    }

    try {
      await fetchWithAuth('http://localhost:3005/api/v1/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: postContent }),
      });
      setPostContent(''); // Clear the textarea
      loadPosts(); // Reload posts to show the new one
    } catch (err) {
      console.error('Failed to create post:', err);
      setError(err.message || 'Failed to create post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenModal = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  // Handle post updates from the modal (for likes and comments)
  const handlePostUpdate = (updatedPost) => {
    // Find the index of the post to update
    const postIndex = posts.findIndex(p => p.id === updatedPost.id);
    if (postIndex !== -1) {
      // Create a new array with the updated post
      const newPosts = [...posts];
      newPosts[postIndex] = updatedPost;
      setPosts(newPosts);
    } else {
      // If the post wasn't found (edge case), reload all posts
      loadPosts();
    }
  };

  // --- Handle Like/Unlike directly from the list ---
  const handleLikeToggle = async (event, postId, currentUserLiked) => {
    event.stopPropagation(); // Prevent opening the modal

    const method = currentUserLiked ? 'DELETE' : 'POST';
    const url = `http://localhost:3005/api/v1/posts/${postId}/like`;

    // Optimistic UI update
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return; // Post not found

    const originalPost = posts[postIndex];
    const updatedPost = {
      ...originalPost,
      like_count: currentUserLiked ? (originalPost.like_count || 1) - 1 : (originalPost.like_count || 0) + 1,
      user_liked: !currentUserLiked
    };

    const newPosts = [...posts];
    newPosts[postIndex] = updatedPost;
    setPosts(newPosts); // Update state immediately

    try {
      console.log(`Toggling like for post ${postId}: ${method}`); // Add logging
      await fetchWithAuth(url, { method });
      console.log(`Successfully toggled like for post ${postId}`); // Add logging
      // API call successful, UI already updated
    } catch (err) {
      console.error('Failed to toggle like:', err); // Log the error
      // Revert optimistic update on error
      const revertedPosts = [...posts]; // Create a new array from the original state before the optimistic update
      revertedPosts[postIndex] = originalPost; // Put the original post back
      setPosts(revertedPosts);
      setError(err.message || 'Failed to update like status.');
    }
  };

  // --- Handle entering edit mode for a post ---
  const handleEditPost = (event, post) => {
    event.stopPropagation(); // Prevent opening the modal
    setEditingPostId(post.id);
    setEditPostContent(post.content);
  };

  // --- Handle canceling edit mode ---
  const handleCancelEdit = (event) => {
    event.stopPropagation(); // Prevent opening the modal
    setEditingPostId(null);
    setEditPostContent('');
  };

  // --- Handle updating a post ---
  const handleUpdatePost = async (event, postId) => {
    event.stopPropagation(); // Prevent opening the modal
    if (!editPostContent.trim()) {
      setError('Post content cannot be empty.');
      return;
    }

    setIsUpdating(true);

    try {
      const updatedPost = await fetchWithAuth(`http://localhost:3005/api/v1/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editPostContent }),
      });

      // Update the post in the local state
      const postIndex = posts.findIndex(p => p.id === postId);
      if (postIndex !== -1) {
        // Log to see what's in the updated post
        console.log('Original post:', posts[postIndex]);
        console.log('Updated post from server:', updatedPost);

        const newPosts = [...posts];
        // Merge the updated post with the existing one to keep all properties
        newPosts[postIndex] = {
          ...posts[postIndex],  // Keep all existing post properties
          content: updatedPost.content,  // Update the content
          updated_at: updatedPost.updated_at  // Update the timestamp
        };
        setPosts(newPosts);
      }

      // Exit edit mode
      setEditingPostId(null);
      setEditPostContent('');
    } catch (err) {
      console.error('Failed to update post:', err);
      setError(err.message || 'Failed to update post.');
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Handle deleting a post ---
  const handleDeletePost = async (event, postId) => {
    event.stopPropagation(); // Prevent opening the modal

    // Toggle delete confirmation instead of using window.confirm
    if (deletingPostId === postId) {
      // User has already clicked delete once, and clicked delete again to confirm
      try {
        await fetchWithAuth(`http://localhost:3005/api/v1/posts/${postId}`, {
          method: 'DELETE',
        });

        // Remove the post from the local state
        setPosts(posts.filter(p => p.id !== postId));
        setDeletingPostId(null); // Reset delete confirmation
      } catch (err) {
        console.error('Failed to delete post:', err);
        setError(err.message || 'Failed to delete post.');
        setDeletingPostId(null); // Reset delete confirmation on error
      }
    } else {
      // First click - show confirmation
      setDeletingPostId(postId);
    }
  };

  // --- Handle canceling delete confirmation ---
  const handleCancelDelete = (event) => {
    event.stopPropagation(); // Prevent opening the modal
    setDeletingPostId(null);
  };


  return (
    <div className="home-page">
      {/* Apply the banner style directly */}
      <div className="banner" style={bannerStyle}>
        <h1>Welcome to GolfBuddies</h1> {/* Example banner text */}
      </div>

      <div className="content-area">
        {/* Informative Section */}
        <section className="info-section">
          <h2>Connect with Fellow Golfers</h2>
          <p>
            Golf Buddies is your community hub for everything golf! Use this platform to:
          </p>
          <ul>
            <li>Find playing partners or invite friends for a round.</li>
            <li>Share and discover available tee times.</li>
            <li>Get the latest updates on course conditions.</li>
            <li>Buy or sell golf equipment and accessories.</li>
            <li>Promote and find upcoming golf events and tournaments.</li>
            <li>Discuss the latest golf news and share tips.</li>
          </ul>
          <p>
            Join the conversation, share your experiences, and enhance your golfing journey!
          </p>
        </section>

        {/* Create Post Form */}
        <section className="create-post-form">
          <h2>Create New Post</h2>
          <form onSubmit={handlePostSubmit}>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Share your latest round or golf thoughts..."
              rows="4"
              disabled={isSubmitting}
            />
            {error && <p className="error-message">{error}</p>}
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Posting...' : 'Create Post'}
            </button>
          </form>
        </section>

        {/* Posts Section */}
        <section className="posts-section">
          <h2>Recent Posts</h2>
          {isLoadingPosts ? (
            <p className="loading-message">Loading posts...</p>
          ) : posts.length > 0 ? (
            <table className="posts-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} onClick={() => handleOpenModal(post)} style={{ cursor: 'pointer' }}>
                    <td>
                      {/* Author Info - Display Full Name or Username */}
                      <div className="post-author-info">
                        {/* User thumbnail */}
                        <div className="user-thumbnail">
                          <img
                            src={post.user?.profile_picture_url || defaultProfilePic}
                            alt="User"
                            className="profile-thumbnail"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = defaultProfilePic;
                            }}
                          />
                        </div>
                        <strong>
                          {(post.user?.first_name && post.user?.last_name)
                            ? `${post.user.first_name} ${post.user.last_name}`
                            : (post.user?.username || 'Unknown')}
                        </strong>
                      </div>
                      {/* Post Content */}
                      {editingPostId === post.id ? (
                        <div className="post-edit-form" onClick={(e) => e.stopPropagation()}>
                          <textarea
                            value={editPostContent}
                            onChange={(e) => setEditPostContent(e.target.value)}
                            rows="4"
                          />
                          <div className="edit-buttons">
                            <button
                              type="button"
                              className="save-button"
                              onClick={(e) => handleUpdatePost(e, post.id)}
                              disabled={isUpdating}
                            >
                              {isUpdating ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              className="cancel-button"
                              onClick={(e) => handleCancelEdit(e)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="post-content-text">
                          {post.content.substring(0, 150)}{post.content.length > 150 ? '...' : ''}
                        </div>
                      )}
                      {/* Likes and Comments below content */}
                      <div className="post-interactions">
                        <span className={`like-count ${post.user_liked ? 'liked' : ''}`}
                        onClick={(e) => handleLikeToggle(e, post.id, post.user_liked)}>
                          <i className="fas fa-thumbs-up"></i> {post.like_count || 0}
                        </span>
                        <span className="comment-count">
                          <i className="fas fa-comment"></i> {post.comment_count || 0}
                        </span>

                        {/* Edit and Delete buttons - only show for post owner */}
                        {post.user?.id === currentUserId && (
                          <span className="post-owner-actions">
                            <button 
                              className="edit-button" 
                              onClick={(e) => handleEditPost(e, post)}
                              title="Edit post"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className="delete-button" 
                              onClick={(e) => handleDeletePost(e, post.id)}
                              title="Delete post"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </span>
                        )}
                      </div>

                      {/* Delete confirmation message */}
                      {deletingPostId === post.id && (
                        <div className="delete-confirmation" onClick={(e) => e.stopPropagation()}>
                          <p>Are you sure you want to delete this post?</p>
                          <div className="confirmation-buttons">
                            <button 
                              className="confirm-delete-button" 
                              onClick={(e) => handleDeletePost(e, post.id)}
                            >
                              Yes, Delete
                            </button>
                            <button 
                              className="cancel-delete-button" 
                              onClick={(e) => handleCancelDelete(e)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td>{new Date(post.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-posts-message">No posts yet. Be the first!</p>
          )}
        </section>
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <PostModal
          isOpen={isModalOpen}
          onRequestClose={handleCloseModal} // Correct prop name for react-modal
          post={selectedPost}
          onPostUpdate={handlePostUpdate} // Pass update handler
          onPostDelete={loadPosts} // Reload posts if one is deleted
        />
      )}
    </div>
  );
}

export default HomePage;