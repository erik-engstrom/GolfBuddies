import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';

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
    <div className="login-container">
      <div className="golf-ball"></div>
      <div className="login-content">
        <div className="login-branding">
          <h1>GolfBuddies</h1>
          <p>Connect with golf enthusiasts, find playing partners, and share your golf journey with friends.</p>
        </div>
        <div className="login-form-container">
          <div className="login-header">
            <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
            <p>{isSignUp ? 'Join the GolfBuddies community' : 'Sign in to your account'}</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
              />
            </div>

            {/* Show additional fields only for Sign Up */}
            {isSignUp && (
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    className="form-control"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Your first name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    className="form-control"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Your last name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="handicap">Golf Handicap</label>
                  <input
                    type="number"
                    id="handicap"
                    className="form-control"
                    value={handicap}
                    onChange={(e) => setHandicap(e.target.value)}
                    placeholder="Your handicap"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="golfStyle">Golf Style</label>
                  <input
                    type="text"
                    id="golfStyle"
                    className="form-control"
                    value={golfStyle}
                    onChange={(e) => setGolfStyle(e.target.value)}
                    placeholder="Casual, Competitive, etc."
                    required
                  />
                </div>
              </div>
            )}

            <button type="submit" className="submit-button">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <button
            className="toggle-form"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Already have an account? Sign In' : 'New to GolfBuddies? Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
