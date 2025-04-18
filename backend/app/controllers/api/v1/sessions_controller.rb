class Api::V1::SessionsController < ApplicationController
  # Skip the authenticate_request before_action for the create action
  skip_before_action :authenticate_request, only: [:create]

  def create
    @user = User.find_by(email: params[:user][:email])

    if @user&.authenticate(params[:user][:password])
      token = JsonWebToken.encode(user_id: @user.id)
      render json: { token: token, user: @user.as_json(except: :password_digest) }, status: :ok
    else
      render json: { error: 'Invalid email or password' }, status: :unauthorized
    end
  end
end
