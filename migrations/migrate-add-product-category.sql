-- Add product_category text column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_category VARCHAR(255) NULL AFTER product_category_id;