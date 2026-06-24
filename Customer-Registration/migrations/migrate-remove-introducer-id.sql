-- ============================================================
-- Migration: Remove introducerId, migrate referredBy to INTEGER
-- Run this ONCE against your existing database before starting
-- the updated server.
-- ============================================================

-- Step 1: Create the settings table (if not already created by Sequelize sync)
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(255) NOT NULL,
  `value` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME DEFAULT NULL,
  `updatedAt` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Step 2: Seed default referral prefix
INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('referralPrefix', 'REF');

-- Step 3: Add a temporary column to store the resolved numeric referredBy
ALTER TABLE `users` ADD COLUMN `referredBy_new` INT UNSIGNED NULL;

-- Step 4: Populate referredBy_new by looking up the user whose introducerId
--         matches the current string referredBy value.
--         If referredBy was already stored as a numeric string (e.g. "1"),
--         this also handles it via direct cast.
UPDATE `users` u
JOIN `users` referrer ON referrer.`introducerId` = u.`referredBy`
SET u.`referredBy_new` = referrer.`id`
WHERE u.`referredBy` IS NOT NULL;

-- Step 5: For any remaining referredBy that is already a pure numeric value
--         (in case some records used the numeric id directly), convert those too.
UPDATE `users` u
SET u.`referredBy_new` = CAST(u.`referredBy` AS UNSIGNED)
WHERE u.`referredBy` IS NOT NULL
  AND u.`referredBy_new` IS NULL
  AND u.`referredBy` REGEXP '^[0-9]+$';

-- Step 6: Drop the old string referredBy column
ALTER TABLE `users` DROP COLUMN `referredBy`;

-- Step 7: Rename the new numeric column to referredBy
ALTER TABLE `users` CHANGE COLUMN `referredBy_new` `referredBy` INT UNSIGNED NULL;

-- Step 8: Drop the introducerId column (unique index must be dropped first)
ALTER TABLE `users` DROP INDEX `introducerId`;
ALTER TABLE `users` DROP COLUMN `introducerId`;

-- Step 9: Drop customerId if it still exists (it was commented out in model
--         but may exist in the database from earlier runs)
-- Uncomment the lines below only if the column exists in your database:
-- ALTER TABLE `users` DROP INDEX `customerId`;
-- ALTER TABLE `users` DROP COLUMN `customerId`;

-- Step 10: Drop the counters table (no longer needed)
-- DROP TABLE IF EXISTS `counters`;

-- ============================================================
-- Verification queries (run to confirm migration succeeded)
-- ============================================================
-- SELECT id, name, email, referredBy, referralCount FROM users LIMIT 20;
-- DESCRIBE users;
-- SELECT * FROM settings;
