class User < ApplicationRecord
  has_many :comments, dependent: :destroy
  has_many :likes, dependent: :destroy
  has_many :posts, dependent: :destroy # Add has_many posts association

  # Buddy request associations
  has_many :sent_buddy_requests, class_name: 'BuddyRequest', foreign_key: 'sender_id', dependent: :destroy
  has_many :received_buddy_requests, class_name: 'BuddyRequest', foreign_key: 'receiver_id', dependent: :destroy
  
  # Add Active Storage attachment for profile picture
  has_one_attached :profile_picture

  # Add secure password functionality
  has_secure_password

  # Validations
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :first_name, presence: true
  validates :last_name, presence: true
  # Add password validation only on creation or when password changes
  validates :password, presence: true, length: { minimum: 6 }, if: -> { new_record? || !password.nil? }

  # Validate profile picture content type
  validate :acceptable_profile_picture, if: -> { profile_picture.attached? }
  
  # Helper methods for buddy relationships
  def buddy_requests_pending
    received_buddy_requests.where(status: 'pending')
  end
  
  def buddies
    # Get users where we have accepted buddy requests (either as sender or receiver)
    sent_buddies = User.joins(:received_buddy_requests)
                     .where(buddy_requests: { sender_id: self.id, status: 'accepted' })
    received_buddies = User.joins(:sent_buddy_requests)
                        .where(buddy_requests: { receiver_id: self.id, status: 'accepted' })
    
    # Combine both sets of buddies
    User.where(id: sent_buddies.pluck(:id) + received_buddies.pluck(:id))
  end
  
  def has_pending_request_from?(user)
    received_buddy_requests.pending.where(sender_id: user.id).exists?
  end
  
  def has_pending_request_to?(user)
    sent_buddy_requests.pending.where(receiver_id: user.id).exists?
  end
  
  def is_buddy_with?(user)
    buddies.where(id: user.id).exists?
  end

  private

  def acceptable_profile_picture
    # Check that the file is an image
    unless profile_picture.content_type.start_with?('image/')
      errors.add(:profile_picture, 'must be an image')
    end

    # Check file size is not too large (less than 5MB)
    if profile_picture.blob.byte_size > 5.megabytes
      errors.add(:profile_picture, 'is too large (max 5MB)')
    end
  end
end
