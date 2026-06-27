-- Add gallery column to products table if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery JSON;
