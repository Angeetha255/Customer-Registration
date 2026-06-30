-- Add verification fields to company table
ALTER TABLE company
  ADD COLUMN verify INT DEFAULT 0,
  ADD COLUMN trust INT DEFAULT 0,
  ADD COLUMN quick_response INT DEFAULT 0,
  ADD COLUMN top_rated INT DEFAULT 0;