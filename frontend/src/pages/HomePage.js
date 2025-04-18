import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/auth';
import PostModal from '../components/PostModal'; // Import the modal component
import './HomePage.css';

function HomePage() {
  const [postContent, setPostContent] = useState('');
  const [posts, setPosts] = useState([]); // State to hold fetched posts
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true); // State for loading posts
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Fetch posts when component mounts
  useEffect(() => {
    loadPosts();
  }, []); // Empty dependency array means this runs once on mount

  // Function to load posts - separated for reuse
  const loadPosts = async () => {
    setIsLoadingPosts(true);
    setError(null);
    try {
      const fetchedPosts = await fetchWithAuth('http://localhost:3005/api/v1/posts');
      setPosts(fetchedPosts || []); // Handle null response if API returns nothing
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
      setIsSubmitting(false);
      return;
    }

    try {
      const newPost = await fetchWithAuth('http://localhost:3005/api/v1/posts', {
        method: 'POST',
        body: JSON.stringify({ post: { content: postContent } }),
      });

      console.log('Post created:', newPost);
      setPostContent(''); // Clear the input field
      // Add the new post to the beginning of the posts list
      setPosts(prevPosts => [newPost, ...prevPosts]);
      // alert('Post created successfully!'); // Remove alert, show post in table

    } catch (err) {
      console.error('Failed to create post:', err);
      setError(err.message || 'Failed to create post. Please try again.');
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
    setSelectedPost(null); // Clear selected post when closing
    
    // We don't need to refresh posts here anymore since we're updating in real-time
    // loadPosts();
  };
  
  // Handle post updates from the modal (for likes and comments)
  const handlePostUpdate = (updatedPost) => {
    setPosts(currentPosts => 
      currentPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      )
    );
    
    // Also update the selected post if it's the one being viewed
    if (selectedPost && selectedPost.id === updatedPost.id) {
      setSelectedPost(updatedPost);
    }
  };

  return (
    <div className="home-page">
      {/* --- Banner --- */}
      <div className="banner">
        {/* Optional: Add text over the banner */}
        {/* <h1>Welcome to Golf Buddies</h1> */}
      </div>
      {/* --- End Banner --- */}

      {/* Wrap content below banner */}
      <div className="content-area">
        {/* --- New Post Form --- */}
        <div className="create-post-form">
          <h2>Create New Post</h2>
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handlePostSubmit}>
            <div>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                cols={50}
                required
              />
            </div>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Posting...' : 'Create Post'}
            </button>
          </form>
        </div>
        {/* --- End New Post Form --- */}

        {/* --- Posts Table --- */}
        <div className="posts-section">
          <h2>Posts</h2>
          {isLoadingPosts ? (
            <p className="loading-message">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="no-posts-message">No posts yet. Be the first!</p>
          ) : (
            <table className="posts-table">
              <thead>
                <tr>
                  <th style={{width: '50%'}}>Content</th>
                  <th style={{width: '15%'}}>Author</th>
                  <th style={{width: '15%'}}>Created At</th>
                  <th style={{width: '10%'}}>Likes</th>
                  <th style={{width: '10%'}}>Comments</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  // Add onClick handler to the table row
                  <tr key={post.id} onClick={() => handleOpenModal(post)} style={{ cursor: 'pointer' }}>
                    <td>{post.content}</td>
                    {/* Ensure user object and names exist */}
                    <td>{post.user ? `${post.user.first_name} ${post.user.last_name}` : 'Unknown'}</td>
                    <td>{new Date(post.created_at).toLocaleString()}</td>
                    <td className="post-likes">
                      <span className="like-count">
                        <i className="fas fa-thumbs-up"></i> {post.like_count || 0}
                      </span>
                    </td>
                    <td className="post-comments">
                      <span className="comment-count">
                        <i className="fas fa-comment"></i> {post.comment_count || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* --- End Posts Table --- */}
      </div>

      {/* Render the Modal */}
      <PostModal
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        post={selectedPost}
        onPostUpdate={handlePostUpdate}
      />
    </div>
  );
}

export default HomePage;