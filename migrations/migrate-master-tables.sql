-- Create master tables for dynamic dropdowns

-- States table
CREATE TABLE IF NOT EXISTS states (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  stateName VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('active', 'inactive') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Districts table
CREATE TABLE IF NOT EXISTS districts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  stateId INT UNSIGNED NOT NULL,
  districtName VARCHAR(100) NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (stateId) REFERENCES states(id) ON DELETE CASCADE
);

-- Areas table
CREATE TABLE IF NOT EXISTS areas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  districtId INT UNSIGNED NOT NULL,
  areaName VARCHAR(100) NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (districtId) REFERENCES districts(id) ON DELETE CASCADE
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  categoryName VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('active', 'inactive') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  categoryId INT UNSIGNED NOT NULL,
  subcategoryName VARCHAR(100) NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
);

-- Insert default Indian states
INSERT IGNORE INTO states (stateName) VALUES
('Andhra Pradesh'), ('Arunachal Pradesh'), ('Assam'), ('Bihar'), ('Chhattisgarh'),
('Goa'), ('Gujarat'), ('Haryana'), ('Himachal Pradesh'), ('Jharkhand'),
('Karnataka'), ('Kerala'), ('Madhya Pradesh'), ('Maharashtra'), ('Manipur'),
('Meghalaya'), ('Mizoram'), ('Nagaland'), ('Odisha'), ('Punjab'),
('Rajasthan'), ('Sikkim'), ('Tamil Nadu'), ('Telangana'), ('Tripura'),
('Uttar Pradesh'), ('Uttarakhand'), ('West Bengal'), ('Delhi'), ('Puducherry');

-- Insert default categories
INSERT IGNORE INTO categories (categoryName) VALUES
('Restaurants & Food'),
('Retail & Shopping'),
('Healthcare & Medical'),
('Education & Training'),
('Automotive'),
('Real Estate'),
('Professional Services'),
('Entertainment & Media'),
('Travel & Tourism'),
('Technology & IT'),
('Beauty & Wellness'),
('Home Services'),
('Sports & Fitness'),
('Financial Services'),
('Other');