Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"

  namespace :api do
    namespace :v1 do
      # Special user routes should come BEFORE the general users resource
      # Add a separate route for fetching the current user's data
      get '/users/me', to: 'users#me' 
      # Add route for profile picture upload
      post '/users/profile_picture', to: 'users#profile_picture'

      # Keep user creation public
      resources :users, only: [:create, :show] do
        # Nested route for creating buddy requests to a specific user
        resources :buddy_requests, only: [:create]
        # Get buddy status with a user
        get :buddy_status, on: :member
        # Get posts by a specific user
        get :posts, on: :member
      end

      # Buddy request routes
      resources :buddy_requests, only: [:index, :destroy] do
        member do
          patch :accept
          patch :decline
        end
      end
      # Get all buddies
      get '/buddies', to: 'buddy_requests#buddies'

      post '/login', to: 'sessions#create'

      resources :posts, only: [:index, :create, :update, :destroy] do
        resource :like, only: [:create, :destroy] do
          get :status, on: :collection
        end
        resources :comments, only: [:index, :create]
      end

      # Add routes for comment likes
      # Message routes
      resources :messages, only: [:index, :show, :create] do
        # Add a custom route to get conversations
        collection do
          get :conversations
        end
      end
      
      resources :comments, only: [] do
        resource :like, only: [:create, :destroy], controller: 'comment_likes' do
          get :status, on: :collection
        end
      end
    end
  end

  # Route GraphQL requests
  post "/graphql", to: "graphql#execute"
end
