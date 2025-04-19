import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithAuth } from '../utils/auth';
import { useLocation } from 'react-router-dom';
import '../styles/InboxPage.css';

function InboxPage() {
  // Get location from React Router
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (buddyId) => {
    try {
      setMessagesLoading(true);

      // Fetch real messages from the server
      const messagesData = await fetchWithAuth(`/api/v1/messages?user_id=${buddyId}`);

      if (messagesData) {
        // Get current user ID from backend
        const userResponse = await fetchWithAuth('/api/v1/users/me');
        const currentUserId = userResponse?.id;

        // Mark messages as sent by me or received
        const processedMessages = messagesData.map(message => {
          // If the current user is the sender, mark with sender_id 'me' for UI purposes
          if (message.sender_id === currentUserId) {
            return { ...message, sender_id: 'me' };
          }
          return message;
        });

        setMessages(processedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages. Please try again.');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Fetch all conversations (buddies with messages)
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        // First try to get conversations from messages endpoint
        try {
          const conversationsData = await fetchWithAuth('/api/v1/messages/conversations');
          if (conversationsData && conversationsData.length > 0) {
            setConversations(conversationsData);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.log('No message conversations found, falling back to buddies list');
        }

        // Fallback to buddies list if no message conversations
        const buddiesData = await fetchWithAuth('/api/v1/buddies');
        setConversations(buddiesData || []);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setError('Failed to load your conversations. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Separate effect to handle URL parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const buddyId = queryParams.get('buddy');
    if (buddyId && conversations.length > 0) {
      // Find the buddy in the conversations list
      const buddy = conversations.find(b => b.id === parseInt(buddyId) || b.id === buddyId);
      if (buddy) {
        setSelectedConversation(buddy);
        fetchMessages(buddy.id);
      }
    }
  }, [location.search, conversations, fetchMessages]);

  // Handle selecting a conversation
  const handleSelectConversation = (buddy) => {
    // Set a flag in state to indicate this is a new conversation selection
    setSelectedConversation(buddy);
    setMessagesLoading(true); // Show loading state

    // Fetch messages for this conversation
    fetchMessages(buddy.id).then(() => {
      // After messages are loaded, force an immediate scroll to bottom
      if (messagesEndRef.current) {
        // Use setTimeout to ensure DOM is updated before scrolling
        setTimeout(() => {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }, 100);
      }
    });
  };

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageInput.trim() || !selectedConversation) return;

    try {
      // Send the message to the server first
      const response = await fetchWithAuth(`/api/v1/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message: {
            recipient_id: selectedConversation.id,
            content: messageInput
          }
        }),
      });

      // Add the saved message to the UI
      const savedMessage = {
        ...response,
        sender_id: 'me', // Keep the 'me' identifier for UI purposes
        timestamp: response.created_at // Use the server's timestamp
      };

      setMessages(prevMessages => [...prevMessages, savedMessage]);
      setMessageInput(''); // Clear input
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  // Remove the auto scroll on conversation selection since we're handling it directly in handleSelectConversation
  
  // Auto scroll for all message changes
  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages]);

  // Format timestamp to readable format
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';

    const messageDate = new Date(timestamp);
    const today = new Date();

    // Format time as h:MM AM/PM format
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const timeString = messageDate.toLocaleTimeString([], timeOptions);

    // Format date (always include date now)
    const dateOptions = { month: 'short', day: 'numeric' };

    // If from a different year, include the year
    if (messageDate.getFullYear() !== today.getFullYear()) {
      dateOptions.year = 'numeric';
    }

    // Always show date and time
    return `${messageDate.toLocaleDateString([], dateOptions)} ${timeString}`;
  };

  return (
    <div className="inbox-page">
      <h1>Messages</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="inbox-container">
        <div className="conversations-list">
          <h2>Conversations</h2>
          {isLoading ? (
            <div className="loading">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="no-conversations">
              <p>You don't have any conversations yet.</p>
              <p>Connect with golf buddies to start messaging!</p>
            </div>
          ) : (
            <ul>
              {conversations.map(buddy => (
                <li
                  key={buddy.id}
                  className={`conversation-item ${selectedConversation && selectedConversation.id === buddy.id ? 'selected' : ''}`}
                  onClick={() => handleSelectConversation(buddy)}
                >
                  <div className="conversation-avatar">
                    <img
                      src={buddy.profile_picture_url || "/default_pic.png"} 
                      alt={`${buddy.first_name}'s profile`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/default_pic.png";
                      }}
                    />
                  </div>
                  <div className="conversation-info">
                    <span className="conversation-name">{buddy.first_name} {buddy.last_name}</span>
                    <span className="conversation-preview">Click to view messages</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="messages-container">
          {selectedConversation ? (
            <>
              <div className="messages-header">
                <h2>
                  <img
                    src={selectedConversation.profile_picture_url || "/default_pic.png"} 
                    alt={`${selectedConversation.first_name}'s profile`}
                    className="selected-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/default_pic.png";
                    }}
                  />
                  {selectedConversation.first_name} {selectedConversation.last_name}
                </h2>
              </div>

              <div className="messages-list">
                {messagesLoading ? (
                  <div className="loading">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="no-messages">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <ul>
                    {messages.map(message => (
                      <li
                        key={message.id}
                        className={`message-item ${message.sender_id === 'me' ? 'sent' : 'received'}`}
                      >
                        <div className="message-content">{message.content}</div>
                        <div className="message-timestamp">{formatTimestamp(message.created_at || message.timestamp)}</div>
                      </li>
                    ))}
                    <div ref={messagesEndRef}></div>
                  </ul>
                )}
              </div>

              <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="message-input"
                />
                <button type="submit" className="send-button">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </>
          ) : (
            <div className="no-conversation-selected">
              <p>Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InboxPage;
