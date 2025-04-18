module Api
  module V1
    class LikesController < ApplicationController
      before_action :authenticate_request
      before_action :set_post

      # POST /api/v1/posts/:post_id/likes
      def create
        Rails.logger.debug "--- LikesController#create --- Post: #{@post.id}, User: #{@current_user.id}"
        # Prevent duplicate likes by the same user on the same post
        @like = @post.likes.find_by(user: @current_user)

        if @like
          Rails.logger.debug "User already liked this post."
          render json: { message: 'You have already liked this post.' }, status: :ok
        else
          @like = @post.likes.build(user: @current_user)
          Rails.logger.debug "Attempting to save new like: #{@like.inspect}"
          begin
            if @like.save
              Rails.logger.debug "Like saved successfully."
              render json: @like, status: :created
            else
              Rails.logger.error "Like save failed: #{@like.errors.full_messages}"
              render json: { errors: @like.errors.full_messages }, status: :unprocessable_entity
            end
          rescue StandardError => e
            Rails.logger.error "ERROR saving like: #{e.message}\n#{e.backtrace.join("\n")}"
            render json: { error: 'Internal server error while liking post.' }, status: :internal_server_error
          end
        end
      end

      # DELETE /api/v1/posts/:post_id/likes
      # Note: We don't need the like :id in the URL, we find it based on user and post
      def destroy
        Rails.logger.debug "--- LikesController#destroy --- Post: #{@post.id}, User: #{@current_user.id}"
        @like = @post.likes.find_by(user: @current_user)

        if @like
          # Ensure the like belongs to the current user
          if @like.user_id != @current_user.id
            Rails.logger.warn "Unauthorized attempt to unlike post. Like user: #{@like.user_id}, Current user: #{@current_user.id}"
            render json: { error: 'You are not authorized to unlike this post.' }, status: :forbidden
            return
          end

          Rails.logger.debug "Found like to destroy: #{@like.id}"
          begin
            @like.destroy
            Rails.logger.debug "Like destroyed successfully."
            render json: { message: 'Post unliked successfully.' }, status: :ok
          rescue StandardError => e
            Rails.logger.error "ERROR destroying like: #{e.message}\n#{e.backtrace.join("\n")}"
            render json: { error: 'Internal server error while unliking post.' }, status: :internal_server_error
          end
        else
          Rails.logger.debug "Like not found for user to destroy."
          render json: { error: 'You have not liked this post.' }, status: :not_found
        end
      end

      # GET /api/v1/posts/:post_id/like/status
      def status
        # Add check for current_user before accessing its id
        unless @current_user
          Rails.logger.error "--- LikesController#status --- Current user not found!"
          render json: { error: 'User authentication failed.' }, status: :unauthorized
          return
        end

        Rails.logger.debug "--- LikesController#status --- Post: #{@post.id}, User: #{@current_user.id}"
        like_count = @post.likes.count
        user_liked = @post.likes.exists?(user_id: @current_user.id)
        render json: { like_count: like_count, user_liked: user_liked }, status: :ok
      rescue StandardError => e
        Rails.logger.error "ERROR fetching like status: #{e.message}\n#{e.backtrace.join("\n")}"
        render json: { error: 'Internal server error while fetching like status.' }, status: :internal_server_error
      end

      private

      def set_post
        @post = Post.find_by(id: params[:post_id])
        render json: { error: 'Post not found' }, status: :not_found unless @post
      end
    end
  end
end
