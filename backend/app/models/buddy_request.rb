class BuddyRequest < ApplicationRecord
  belongs_to :sender, class_name: 'User'
  belongs_to :receiver, class_name: 'User'
  
  validates :status, inclusion: { in: ['pending', 'accepted', 'declined'] }
  validates :sender_id, uniqueness: { scope: :receiver_id, message: "already sent a buddy request to this user" }
  validate :not_self
  
  # Scopes for filtering buddy requests
  scope :pending, -> { where(status: 'pending') }
  scope :accepted, -> { where(status: 'accepted') }
  scope :declined, -> { where(status: 'declined') }
  
  # Accept the buddy request
  def accept
    update(status: 'accepted')
  end
  
  # Decline the buddy request
  def decline
    update(status: 'declined')
  end
  
  private
  
  # Prevent sending buddy requests to yourself
  def not_self
    if sender_id == receiver_id
      errors.add(:receiver_id, "can't be the same as sender")
    end
  end
end
