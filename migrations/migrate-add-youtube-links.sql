-- Add youtube_links column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS youtube_links JSON NULL DEFAULT NULL;