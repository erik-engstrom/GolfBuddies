class Api::V1::BuddyRequestsController < ApplicationController
  before_action :authenticate_request
  before_action :set_buddy_request, only: [:accept, :decline, :destroy]
  before_action :authorize_receiver, only: [:accept, :decline]  # GET /api/v1/buddy_requests
  # Returns all buddy requests related to the current user
  def index
    Rails.logger.debug "--- BuddyRequestsController#index started ---"
    Rails.logger.debug "Current user: #{@current_user.inspect}"
    
    # Log the SQL queries
    Rails.logger.debug "SQL for received requests: #{@current_user.received_buddy_requests.pending.to_sql}"
    
    # Get all received pending requests
    received_requests = @current_user.received_buddy_requests.pending.includes(:sender)
    Rails.logger.debug "Received requests count: #{received_requests.count}"
    Rails.logger.debug "Received requests: #{received_requests.map { |r| { id: r.id, sender_id: r.sender_id, status: r.status } }}"
    
    # Log the SQL queries
    Rails.logger.debug "SQL for sent requests: #{@current_user.sent_buddy_requests.pending.to_sql}"
    
    # Get all sent pending requests
    sent_requests = @current_user.sent_buddy_requests.pending.includes(:receiver)
    Rails.logger.debug "Sent requests count: #{sent_requests.count}"
    Rails.logger.debug "Sent requests: #{sent_requests.map { |r| { id: r.id, receiver_id: r.receiver_id, status: r.status } }}"
    
    # Format response with user data for each request
    received_data = received_requests.map do |request|
      format_buddy_request(request, is_receiver: true)
    end
    
    sent_data = sent_requests.map do |request|
      format_buddy_request(request, is_receiver: false)
    end
    
    # Return both received and sent requests
    response_data = {
      received_requests: received_data,
      sent_requests: sent_data
    }
    
    Rails.logger.debug "Response data: #{response_data.inspect}"
    Rails.logger.debug "--- BuddyRequestsController#index finished ---"
    
    render json: response_data
  end

  # POST /api/v1/users/:user_id/buddy_requests
  # Create a new buddy request to the specified user
  def create
    Rails.logger.debug "Starting buddy request creation for user_id: #{params[:user_id]}"

    receiver = User.find_by(id: params[:user_id])

    unless receiver
      Rails.logger.debug "Receiver not found with id: #{params[:user_id]}"
      return render json: { error: "User not found" }, status: :not_found
    end

    Rails.logger.debug "Receiver found: #{receiver.email}"

    # Check if the user is trying to add themselves
    if @current_user.id == receiver.id
      Rails.logger.debug "User trying to add themselves as buddy"
      return render json: { error: "You cannot add yourself as a buddy" }, status: :unprocessable_entity
    end

    # Check if users are already buddies
    if @current_user.is_buddy_with?(receiver)
      Rails.logger.debug "Users are already buddies"
      return render json: { error: "You are already buddies with this user" }, status: :unprocessable_entity
    end

    # Check if the current user already sent a pending request to this user
    existing_sent_request = BuddyRequest.find_by(sender: @current_user, receiver: receiver, status: 'pending')
    if existing_sent_request
      Rails.logger.debug "User already sent a pending request"
      return render json: { error: "You already sent a buddy request to this user" }, status: :unprocessable_entity
    end

    # Check if there's already a pending request from the receiver to the current user
    existing_received_request = BuddyRequest.find_by(sender: receiver, receiver: @current_user, status: 'pending')
    if existing_received_request
      # Auto-accept this request instead of creating a new one
      Rails.logger.debug "Found existing request from receiver, auto-accepting"
      existing_received_request.accept
      return render json: { message: "Buddy request from #{receiver.first_name} was automatically accepted" }, status: :ok
    end

    # Create the buddy request
    buddy_request = @current_user.sent_buddy_requests.build(receiver: receiver, status: 'pending')

    Rails.logger.debug "Attempting to save buddy request with status: #{buddy_request.status}"
    if buddy_request.save
      Rails.logger.debug "Buddy request saved successfully with ID: #{buddy_request.id}"
      Rails.logger.debug "Check: Is this request pending? #{buddy_request.status == 'pending'}"
      render json: format_buddy_request(buddy_request, is_receiver: false), status: :created
    else
      Rails.logger.debug "Failed to save buddy request: #{buddy_request.errors.full_messages.join(', ')}"
      render json: { errors: buddy_request.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/buddy_requests/:id/accept
  # Accept a received buddy request
  def accept
    if @buddy_request.accept
      render json: format_buddy_request(@buddy_request, is_receiver: true)
    else
      render json: { errors: @buddy_request.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/buddy_requests/:id/decline
  # Decline a received buddy request
  def decline
    if @buddy_request.decline
      render json: format_buddy_request(@buddy_request, is_receiver: true)
    else
      render json: { errors: @buddy_request.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/buddy_requests/:id
  # Cancel a sent buddy request or remove a received/declined one
  def destroy
    # Check if the current user is either the sender or receiver
    unless @buddy_request.sender_id == @current_user.id || @buddy_request.receiver_id == @current_user.id
      return render json: { error: "You are not authorized to perform this action" }, status: :forbidden
    end

    @buddy_request.destroy
    render json: { message: "Buddy request was removed" }, status: :ok
  end

  # GET /api/v1/buddies
  # List all accepted buddies of the current user
  def buddies
    buddies = @current_user.buddies

    # Format the response with user data
    buddies_data = buddies.map do |buddy|
      {
        id: buddy.id,
        email: buddy.email,
        first_name: buddy.first_name,
        last_name: buddy.last_name,
        profile_picture_url: buddy.profile_picture.attached? ? rails_blob_url(buddy.profile_picture) : nil
      }
    end

    render json: buddies_data
  end

  private

  def set_buddy_request
    @buddy_request = BuddyRequest.find_by(id: params[:id])

    unless @buddy_request
      render json: { error: "Buddy request not found" }, status: :not_found
      return false # Return false to halt the filter chain
    end
  end

  def authorize_receiver
    unless @buddy_request.receiver_id == @current_user.id
      render json: { error: "You are not authorized to perform this action" }, status: :forbidden
    end
  end

  def format_buddy_request(request, is_receiver:)
    user = is_receiver ? request.sender : request.receiver

    {
      id: request.id,
      status: request.status,
      created_at: request.created_at,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_picture_url: user.profile_picture.attached? ? rails_blob_url(user.profile_picture) : nil
      }
    }
  end
end
