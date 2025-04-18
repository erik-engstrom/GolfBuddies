class User < ApplicationRecord
  has_many :comments, dependent: :destroy
  has_many :likes, dependent: :destroy
  has_many :posts, dependent: :destroy # Add has_many posts association

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
