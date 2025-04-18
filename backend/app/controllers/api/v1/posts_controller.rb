class Api::V1::PostsController < ApplicationController
  # GET /api/v1/posts
  def index
    # Fetch posts, ordered by creation date (newest first)
    # Include associated user data (select specific fields to avoid exposing sensitive info)
    @posts = Post.includes(:user).order(created_at: :desc)
    
    # Create a custom response with profile picture URLs
    posts_with_images = @posts.map do |post|
      post_data = post.as_json(include: { user: { only: [:id, :first_name, :last_name] } })
      
      # Add profile picture URL if it exists
      if post.user.profile_picture.attached?
        post_data['user']['profile_picture_url'] = rails_blob_url(post.user.profile_picture)
      end
      
      # Add like count
      post_data['like_count'] = post.likes.count
      
      # Add comment count
      post_data['comment_count'] = post.comments.count
      
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
      post_data = @post.as_json(include: { user: { only: [:id, :first_name, :last_name] } })
      
      # Add profile picture URL if it exists
      if @current_user.profile_picture.attached?
        post_data['user']['profile_picture_url'] = rails_blob_url(@current_user.profile_picture)
      end
      
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
