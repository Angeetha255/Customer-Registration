-- Add new fields to business table
ALTER TABLE business ADD COLUMN IF NOT EXISTS numberOfEmployees INTEGER DEFAULT NULL;
ALTER TABLE business ADD COLUMN IF NOT EXISTS yearlyTurnover VARCHAR(255) DEFAULT NULL;