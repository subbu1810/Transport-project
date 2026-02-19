-- Transport Management System Database Schema
-- Created: 2025-12-06

-- =====================================================
-- MASTER TABLES
-- =====================================================

-- Users and Authentication
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  branch_id INT,
  role_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Branches
CREATE TABLE branches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  branch_code VARCHAR(50) UNIQUE NOT NULL,
  branch_name VARCHAR(100) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Roles
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Role Assignments
CREATE TABLE role_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  UNIQUE KEY unique_user_role (user_id, role_id)
);

-- Screen Assignments
CREATE TABLE screen_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  screen_name VARCHAR(100) NOT NULL,
  can_view BOOLEAN DEFAULT TRUE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- =====================================================
-- MASTERS DATA TABLES
-- =====================================================

-- Driver Details
CREATE TABLE drivers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  driver_code VARCHAR(50) UNIQUE NOT NULL,
  driver_name VARCHAR(100) NOT NULL,
  license_number VARCHAR(50) UNIQUE,
  license_expiry_date DATE,
  phone VARCHAR(20),
  email VARCHAR(100),
  address VARCHAR(255),
  branch_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- Vehicle Details
CREATE TABLE vehicles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_type VARCHAR(50),
  registration_number VARCHAR(50),
  capacity_weight DECIMAL(10, 2),
  capacity_articles INT,
  owner_name VARCHAR(100),
  owner_phone VARCHAR(20),
  insurance_expiry_date DATE,
  fitness_expiry_date DATE,
  branch_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- Bunk Details (Fuel/Service Centers)
CREATE TABLE bunks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bunk_code VARCHAR(50) UNIQUE NOT NULL,
  bunk_name VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Transport Master
CREATE TABLE transport_masters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transport_code VARCHAR(50) UNIQUE NOT NULL,
  transport_name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Account Heads
CREATE TABLE account_heads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  head_code VARCHAR(50) UNIQUE NOT NULL,
  head_name VARCHAR(100) NOT NULL,
  head_type ENUM('INCOME', 'EXPENSE', 'ASSET', 'LIABILITY'),
  description VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- CONSIGNOR/CONSIGNEE TABLES
-- =====================================================

-- Consignors
CREATE TABLE consignors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  consignor_code VARCHAR(50) UNIQUE NOT NULL,
  consignor_name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  gst_number VARCHAR(50),
  account_type ENUM('TOPAY', 'ACCOUNT', 'PAID'),
  credit_limit DECIMAL(12, 2),
  branch_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- Consignees
CREATE TABLE consignees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  consignee_code VARCHAR(50) UNIQUE NOT NULL,
  consignee_name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- WAYBILL TABLES
-- =====================================================

-- Goods Consignment (GC) / Waybill
CREATE TABLE waybills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gc_number VARCHAR(50) UNIQUE NOT NULL,
  gc_date DATE NOT NULL,
  consignor_id INT NOT NULL,
  consignee_id INT NOT NULL,
  origin_branch_id INT NOT NULL,
  destination_branch_id INT,
  destination_city VARCHAR(100),
  invoice_number VARCHAR(50),
  invoice_date DATE,
  total_articles INT,
  total_weight DECIMAL(10, 2),
  freight_type ENUM('TOPAY', 'ACCOUNT', 'PAID'),
  freight_amount DECIMAL(12, 2),
  dd_charges DECIMAL(12, 2),
  handling_charges DECIMAL(12, 2),
  stationary_charges DECIMAL(12, 2),
  service_tax DECIMAL(12, 2),
  total_amount DECIMAL(12, 2),
  status ENUM('PENDING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'),
  deliver_status ENUM('PENDING', 'DELIVERED', 'RETURNED'),
  amount_paid DECIMAL(12, 2),
  remarks VARCHAR(255),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (consignor_id) REFERENCES consignors(id),
  FOREIGN KEY (consignee_id) REFERENCES consignees(id),
  FOREIGN KEY (origin_branch_id) REFERENCES branches(id),
  FOREIGN KEY (destination_branch_id) REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_gc_number (gc_number),
  INDEX idx_gc_date (gc_date),
  INDEX idx_status (status)
);

-- Waybill Articles
CREATE TABLE waybill_articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  waybill_id INT NOT NULL,
  article_type VARCHAR(100),
  article_description VARCHAR(255),
  no_of_articles INT,
  weight DECIMAL(10, 2),
  rate DECIMAL(10, 2),
  amount DECIMAL(12, 2),
  FOREIGN KEY (waybill_id) REFERENCES waybills(id) ON DELETE CASCADE
);

-- =====================================================
-- TRIP SHEET TABLES
-- =====================================================

-- Trip Sheets
CREATE TABLE trip_sheets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trip_number VARCHAR(50) UNIQUE NOT NULL,
  trip_date DATE NOT NULL,
  vehicle_id INT NOT NULL,
  driver_id INT NOT NULL,
  owner_name VARCHAR(100),
  dispatch_date DATE,
  dispatch_branch_id INT,
  destination_branch_id INT,
  advance_amount DECIMAL(12, 2),
  lr_number VARCHAR(50),
  cr_number VARCHAR(50),
  indent_number VARCHAR(50),
  trip_remarks VARCHAR(255),
  status ENUM('PENDING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'),
  ack_date DATE,
  ack_remarks VARCHAR(255),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  FOREIGN KEY (dispatch_branch_id) REFERENCES branches(id),
  FOREIGN KEY (destination_branch_id) REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_trip_number (trip_number),
  INDEX idx_trip_date (trip_date)
);

-- Trip Sheet Details (Waybills in a Trip)
CREATE TABLE trip_sheet_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trip_sheet_id INT NOT NULL,
  waybill_id INT NOT NULL,
  FOREIGN KEY (trip_sheet_id) REFERENCES trip_sheets(id) ON DELETE CASCADE,
  FOREIGN KEY (waybill_id) REFERENCES waybills(id),
  UNIQUE KEY unique_trip_waybill (trip_sheet_id, waybill_id)
);

-- =====================================================
-- INWARD WAYBILL TABLES
-- =====================================================

-- Inward Waybills
CREATE TABLE inward_waybills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gc_number VARCHAR(50) NOT NULL,
  inward_date DATE NOT NULL,
  inward_branch_id INT NOT NULL,
  total_articles INT,
  total_weight DECIMAL(10, 2),
  status ENUM('RECEIVED', 'PENDING', 'CANCELLED'),
  remarks VARCHAR(255),
  received_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (inward_branch_id) REFERENCES branches(id),
  FOREIGN KEY (received_by) REFERENCES users(id),
  INDEX idx_gc_number (gc_number),
  INDEX idx_inward_date (inward_date)
);

-- =====================================================
-- E-WAY BILL TABLES
-- =====================================================

-- E-Way Bills
CREATE TABLE eway_bills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  eway_bill_number VARCHAR(50) UNIQUE NOT NULL,
  eway_bill_date DATE NOT NULL,
  waybill_id INT NOT NULL,
  consignor_gstin VARCHAR(50),
  consignee_gstin VARCHAR(50),
  vehicle_number VARCHAR(50),
  from_state VARCHAR(100),
  to_state VARCHAR(100),
  total_value DECIMAL(12, 2),
  hsn_code VARCHAR(50),
  status ENUM('GENERATED', 'CANCELLED', 'EXPIRED'),
  valid_upto DATE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (waybill_id) REFERENCES waybills(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_eway_bill_number (eway_bill_number)
);

-- =====================================================
-- UNLOAD REPORT TABLES
-- =====================================================

-- Unload Reports
CREATE TABLE unload_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  unload_report_id VARCHAR(50) UNIQUE NOT NULL,
  trip_sheet_id INT NOT NULL,
  unloading_date DATE NOT NULL,
  from_branch_id INT NOT NULL,
  total_articles INT,
  total_weight DECIMAL(10, 2),
  hamali_paid DECIMAL(12, 2),
  remarks VARCHAR(255),
  vehicle_number VARCHAR(50),
  driver_name VARCHAR(100),
  trip_date DATE,
  advance_amount DECIMAL(12, 2),
  unloaded_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_sheet_id) REFERENCES trip_sheets(id),
  FOREIGN KEY (from_branch_id) REFERENCES branches(id),
  INDEX idx_unload_report_id (unload_report_id)
);

-- =====================================================
-- ACK REPORT TABLES
-- =====================================================

-- ACK Reports
CREATE TABLE ack_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ack_report_id VARCHAR(50) UNIQUE NOT NULL,
  report_date DATE NOT NULL,
  from_date DATE,
  to_date DATE,
  branch_id INT NOT NULL,
  total_pending_acks INT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_ack_report_id (ack_report_id)
);

-- ACK Report Details
CREATE TABLE ack_report_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ack_report_id INT NOT NULL,
  waybill_id INT NOT NULL,
  rpt_status VARCHAR(50),
  deliver_status VARCHAR(50),
  amount_paid BOOLEAN,
  freight DECIMAL(12, 2),
  articles INT,
  weight DECIMAL(10, 2),
  dd_charges DECIMAL(12, 2),
  handling DECIMAL(12, 2),
  stationary DECIMAL(12, 2),
  service_tax DECIMAL(12, 2),
  FOREIGN KEY (ack_report_id) REFERENCES ack_reports(id) ON DELETE CASCADE,
  FOREIGN KEY (waybill_id) REFERENCES waybills(id)
);

-- =====================================================
-- PAYMENT TABLES
-- =====================================================

-- Payments
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_id VARCHAR(50) UNIQUE NOT NULL,
  payment_date DATE NOT NULL,
  payment_type ENUM('GC_WISE', 'CONSIGNOR_WISE'),
  waybill_id INT,
  consignor_id INT,
  outstanding_balance DECIMAL(12, 2),
  discount DECIMAL(12, 2),
  paid_amount DECIMAL(12, 2),
  payer_name VARCHAR(100),
  mode_of_payment ENUM('CASH', 'CHEQUE', 'DD', 'BANK_TRANSFER'),
  cheque_dd_number VARCHAR(50),
  cheque_dd_date DATE,
  remarks VARCHAR(255),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (waybill_id) REFERENCES waybills(id),
  FOREIGN KEY (consignor_id) REFERENCES consignors(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_payment_date (payment_date),
  INDEX idx_payment_type (payment_type)
);

-- =====================================================
-- CASH BOOK TABLES
-- =====================================================

-- Cash Book Entries
CREATE TABLE cash_book_entries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entry_date DATE NOT NULL,
  branch_id INT NOT NULL,
  head_id INT NOT NULL,
  transaction_type ENUM('DEBIT', 'CREDIT'),
  amount DECIMAL(12, 2),
  description VARCHAR(255),
  reference_number VARCHAR(50),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (head_id) REFERENCES account_heads(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_entry_date (entry_date),
  INDEX idx_branch_id (branch_id)
);

-- =====================================================
-- AUDIT LOG TABLES
-- =====================================================

-- Audit Logs
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gc_number VARCHAR(50),
  table_name VARCHAR(100),
  record_id INT,
  old_value VARCHAR(500),
  new_value VARCHAR(500),
  field_name VARCHAR(100),
  changed_by INT,
  change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  branch_id INT,
  remarks VARCHAR(255),
  FOREIGN KEY (changed_by) REFERENCES users(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  INDEX idx_gc_number (gc_number),
  INDEX idx_change_date (change_date)
);

-- =====================================================
-- REPORT TABLES
-- =====================================================

-- Consignor History
CREATE TABLE consignor_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  consignor_id INT NOT NULL,
  from_date DATE,
  to_date DATE,
  total_booking DECIMAL(12, 2),
  total_delivered DECIMAL(12, 2),
  total_pending DECIMAL(12, 2),
  total_paid DECIMAL(12, 2),
  total_topay DECIMAL(12, 2),
  total_account DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consignor_id) REFERENCES consignors(id)
);

-- User Activity History
CREATE TABLE user_activity_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  activity_type VARCHAR(100),
  activity_date DATE,
  total_bookings INT,
  total_delivered INT,
  total_pending INT,
  total_paid DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_waybills_consignor ON waybills(consignor_id);
CREATE INDEX idx_waybills_consignee ON waybills(consignee_id);
CREATE INDEX idx_waybills_origin ON waybills(origin_branch_id);
CREATE INDEX idx_waybills_destination ON waybills(destination_branch_id);
CREATE INDEX idx_trip_sheets_vehicle ON trip_sheets(vehicle_id);
CREATE INDEX idx_trip_sheets_driver ON trip_sheets(driver_id);
CREATE INDEX idx_payments_waybill ON payments(waybill_id);
CREATE INDEX idx_payments_consignor ON payments(consignor_id);
CREATE INDEX idx_cash_book_head ON cash_book_entries(head_id);
CREATE INDEX idx_eway_bills_waybill ON eway_bills(waybill_id);
CREATE INDEX idx_inward_waybills_branch ON inward_waybills(inward_branch_id);
