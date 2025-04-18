class Api::V1::UsersController < ApplicationController
  include Rails.application.routes.url_helpers
  # Skip the authenticate_request before_action for the create action
  skip_before_action :authenticate_request, only: [:create]
  # Ensure authenticate_request runs for the 'me' action
  before_action :authenticate_request, only: [:me, :profile_picture]

  # GET /api/v1/users/me
  def me
    Rails.logger.debug "--- UsersController#me action started ---"
    # Temporarily assign a dummy user if authentication is skipped
    # @current_user ||= User.first # Or handle the nil case gracefully

    if @current_user # This will likely be nil now if before_action is commented out
      Rails.logger.debug "Current user found: #{@current_user.email}"
      
      # Create a user response object with profile picture URL if available
      user_data = @current_user.as_json(except: :password_digest)
      
      # Add profile picture URL if it exists
      if @current_user.profile_picture.attached?
        begin
          user_data[:profile_picture_url] = url_for(@current_user.profile_picture)
        rescue => url_error
          Rails.logger.error "Error generating URL for profile picture in me endpoint: #{url_error.message}"
          # Continue without the URL
        end
      end
      
      render json: user_data, status: :ok
    else
      Rails.logger.warn "UsersController#me: @current_user is nil. Authentication might be skipped or failed."
      # Render unauthorized if authentication was skipped/failed
      render json: { error: 'Not Authorized (me action)' }, status: :unauthorized
    end
    Rails.logger.debug "--- UsersController#me action finished ---"
  end

  def create
    @user = User.new(user_params)

    if @user.save
      # Generate JWT token
      token = JsonWebToken.encode(user_id: @user.id)
      render json: { token: token, user: @user.as_json(except: :password_digest) }, status: :created
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end
  
  # POST /api/v1/users/profile_picture
  def profile_picture
    Rails.logger.debug "--- UsersController#profile_picture action started ---"
    
    if params[:profile_picture].nil?
      Rails.logger.warn "Profile picture parameter missing"
      render json: { error: 'Profile picture is required' }, status: :bad_request
      return
    end
    
    begin
      # Remove any existing profile picture to avoid storing multiple copies
      @current_user.profile_picture.purge if @current_user.profile_picture.attached?
      
      # Attach the new profile picture
      @current_user.profile_picture.attach(params[:profile_picture])
      
      if @current_user.save
        # Make sure we have the URL helper available and handle potential errors gracefully
        profile_picture_url = nil
        if @current_user.profile_picture.attached?
          begin
            profile_picture_url = url_for(@current_user.profile_picture)
          rescue => url_error
            Rails.logger.error "Error generating URL for profile picture: #{url_error.message}"
            # Continue without the URL, at least the image is saved
          end
        end
        
        Rails.logger.debug "Profile picture uploaded successfully"
        render json: { 
          message: 'Profile picture uploaded successfully',
          profile_picture_url: profile_picture_url
        }, status: :ok
      else
        Rails.logger.error "Failed to save user after attaching profile picture: #{@current_user.errors.full_messages}"
        render json: { errors: @current_user.errors.full_messages }, status: :unprocessable_entity
      end
    rescue => e
      Rails.logger.error "Error uploading profile picture: #{e.message}\n#{e.backtrace.join("\n")}"
      render json: { error: 'Failed to process profile picture' }, status: :internal_server_error
    end
    
    Rails.logger.debug "--- UsersController#profile_picture action finished ---"
  end

  private

  def user_params
    # Permit email and password along with other details
    params.require(:user).permit(
      :first_name,
      :last_name,
      :email,
      :password,
      :handicap,
      :golf_style
    )
  end
end
