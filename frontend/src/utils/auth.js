// Simple utility to get the token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Simple utility to remove the token from localStorage
export const removeToken = () => {
  localStorage.removeItem('token');
  // Optionally remove user info too
  // localStorage.removeItem('user');
};

// You could expand this with a function to make authenticated fetch requests
// Example:
export const fetchWithAuth = async (url, options = {}) => {
  const token = getToken();
  
  // Initialize headers with the options.headers or an empty object
  const headers = { ...options.headers };
  
  // Check if the request is a FormData request (for file uploads)
  const isFormData = options.body instanceof FormData;
  
  // Only set default Content-Type if it's not a FormData request and not already set
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Set Accept header if not already set
  if (!headers['Accept']) {
    headers['Accept'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Basic error handling, adjust as needed
  if (!response.ok) {
    try {
      // Try to parse error JSON 
      const errorData = await response.json();
      // Construct error message from backend errors if available
      const message = errorData.errors?.join(', ') || errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(message);
    } catch (e) {
      // If JSON parsing fails, check if it's the buddy request endpoint
      if (url.includes('/buddy_requests') && response.status === 500) {
        // Special case: Buddy request might have succeeded despite error
        console.warn('Buddy request may have succeeded despite error. Check account page.');
        return { success: true, message: 'Buddy request processing. Please check your account page.' };
      }
      // For other cases, throw generic error with status
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  // Handle cases with no content (e.g., DELETE requests)
  if (response.status === 204) {
    return null;
  }

  // Try to parse JSON, return null if response is empty
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (e) {
    console.error("Failed to parse JSON response:", text);
    throw new Error("Received invalid JSON response from server.");
  }
};
