class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :post
  has_many :likes, as: :likeable, dependent: :destroy

  validates :content, presence: true, length: { minimum: 1 }
  
  def like_count
    likes.count
  end
  
  # Check if a specific user has liked this comment
  def liked_by?(user)
    likes.exists?(user_id: user.id)
  end
end
