require 'jwt'

module JsonWebToken
  SECRET_KEY = Rails.application.secret_key_base

  def self.encode(payload, exp = 24.hours.from_now)
    payload[:exp] = exp.to_i
    JWT.encode(payload, SECRET_KEY)
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY)[0]
    HashWithIndifferentAccess.new decoded
  rescue JWT::DecodeError => e
    # Log the error with more details
    Rails.logger.error "JWT Decode Error: #{e.message}"
    Rails.logger.error "Token: #{token.to_s[0..10]}..." if token
    nil
  rescue => e
    # Catch any other unexpected errors
    Rails.logger.error "Unexpected JWT Error: #{e.class} - #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    nil
  end
end
