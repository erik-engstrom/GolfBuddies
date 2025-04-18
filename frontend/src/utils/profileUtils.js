/* 
 * This file contains a utility function to get a profile picture with fallbacks
 * This ensures consistent handling of profile pictures across the application
 */

// Import default profile picture
import defaultProfilePic from '../images/default_pic.png';

// Fallback URL for when the imported image fails
const DEFAULT_PROFILE_PIC_URL = '/default_pic.png';

/**
 * Get profile picture URL with fallbacks
 * @param {Object} user The user object containing profile_picture_url
 * @returns {Object} An object with src and onError properties
 */
export const getProfilePicture = (user) => {
  // If user has a profile picture URL, use it
  if (user && user.profile_picture_url) {
    return {
      src: user.profile_picture_url,
      onError: (e) => {
        console.log("User profile image failed to load, using default");
        e.target.onerror = null; // Prevent infinite loop
        
        // Try the imported default image first
        e.target.src = defaultProfilePic;
        
        // If the imported default fails, use public URL
        e.target.onerror = (e2) => {
          console.log("Imported default image failed, using public URL");
          e2.target.onerror = null;
          e2.target.src = DEFAULT_PROFILE_PIC_URL;
        };
      }
    };
  }
  
  // If no user or no profile picture URL, use the imported default with fallback
  return {
    src: defaultProfilePic,
    onError: (e) => {
      console.log("Default profile image failed to load, using public URL");
      e.target.onerror = null;
      e.target.src = DEFAULT_PROFILE_PIC_URL;
    }
  };
};
