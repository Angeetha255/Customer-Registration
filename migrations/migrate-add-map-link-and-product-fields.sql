-- Add map_link column to company table
ALTER TABLE company ADD COLUMN IF NOT EXISTS map_link TEXT NULL AFTER pincode;

-- Add youtube_link column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS youtube_link VARCHAR(500) NULL AFTER descriptions;

-- Add product_category_id column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_category_id INT UNSIGNED NULL AFTER youtube_link;

-- Add index for product_category_id
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(product_category_id);