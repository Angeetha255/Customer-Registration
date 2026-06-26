-- Add country_id column to states table
ALTER TABLE states 
ADD COLUMN country_id INT UNSIGNED DEFAULT NULL,
ADD CONSTRAINT fk_states_country 
FOREIGN KEY (country_id) 
REFERENCES countries(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_states_country_id ON states(country_id);