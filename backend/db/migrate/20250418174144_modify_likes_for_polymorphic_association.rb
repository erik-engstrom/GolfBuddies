class ModifyLikesForPolymorphicAssociation < ActiveRecord::Migration[7.1]
  def change
    # First, remove the existing post_id foreign key
    remove_reference :likes, :post, foreign_key: true

    # Add polymorphic columns for likeable
    add_reference :likes, :likeable, polymorphic: true, index: true

    # Update the uniqueness constraint
    remove_index :likes, [:user_id, :post_id], if_exists: true
    add_index :likes, [:user_id, :likeable_type, :likeable_id], unique: true
  end
end
