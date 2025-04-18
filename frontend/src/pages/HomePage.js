import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/auth';
import PostModal from '../components/PostModal'; // Import the modal component
import './HomePage.css';
// Import the banner image from the src/images directory
import bannerImage from '../images/golf-banner.jpg'; 

function HomePage() {
  const [postContent, setPostContent] = useState('');
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Define the style for the banner using the imported image
  const bannerStyle = {
    backgroundImage: `url(${bannerImage})`
  };

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
      // Sort posts by creation date, newest first
      const sortedPosts = (fetchedPosts || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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
                  <th>Content</th>
                  <th>Author</th>
                  <th>Date</th>
                  <th>Likes</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} onClick={() => handleOpenModal(post)} style={{ cursor: 'pointer' }}>
                    {/* Truncate long content in the table view */}
                    <td>{post.content.substring(0, 100)}{post.content.length > 100 ? '...' : ''}</td>
                    <td>{post.user?.username || 'Unknown'}</td>
                    <td>{new Date(post.created_at).toLocaleDateString()}</td>
                    <td className="post-likes">
                      <span className="like-count">
                        {/* Assuming you have Font Awesome or similar icons */}
                        <i className="fas fa-thumbs-up"></i> {post.likes_count || 0}
                      </span>
                    </td>
                    <td className="post-comments">
                       <span className="comment-count">
                         <i className="fas fa-comment"></i> {post.comments_count || 0}
                       </span>
                    </td>
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
          onClose={handleCloseModal}
          post={selectedPost}
          onPostUpdate={handlePostUpdate} // Pass update handler
          onPostDelete={loadPosts} // Reload posts if one is deleted
        />
      )}
    </div>
  );
}

export default HomePage;