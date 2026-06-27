-- Move fields from Business to Company
ALTER TABLE company 
  ADD COLUMN country VARCHAR(100) DEFAULT 'India' AFTER email,
  ADD COLUMN state VARCHAR(100) AFTER country,
  ADD COLUMN district VARCHAR(100) AFTER state,
  ADD COLUMN area VARCHAR(100) AFTER district,
  ADD COLUMN pincode VARCHAR(10) AFTER area;

-- Move fields from Company to Business
ALTER TABLE business 
  ADD COLUMN website VARCHAR(255) AFTER businessName,
  ADD COLUMN description TEXT AFTER website;

-- Remove old columns from Business
ALTER TABLE business 
  DROP COLUMN country,
  DROP COLUMN state,
  DROP COLUMN district,
  DROP COLUMN area,
  DROP COLUMN pincode;

-- Remove old columns from Company
ALTER TABLE company 
  DROP COLUMN website,
  DROP COLUMN description;

-- Add product pricing fields
ALTER TABLE products
  ADD COLUMN product_mrp DECIMAL(10, 2) AFTER productName,
  ADD COLUMN discount_percentage DECIMAL(5, 2) DEFAULT 0 AFTER product_mrp,
  ADD COLUMN discount_price DECIMAL(10, 2) AFTER discount_percentage,
  ADD COLUMN is_enabled BOOLEAN DEFAULT TRUE AFTER discount_price;

-- Create product specifications table
CREATE TABLE IF NOT EXISTS product_specifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  specification_name VARCHAR(255) NOT NULL,
  specification_detail TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create product descriptions table
CREATE TABLE IF NOT EXISTS product_descriptions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  description_point TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);