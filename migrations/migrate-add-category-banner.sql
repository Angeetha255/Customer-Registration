-- Add banner image support to categories table
ALTER TABLE categories 
ADD COLUMN banner_image VARCHAR(500) NULL AFTER status;

-- Add index for better query performance
CREATE INDEX idx_categories_banner_image ON categories(banner_image);