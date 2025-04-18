class Api::V1::PostsController < ApplicationController
  before_action :authenticate_request, only: [:create, :index] # Ensure user is authenticated for index too

  # GET /api/v1/posts
  def index
    # Fetch posts, ordered by creation date (newest first)
    # Include associated user data and likes
    @posts = Post.includes(:user, :likes).order(created_at: :desc)
    
    # Create a custom response with profile picture URLs and like status
    posts_with_images = @posts.map do |post|
      post_data = post.as_json(include: { user: { only: [:id, :username, :first_name, :last_name] } })
      
      # Add profile picture URL if user and picture exist
      if post.user&.profile_picture&.attached?
        post_data[:user][:profile_picture_url] = url_for(post.user.profile_picture)
      end

      # Add like count and whether the current user liked this post
      post_data[:like_count] = post.likes.size # Use size for efficiency on loaded association
      post_data[:user_liked] = @current_user ? post.likes.any? { |like| like.user_id == @current_user.id } : false
      # Add comment count (assuming you might need this too)
      # post_data[:comment_count] = post.comments.size # Uncomment if needed and include :comments in includes
            
      post_data
    end
    
    render json: posts_with_images
  end

  # POST /api/v1/posts
  def create
    # Build the post associated with the currently logged-in user (@current_user is set by ApplicationController)
    @post = @current_user.posts.build(post_params)

    if @post.save
      # Create post response with user profile picture
      post_data = @post.as_json(include: { user: { only: [:id, :username, :first_name, :last_name] } })
      
      # Add profile picture URL if it exists
      if @post.user&.profile_picture&.attached?
        post_data[:user][:profile_picture_url] = url_for(@post.user.profile_picture)
      end
      # Initialize counts for the new post
      post_data[:like_count] = 0
      post_data[:user_liked] = false
      # post_data[:comment_count] = 0 # Uncomment if needed
      
      render json: post_data, status: :created
    else
      render json: { errors: @post.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def post_params
    # Permit only the 'content' parameter for creating posts
    params.require(:post).permit(:content)
  end
end
