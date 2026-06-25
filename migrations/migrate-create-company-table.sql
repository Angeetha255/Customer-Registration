-- Create company table
CREATE TABLE IF NOT EXISTS company (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  businessName VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  ownerName VARCHAR(255),
  website VARCHAR(255),
  description TEXT,
  yearOfEstablishment INT,
  gstNumber VARCHAR(255),
  yearlyTurnover VARCHAR(255),
  numberOfEmployees INT,
  createdBy INT UNSIGNED,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
