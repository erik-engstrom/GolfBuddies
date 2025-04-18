module Api
  module V1
    class CommentLikesController < ApplicationController
      before_action :authenticate_request
      before_action :set_comment

      # POST /api/v1/comments/:comment_id/likes
      def create
        Rails.logger.debug "--- CommentLikesController#create --- Comment: #{@comment.id}, User: #{@current_user.id}"
        # Prevent duplicate likes by the same user on the same comment
        @like = @comment.likes.find_by(user: @current_user)

        if @like
          Rails.logger.debug "User already liked this comment."
          render json: { message: 'You have already liked this comment.' }, status: :ok
        else
          @like = @comment.likes.build(user: @current_user)
          Rails.logger.debug "Attempting to save new comment like: #{@like.inspect}"
          begin
            if @like.save
              Rails.logger.debug "Comment like saved successfully."
              render json: @like, status: :created
            else
              Rails.logger.error "Comment like save failed: #{@like.errors.full_messages}"
              render json: { errors: @like.errors.full_messages }, status: :unprocessable_entity
            end
          rescue StandardError => e
            Rails.logger.error "ERROR saving comment like: #{e.message}\n#{e.backtrace.join("\n")}"
            render json: { error: 'Internal server error while liking comment.' }, status: :internal_server_error
          end
        end
      end

      # DELETE /api/v1/comments/:comment_id/likes
      def destroy
        Rails.logger.debug "--- CommentLikesController#destroy --- Comment: #{@comment.id}, User: #{@current_user.id}"
        @like = @comment.likes.find_by(user: @current_user)

        if @like
          # Ensure the like belongs to the current user
          if @like.user_id != @current_user.id
            Rails.logger.warn "Unauthorized attempt to unlike comment. Like user: #{@like.user_id}, Current user: #{@current_user.id}"
            render json: { error: 'You are not authorized to unlike this comment.' }, status: :forbidden
            return
          end
          
          Rails.logger.debug "Found comment like to destroy: #{@like.id}"
          begin
            @like.destroy
            Rails.logger.debug "Comment like destroyed successfully."
            render json: { message: 'Comment unliked successfully.' }, status: :ok
          rescue StandardError => e
            Rails.logger.error "ERROR destroying comment like: #{e.message}\n#{e.backtrace.join("\n")}"
            render json: { error: 'Internal server error while unliking comment.' }, status: :internal_server_error
          end
        else
          Rails.logger.debug "Comment like not found for user to destroy."
          render json: { error: 'You have not liked this comment.' }, status: :not_found
        end
      end

      # GET /api/v1/comments/:comment_id/like/status
      def status
        # Add check for current_user before accessing its id
        unless @current_user
          Rails.logger.error "--- CommentLikesController#status --- Current user not found!"
          render json: { error: 'User authentication failed.' }, status: :unauthorized
          return
        end

        Rails.logger.debug "--- CommentLikesController#status --- Comment: #{@comment.id}, User: #{@current_user.id}"
        like_count = @comment.likes.count
        user_liked = @comment.likes.exists?(user_id: @current_user.id)
        render json: { like_count: like_count, user_liked: user_liked }, status: :ok
      rescue StandardError => e
        Rails.logger.error "ERROR fetching comment like status: #{e.message}\n#{e.backtrace.join("\n")}"
        render json: { error: 'Internal server error while fetching comment like status.' }, status: :internal_server_error
      end

      private

      def set_comment
        @comment = Comment.find_by(id: params[:comment_id])
        render json: { error: 'Comment not found' }, status: :not_found unless @comment
      end
    end
  end
end
