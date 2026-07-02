-- Add missing columns to reviews table if they don't exist
-- Run this if the reviews table was created before company_id/product_id were added

-- Add company_id column if missing
ALTER TABLE `reviews`
  ADD COLUMN IF NOT EXISTS `company_id` INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS `product_id` INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS `user_name` VARCHAR(120) NOT NULL DEFAULT '' AFTER `product_id`,
  ADD COLUMN IF NOT EXISTS `user_email` VARCHAR(255) NOT NULL DEFAULT '' AFTER `user_name`,
  ADD COLUMN IF NOT EXISTS `rating` TINYINT UNSIGNED NOT NULL DEFAULT 5 AFTER `user_email`,
  ADD COLUMN IF NOT EXISTS `comment` TEXT NOT NULL AFTER `rating`,
  ADD COLUMN IF NOT EXISTS `is_verified` TINYINT(1) NOT NULL DEFAULT 1 AFTER `comment`,
  ADD COLUMN IF NOT EXISTS `user_avatar` VARCHAR(500) NULL AFTER `is_verified`;
