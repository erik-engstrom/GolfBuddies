module Api
  module V1
    class CommentsController < ApplicationController
      before_action :authenticate_request, only: [:create] # Allow fetching comments without login?
      # If comments should be public, remove authenticate_request from index.
      # If comments require login, add :index to the only: array above.
      before_action :set_post

      # GET /api/v1/posts/:post_id/comments
      def index
        @comments = @post.comments.includes(:user).order(created_at: :asc) # Fetch comments, include user data, order oldest first
        
        # Create a custom response with profile picture URLs
        comments_with_images = @comments.map do |comment|
          comment_data = comment.as_json(include: { user: { only: [:id, :first_name, :last_name] } })
          
          # Add profile picture URL if it exists
          if comment.user.profile_picture.attached?
            comment_data['user']['profile_picture_url'] = rails_blob_url(comment.user.profile_picture)
          end
          
          comment_data
        end
        
        render json: comments_with_images
      end

      # POST /api/v1/posts/:post_id/comments
      def create
        @comment = @post.comments.build(comment_params)
        @comment.user = @current_user

        if @comment.save
          # Create comment response with user profile picture
          comment_data = @comment.as_json(include: { user: { only: [:id, :first_name, :last_name] } })
          
          # Add profile picture URL if it exists
          if @current_user.profile_picture.attached?
            comment_data['user']['profile_picture_url'] = rails_blob_url(@current_user.profile_picture)
          end
          
          render json: comment_data, status: :created
        else
          render json: { errors: @comment.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_post
        @post = Post.find_by(id: params[:post_id])
        render json: { error: 'Post not found' }, status: :not_found unless @post
      end

      def comment_params
        params.require(:comment).permit(:content)
      end
    end
  end
end
