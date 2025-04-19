import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import '../styles/AccountPage.css';

function AccountPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [buddyRequests, setBuddyRequests] = useState({ received: [], sent: [] });
  const [buddies, setBuddies] = useState([]);
  const [requestActionLoading, setRequestActionLoading] = useState(null);

  // Fetch user data, including profile picture URL
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await fetchWithAuth('/api/v1/users/me');
        setUserData(data);

        // If user has a profile picture, set it as the preview
        if (data.profile_picture_url) {
          setPreviewUrl(data.profile_picture_url);
        }

        // Fetch buddy requests
        const requestsData = await fetchWithAuth('/api/v1/buddy_requests');
        console.log('Buddy requests data:', requestsData);
        setBuddyRequests({
          received: requestsData.received_requests || [],
          sent: requestsData.sent_requests || []
        });

        // Fetch buddies list
        const buddiesData = await fetchWithAuth('/api/v1/buddies');
        setBuddies(buddiesData || []);

      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create a preview URL for the selected image
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  // Handle buddy request actions (accept/decline)
  const handleBuddyRequestAction = async (requestId, action) => {
    setRequestActionLoading(requestId);
    try {
      await fetchWithAuth(`/api/v1/buddy_requests/${requestId}/${action}`, {
        method: 'PATCH'
      });

      // Refresh buddy requests and buddies list after action
      const requestsData = await fetchWithAuth('/api/v1/buddy_requests');
      setBuddyRequests({
        received: requestsData.received_requests || [],
        sent: requestsData.sent_requests || []
      });

      // If action was 'accept', refresh buddies list
      if (action === 'accept') {
        const buddiesData = await fetchWithAuth('/api/v1/buddies');
        setBuddies(buddiesData || []);
      }
    } catch (error) {
      console.error(`Failed to ${action} buddy request:`, error);
    } finally {
      setRequestActionLoading(null);
    }
  };

  // Handle removing a buddy request
  const handleRemoveBuddyRequest = async (requestId) => {
    setRequestActionLoading(requestId);
    try {
      await fetchWithAuth(`/api/v1/buddy_requests/${requestId}`, {
        method: 'DELETE'
      });

      // Refresh buddy requests after removing
      const requestsData = await fetchWithAuth('/api/v1/buddy_requests');
      setBuddyRequests({
        received: requestsData.received_requests || [],
        sent: requestsData.sent_requests || []
      });
    } catch (error) {
      console.error('Failed to remove buddy request:', error);
    } finally {
      setRequestActionLoading(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setUploadMessage('Please select an image to upload');
      return;
    }

    setIsUploading(true);
    setUploadMessage('');

    try {
      // Create form data to send the file
      const formData = new FormData();
      formData.append('profile_picture', selectedFile);

      // Send the request to upload the profile picture
      await fetchWithAuth('http://localhost:3005/api/v1/users/profile_picture', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header when sending FormData
        headers: {}
      });

      // After successful upload, refresh user data to get the new profile picture URL
      const updatedData = await fetchWithAuth('/api/v1/users/me');
      setUserData(updatedData);

      // Update preview with the server URL if available
      if (updatedData.profile_picture_url) {
        setPreviewUrl(updatedData.profile_picture_url);
      }

      setUploadMessage('Profile picture uploaded successfully!');
      setSelectedFile(null); // Reset file selection
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setUploadMessage('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle navigation to a buddy's profile
  const navigateToBuddyProfile = (userId) => {
    navigate(`/users/${userId}`);
  };

  return (
    <div className="account-page">
      <h1>My Account</h1>

      {isLoading ? (
        <div className="loading">Loading your account information...</div>
      ) : (
        <>
          {userData && (
            <div className="user-info-section">
              <h2>Account Information</h2>
              <div className="user-details">
                <p><strong>Name:</strong> {userData.first_name} {userData.last_name}</p>
                <p><strong>Email:</strong> {userData.email}</p>
                {userData.handicap && <p><strong>Handicap:</strong> {userData.handicap}</p>}
                {userData.golf_style && <p><strong>Golf Style:</strong> {userData.golf_style}</p>}
              </div>
            </div>
          )}

          <div className="profile-picture-section">
            <h2>Profile Picture</h2>

            <div className="profile-picture-container">
              {previewUrl ? (
                <img src={previewUrl} alt="Profile preview" className="profile-preview" />
              ) : (
                <div className="profile-placeholder">
                  <span>No profile picture selected</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="upload-form">
              <div className="file-input-container">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  id="profile-picture-input"
                  className="file-input"
                />
                <label htmlFor="profile-picture-input" className="file-input-label">
                  Choose Image
                </label>
                <span className="file-name">
                  {selectedFile ? selectedFile.name : 'No file selected'}
                </span>
              </div>

              <button
                type="submit"
                className="upload-button"
                disabled={isUploading || !selectedFile}
              >
                {isUploading ? 'Uploading...' : 'Upload Profile Picture'}
              </button>

              {uploadMessage && (
                <div className={`upload-message ${uploadMessage.includes('success') ? 'success' : 'error'}`}>
                  {uploadMessage}
                </div>
              )}
            </form>
          </div>

          {/* Buddy Requests Section */}
          <div className="buddy-requests-section">
            <h2>Buddy Requests</h2>

            {/* Received Buddy Requests */}
            <div className="received-requests">
              <h3>Received Requests</h3>
              {buddyRequests.received.length === 0 ? (
                <p className="no-requests">No pending buddy requests.</p>
              ) : (
                <ul className="requests-list">
                  {buddyRequests.received.map(request => (
                    <li key={request.id} className="request-item">
                      <div className="request-user-info">
                        <img
                          src={request.user.profile_picture_url || "/default_pic.png"}
                          alt={`${request.user.first_name}'s profile`}
                          className="request-user-image"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/default_pic.png";
                          }}
                        />
                        <span className="request-user-name">
                          {request.user.first_name} {request.user.last_name}
                        </span>
                      </div>
                      <div className="request-actions">
                        <button
                          onClick={() => handleBuddyRequestAction(request.id, 'accept')}
                          className="accept-button"
                          disabled={requestActionLoading === request.id}
                        >
                          {requestActionLoading === request.id ? 'Processing...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleBuddyRequestAction(request.id, 'decline')}
                          className="decline-button"
                          disabled={requestActionLoading === request.id}
                        >
                          {requestActionLoading === request.id ? 'Processing...' : 'Decline'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Sent Buddy Requests */}
            <div className="sent-requests">
              <h3>Sent Requests</h3>
              {buddyRequests.sent.length === 0 ? (
                <p className="no-requests">No pending sent requests.</p>
              ) : (
                <ul className="requests-list">
                  {buddyRequests.sent.map(request => (
                    <li key={request.id} className="request-item">
                      <div className="request-user-info">
                        <img
                          src={request.user.profile_picture_url || "/default_pic.png"}
                          alt={`${request.user.first_name}'s profile`}
                          className="request-user-image"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/default_pic.png";
                          }}
                        />
                        <span className="request-user-name">
                          {request.user.first_name} {request.user.last_name}
                        </span>
                      </div>
                      <div className="request-actions">
                        <button
                          onClick={() => handleRemoveBuddyRequest(request.id)}
                          className="cancel-button"
                          disabled={requestActionLoading === request.id}
                        >
                          {requestActionLoading === request.id ? 'Processing...' : 'Cancel Request'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Buddies List Section */}
          <div className="buddies-section">
            <h2>My Buddies</h2>
            {buddies.length === 0 ? (
              <p className="no-buddies">You don't have any buddies yet.</p>
            ) : (
              <ul className="buddies-list">
                {buddies.map(buddy => (
                  <li 
                    key={buddy.id} 
                    className="buddy-item"
                    onClick={() => navigate(`/users/${buddy.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={buddy.profile_picture_url || "/default_pic.png"}
                      alt={`${buddy.first_name}'s profile`}
                      className="buddy-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/default_pic.png";
                      }}
                    />
                    <div className="buddy-info">
                      <span className="buddy-name">{buddy.first_name} {buddy.last_name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AccountPage;
