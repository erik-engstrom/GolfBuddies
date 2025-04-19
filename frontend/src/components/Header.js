import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { removeToken } from '../utils/auth'; // Correct the import path
import './Header.css'; // We'll create this file next

function Header({ isAuthenticated, onLogout }) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    removeToken();
    onLogout(); // Update App state
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-title">
        <Link to="/">Golf Buddies</Link>
      </div>
      <nav className="header-nav">
        {isAuthenticated ? (
          <>
            <Link to="/home">Home</Link>
            <Link to="/inbox" className="inbox-link">
              <i className="fas fa-envelope"></i>
              <span className="nav-text">Messages</span>
            </Link>
            <Link to="/account">My Account</Link>
            <button onClick={handleLogoutClick} className="logout-button">Logout</button>
          </>
        ) : (
          <>
            {/* Links for non-authenticated users, e.g., Login */}
            <Link to="/login">Login / Sign Up</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
