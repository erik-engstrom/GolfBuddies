class ApplicationController < ActionController::API
  # Include ActionController::HttpAuthentication::Token::ControllerMethods
  # This provides the authenticate_with_http_token method
  include ActionController::HttpAuthentication::Token::ControllerMethods

  before_action :authenticate_request

  attr_reader :current_user

  private

  def authenticate_request
    Rails.logger.debug "--- Authenticating request for: #{request.path} ---"
    
    # First check if Authorization header exists
    auth_header = request.headers['Authorization']
    if auth_header.blank?
      Rails.logger.warn "Authentication failed: No Authorization header"
      render json: { error: 'Authentication required' }, status: :unauthorized
      return false
    end
    
    # Extract the token from the Authorization header
    token = auth_header.split(' ').last if auth_header
    Rails.logger.debug "Token found: #{token.present?}"
    
    if token.blank?
      Rails.logger.warn "Authentication failed: Empty token"
      render json: { error: 'Authentication required' }, status: :unauthorized
      return false
    end
    
    begin
      # Decode the token
      Rails.logger.debug "Decoding token..."
      decoded = JsonWebToken.decode(token)
      
      if decoded.nil?
        Rails.logger.error "Authentication error: Failed to decode token"
        render json: { error: 'Invalid token' }, status: :unauthorized
        return false
      end
      
      # Find the user
      Rails.logger.debug "Finding user with ID: #{decoded[:user_id]}"
      @current_user = User.find(decoded[:user_id])
      Rails.logger.debug "User found: #{@current_user.email}"
      
      # Authentication successful
      Rails.logger.debug "--- Authentication finished for: #{request.path} ---"
      return true
      
    rescue ActiveRecord::RecordNotFound => e
      Rails.logger.error "Authentication error: User not found. Error: #{e.message}"
      render json: { error: 'User not found' }, status: :unauthorized
      return false
    rescue JWT::DecodeError => e
      Rails.logger.error "Authentication error: Invalid token. Error: #{e.message}"
      render json: { error: e.message }, status: :unauthorized
      return false
    rescue => e # Catch any other unexpected errors during authentication
      Rails.logger.error "Authentication error: Unexpected error. Error: #{e.class} - #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: 'Authentication failed' }, status: :unauthorized
      return false
    end
  end
end
