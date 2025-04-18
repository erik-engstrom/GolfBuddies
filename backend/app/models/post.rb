class Post < ApplicationRecord
  belongs_to :user

  has_many :comments, dependent: :destroy
  has_many :likes, as: :likeable, dependent: :destroy

  # Add validation for content presence
  validates :content, presence: true
  
  def like_count
    likes.count
  end
  
  # Check if a specific user has liked this post
  def liked_by?(user)
    likes.exists?(user_id: user.id)
  end
end
