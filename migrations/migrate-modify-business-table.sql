-- Modify business table to keep only Business tab fields
-- Remove columns moved to company table
ALTER TABLE business DROP COLUMN IF EXISTS businessName;
ALTER TABLE business DROP COLUMN IF EXISTS email;
ALTER TABLE business DROP COLUMN IF EXISTS mobileNumber;
ALTER TABLE business DROP COLUMN IF EXISTS website;
ALTER TABLE business DROP COLUMN IF EXISTS description;
ALTER TABLE business DROP COLUMN IF EXISTS yearOfEstablishment;
ALTER TABLE business DROP COLUMN IF EXISTS mapLocation;
ALTER TABLE business DROP COLUMN IF EXISTS numberOfEmployees;
ALTER TABLE business DROP COLUMN IF EXISTS yearlyTurnover;

-- Rename mainCategory to category
ALTER TABLE business CHANGE COLUMN mainCategory category VARCHAR(255) NOT NULL;

-- Drop subCategory (not needed in Business tab)
ALTER TABLE business DROP COLUMN IF EXISTS subCategory;

-- Add companyId foreign key to link with company table
ALTER TABLE business ADD COLUMN companyId INT UNSIGNED;
ALTER TABLE business ADD FOREIGN KEY (companyId) REFERENCES company(id) ON DELETE SET NULL;
