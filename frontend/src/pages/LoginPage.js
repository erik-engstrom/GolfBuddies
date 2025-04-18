import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Accept onLoginSuccess as a prop
function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState(''); // Add email state
  const [password, setPassword] = useState(''); // Add password state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [handicap, setHandicap] = useState('');
  const [golfStyle, setGolfStyle] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // State to toggle between Login and Sign Up
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    // Determine endpoint based on login or signup
    const endpoint = isSignUp ? '/api/v1/users' : '/api/v1/login';
    const url = `http://localhost:3005${endpoint}`;

    let userData = {
      user: {
        email: email,
        password: password,
      }
    };

    // Add extra details only for sign up
    if (isSignUp) {
      userData.user = {
        ...userData.user,
        first_name: firstName,
        last_name: lastName,
        handicap: parseInt(handicap, 10),
        golf_style: golfStyle,
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json(); // Always parse JSON response

      if (!response.ok) {
        throw new Error(data.errors?.join(', ') || data.error || `HTTP error! status: ${response.status}`);
      }

      console.log('Success:', data);

      if (data.token) {
        localStorage.setItem('token', data.token);
        // Call the callback function to update App state
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        // Handle cases where token might not be returned (shouldn't happen on success)
        throw new Error('Authentication token not received.');
      }

      // Redirect to home page AFTER updating state
      navigate('/home');

    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Failed to login/signup. Please try again.');
    }
  };

  return (
    <div>
      <h1>{isSignUp ? 'Sign Up' : 'Login'}</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Show additional fields only for Sign Up */}
        {isSignUp && (
          <>
            <div>
              <label htmlFor="firstName">First Name:</label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="lastName">Last Name:</label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="handicap">Golf Handicap:</label>
              <input
                type="number"
                id="handicap"
                value={handicap}
                onChange={(e) => setHandicap(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="golfStyle">Golf Style Interest:</label>
              <input
                type="text"
                id="golfStyle"
                value={golfStyle}
                onChange={(e) => setGolfStyle(e.target.value)}
                required
              />
            </div>
          </>
        )}

        <button type="submit">{isSignUp ? 'Sign Up' : 'Login'}</button>
      </form>
      <button onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
      </button>
    </div>
  );
}

export default LoginPage;
