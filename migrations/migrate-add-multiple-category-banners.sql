-- Migration: Add support for multiple category banner images
ALTER TABLE categories ADD COLUMN banner_images JSON NULL AFTER banner_image;