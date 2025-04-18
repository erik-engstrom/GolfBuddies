# frozen_string_literal: true

module Types
  class PostType < Types::BaseObject
    field :id, ID, null: false
    field :content, String, null: false
    field :user, Types::UserType, null: false # The user who created the post
    field :author, Types::UserType, null: false, method: :user # Alias for user
    field :comments, [Types::CommentType], null: true
    field :likes, [Types::LikeType], null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false

    # Field for like count
    field :like_count, Integer, null: false
    def like_count
      object.likes.count
    end

    # Field for comment count
    field :comment_count, Integer, null: false
    def comment_count
      object.comments.count
    end
  end
end
