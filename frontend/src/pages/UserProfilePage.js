import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchWithAuth } from '../utils/auth';
import '../styles/UserProfilePage.css';

function UserProfilePage() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buddyRequestStatus, setBuddyRequestStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user details
        const userData = await fetchWithAuth(`/api/v1/users/${userId}`);
        setUser(userData);
        
        // Check buddy status
        const buddyStatusResponse = await fetchWithAuth(`/api/v1/users/${userId}/buddy_status`);
        setBuddyRequestStatus(buddyStatusResponse.status);
        
        // Fetch posts by this user
        const postsData = await fetchWithAuth(`/api/v1/users/${userId}/posts`);
        setPosts(postsData);
        
      } catch (err) {
        console.error('Error fetching user profile data:', err);
        setError(err.message || 'Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleSendBuddyRequest = async () => {
    try {
      setIsSubmitting(true);
      
      await fetchWithAuth(`/api/v1/users/${userId}/buddy_requests`, {
        method: 'POST',
      });
      
      // Update buddy request status to pending after sending
      setBuddyRequestStatus('pending_sent');
      
    } catch (err) {
      console.error('Failed to send buddy request:', err);
      setError(err.message || 'Failed to send buddy request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBuddyButton = () => {
    if (!buddyRequestStatus) return null;
    
    switch(buddyRequestStatus) {
      case 'none':
        return (
          <button 
            onClick={handleSendBuddyRequest} 
            disabled={isSubmitting}
            className="add-buddy-button"
          >
            {isSubmitting ? 'Sending...' : 'Add Buddy'}
          </button>
        );
      case 'pending_sent':
        return <div className="buddy-status pending">Buddy Request Sent</div>;
      case 'pending_received':
        return (
          <Link to="/account" className="respond-link">
            Respond to Buddy Request
          </Link>
        );
      case 'buddies':
        return (
          <div className="buddy-actions">
            <div className="buddy-status buddies">Buddies</div>
            <Link to={`/inbox?buddy=${userId}`} className="message-button">
              <i className="fas fa-envelope"></i> Message
            </Link>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!user) {
    return <div className="error-message">User not found</div>;
  }

  return (
    <div className="user-profile-page">
      <header className="profile-header">
        <div className="profile-image-container">
          <img 
            src={user.profile_picture_url || "/default_pic.png"} 
            alt={`${user.first_name}'s profile`} 
            className="profile-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/default_pic.png";
            }}
          />
        </div>
        <div className="profile-info">
          <h1>{user.first_name} {user.last_name}</h1>
          <p className="username">@{user.username}</p>
          {user.handicap && <p className="handicap">Handicap: {user.handicap}</p>}
          {user.golf_style && <p className="golf-style">Style: {user.golf_style}</p>}
          
          {/* Buddy request button/status */}
          {renderBuddyButton()}
        </div>
      </header>

      <section className="user-posts">
        <h2>Posts</h2>
        {posts.length === 0 ? (
          <p className="no-posts">No posts yet.</p>
        ) : (
          <ul className="posts-list">
            {posts.map(post => (
              <li key={post.id} className="post-item">
                <div className="post-content">
                  {post.content}
                </div>
                <div className="post-date">
                  Posted on {new Date(post.created_at).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default UserProfilePage;
