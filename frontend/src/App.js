import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AccountPage from './pages/AccountPage';
import UserProfilePage from './pages/UserProfilePage';
import InboxPage from './pages/InboxPage'; // Import InboxPage
import Header from './components/Header';
import { getToken } from './utils/auth';

// Simple ProtectedRoute component
function ProtectedRoute({ children }) {
  const token = getToken();
  return token ? children : <Navigate to="/login" replace />;
}


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  // const navigate = useNavigate(); // Removed as navigation is handled in Header

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Update auth state if token changes
  useEffect(() => {
    const checkAuth = () => setIsAuthenticated(!!getToken());
    checkAuth();
    // Using storage event listener can be complex, ensure it works as expected
    // or rely on component re-renders/navigation to check token status.
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []); // Only run on mount

  return (
    <div className="App">
      <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />

      <main className="main-content">
        <Routes>
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account" // Add route for AccountPage
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:userId" // Add route for viewing other user profiles
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inbox" // Add route for the inbox (direct messaging)
            element={
              <ProtectedRoute>
                <InboxPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            // Pass setIsAuthenticated directly to LoginPage to update state on successful login
            element={<LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />}
          />
          {/* Redirect root path based on auth status */}
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />}
          />
          {/* Add other public/protected routes here */}
          <Route path="*" element={<Navigate to="/" replace />} /> { /* Catch-all redirect */ }
        </Routes>
      </main>
    </div>
  );
}

export default App;