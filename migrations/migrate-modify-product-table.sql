-- Modify products table to link to company instead of business
-- Drop foreign key constraint for businessId
ALTER TABLE products DROP FOREIGN KEY IF EXISTS products_ibfk_1;

-- Drop businessId column
ALTER TABLE products DROP COLUMN IF EXISTS businessId;

-- Add companyId column
ALTER TABLE products ADD COLUMN companyId INT UNSIGNED;
ALTER TABLE products ADD FOREIGN KEY (companyId) REFERENCES company(id) ON DELETE CASCADE;
