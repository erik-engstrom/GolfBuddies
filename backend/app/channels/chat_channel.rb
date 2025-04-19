class ChatChannel < ApplicationCable::Channel
  def subscribed
    # Format: chat_user1ID_user2ID (always ordered to ensure consistency)
    user_ids = [current_user.id, params[:recipient_id].to_i].sort
    stream_from "chat_#{user_ids[0]}_#{user_ids[1]}"
  end
class ChatChannel < ApplicationCable::Channel
  def subscribed
    # Format: chat_user1ID_user2ID (always sorted to ensure consistency)
    user_ids = [current_user.id, params[:recipient_id].to_i].sort
    stream_from "chat_#{user_ids[0]}_#{user_ids[1]}"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    stop_all_streams
  end

  def receive(data)
    # If we want to handle direct WebSocket messages
    # This is optional if we're doing API calls for messages
  end
end
  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    stop_all_streams
  end
end
