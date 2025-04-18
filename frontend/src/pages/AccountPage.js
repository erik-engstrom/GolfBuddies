import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/auth';
import '../styles/AccountPage.css';

function AccountPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
        </>
      )}
    </div>
  );
}

export default AccountPage;
