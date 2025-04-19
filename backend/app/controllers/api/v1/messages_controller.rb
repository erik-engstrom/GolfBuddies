module Api
  module V1
    class MessagesController < ApplicationController
      before_action :authenticate_request

      def index
        # Get messages between current_user and another user
        other_user_id = params[:user_id]

        if other_user_id.blank?
          return render json: { error: "user_id parameter is required" }, status: :bad_request
        end

        # Use an array condition instead of a string condition for better SQL injection protection
        @messages = Message.where(
          ["(sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)",
          @current_user.id, other_user_id, other_user_id, @current_user.id]
        ).order(created_at: :asc)

        render json: @messages
      end

      def create
        @message = @current_user.sent_messages.new(message_params)

        if @message.save
          render json: @message, status: :created
        else
          render json: { errors: @message.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def conversations
        # Get list of users that current_user has exchanged messages with
        sent_to_ids = @current_user.sent_messages.pluck(:recipient_id).uniq
        received_from_ids = @current_user.received_messages.pluck(:sender_id).uniq

        # Combine and remove duplicates
        conversation_user_ids = (sent_to_ids + received_from_ids).uniq

        # Get the users with their latest message
        @conversations = []

        conversation_user_ids.each do |user_id|
          user = User.find(user_id)

          # Find the latest message between these users
          latest_message = Message.where(
            "(sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)",
            @current_user.id, user_id, user_id, @current_user.id
          ).order(created_at: :desc).first

          @conversations << {
            user: user.as_json(only: [:id, :username, :first_name, :last_name], methods: [:profile_picture_url]),
            latest_message: latest_message
          }
        end

        # Sort by latest message date
        @conversations = @conversations.sort_by { |conv| conv[:latest_message].created_at }.reverse

        render json: @conversations
      end

      private

      def message_params
        params.require(:message).permit(:content, :recipient_id)
      end
    end
  end
end
