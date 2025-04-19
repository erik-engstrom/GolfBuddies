class CreateBuddyRequests < ActiveRecord::Migration[7.1]
  def change
    create_table :buddy_requests do |t|
      t.references :sender, null: false, foreign_key: { to_table: :users }
      t.references :receiver, null: false, foreign_key: { to_table: :users }
      t.string :status, default: 'pending'

      t.timestamps
    end

    # Add an index to make sure we don't have duplicate buddy requests
    add_index :buddy_requests, [:sender_id, :receiver_id], unique: true
  end
end
