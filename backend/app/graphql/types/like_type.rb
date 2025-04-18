# frozen_string_literal: true

module Types
  class LikeType < Types::BaseObject
    field :id, ID, null: false
    field :user, Types::UserType, null: false # The user who liked the post
    field :liker, Types::UserType, null: false, method: :user # Alias for user
    field :post, Types::PostType, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
