-- Create consignors table
CREATE TABLE IF NOT EXISTS consignors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  tin_number VARCHAR(20) UNIQUE,
  gst_number VARCHAR(20) UNIQUE,
  branch_id BIGINT UNSIGNED NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_name (name),
  INDEX idx_code (code),
  INDEX idx_tin (tin_number),
  INDEX idx_gst (gst_number),
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- Insert sample consignor data
INSERT INTO consignors (name, code, tin_number, gst_number, branch_id, is_active, created_at, updated_at) VALUES
('ABC Logistics Pvt Ltd', 'ABC001', '12345678901', '18AABCU1234H1Z0', 1, 1, NOW(), NOW()),
('XYZ Transport Services', 'XYZ001', '98765432101', '18XYZTR5678H2Z0', 1, 1, NOW(), NOW()),
('Global Cargo Solutions', 'GLC001', '11111111111', '18GLCGO9999H3Z0', 1, 1, NOW(), NOW()),
('Swift Delivery Inc', 'SWD001', '22222222222', '18SWDEL1111H4Z0', 1, 1, NOW(), NOW()),
('Premium Freight Ltd', 'PRM001', '33333333333', '18PRMFR2222H5Z0', 1, 1, NOW(), NOW()),
('Express Logistics', 'EXP001', '44444444444', '18EXPLG3333H6Z0', 1, 1, NOW(), NOW()),
('National Transport Co', 'NTC001', '55555555555', '18NTCTR4444H7Z0', 1, 1, NOW(), NOW()),
('Metro Cargo Services', 'MCS001', '66666666666', '18MCSRV5555H8Z0', 1, 1, NOW(), NOW()),
('Rapid Delivery Systems', 'RDS001', '77777777777', '18RDSYS6666H9Z0', 1, 1, NOW(), NOW()),
('Elite Logistics Group', 'ELG001', '88888888888', '18ELGGRP7777H0Z0', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name), code=VALUES(code);
