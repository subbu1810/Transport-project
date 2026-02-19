# Transport Management System - Database Schema Documentation

## Overview
This document describes the complete database schema for the Transport Management System (TMS). The system manages waybills, trip sheets, payments, and various reports for a transport company with multiple branches.

---

## Table of Contents
1. [Authentication & User Management](#authentication--user-management)
2. [Master Data Tables](#master-data-tables)
3. [Consignor/Consignee Tables](#consignorconsignee-tables)
4. [Waybill Management](#waybill-management)
5. [Trip Sheet Management](#trip-sheet-management)
6. [Inward Waybill Management](#inward-waybill-management)
7. [E-Way Bill Management](#e-way-bill-management)
8. [Unload Report Management](#unload-report-management)
9. [ACK Report Management](#ack-report-management)
10. [Payment Management](#payment-management)
11. [Cash Book Management](#cash-book-management)
12. [Audit & Reporting](#audit--reporting)

---

## Authentication & User Management

### users
Stores user account information and authentication details.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique user identifier |
| username | VARCHAR(50) | UNIQUE, NOT NULL | Login username |
| password | VARCHAR(255) | NOT NULL | Encrypted password |
| email | VARCHAR(100) | UNIQUE | User email address |
| first_name | VARCHAR(100) | | User's first name |
| last_name | VARCHAR(100) | | User's last name |
| branch_id | INT | FK → branches | Assigned branch |
| role_id | INT | FK → roles | User's role |
| is_active | BOOLEAN | DEFAULT TRUE | Account status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

### branches
Stores branch/office location information.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique branch identifier |
| branch_code | VARCHAR(50) | UNIQUE, NOT NULL | Branch code (e.g., SINDHANUIR) |
| branch_name | VARCHAR(100) | NOT NULL | Full branch name |
| address | VARCHAR(255) | | Street address |
| city | VARCHAR(100) | | City name |
| state | VARCHAR(100) | | State/Province |
| pincode | VARCHAR(10) | | Postal code |
| phone | VARCHAR(20) | | Contact phone |
| email | VARCHAR(100) | | Contact email |
| is_active | BOOLEAN | DEFAULT TRUE | Branch status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

### roles
Stores role definitions for access control.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique role identifier |
| role_name | VARCHAR(50) | UNIQUE, NOT NULL | Role name (e.g., Admin, User) |
| description | VARCHAR(255) | | Role description |
| is_active | BOOLEAN | DEFAULT TRUE | Role status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

### role_assignments
Maps users to roles (many-to-many relationship).

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique assignment identifier |
| user_id | INT | FK → users, NOT NULL | User reference |
| role_id | INT | FK → roles, NOT NULL | Role reference |
| assigned_date | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Assignment date |

### screen_assignments
Defines screen/module access permissions for roles.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique assignment identifier |
| role_id | INT | FK → roles, NOT NULL | Role reference |
| screen_name | VARCHAR(100) | NOT NULL | Screen/module name |
| can_view | BOOLEAN | DEFAULT TRUE | View permission |
| can_create | BOOLEAN | DEFAULT FALSE | Create permission |
| can_edit | BOOLEAN | DEFAULT FALSE | Edit permission |
| can_delete | BOOLEAN | DEFAULT FALSE | Delete permission |
| assigned_date | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Assignment date |

---

## Master Data Tables

### drivers
Stores driver information and license details.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique driver identifier |
| driver_code | VARCHAR(50) | UNIQUE, NOT NULL | Driver code |
| driver_name | VARCHAR(100) | NOT NULL | Driver's full name |
| license_number | VARCHAR(50) | UNIQUE | Driving license number |
| license_expiry_date | DATE | | License expiry date |
| phone | VARCHAR(20) | | Contact phone |
| email | VARCHAR(100) | | Email address |
| address | VARCHAR(255) | | Residential address |
| branch_id | INT | FK → branches | Assigned branch |
| is_active | BOOLEAN | DEFAULT TRUE | Driver status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

### vehicles
Stores vehicle/fleet information.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique vehicle identifier |
| vehicle_number | VARCHAR(50) | UNIQUE, NOT NULL | Registration number |
| vehicle_type | VARCHAR(50) | | Type (e.g., Truck, Van) |
| registration_number | VARCHAR(50) | | Official registration |
| capacity_weight | DECIMAL(10,2) | | Weight capacity in kg |
| capacity_articles | INT | | Article capacity |
| owner_name | VARCHAR(100) | | Vehicle owner name |
| owner_phone | VARCHAR(20) | | Owner contact |
| insurance_expiry_date | DATE | | Insurance expiry |
| fitness_expiry_date | DATE | | Fitness certificate expiry |
| branch_id | INT | FK → branches | Assigned branch |
| is_active | BOOLEAN | DEFAULT TRUE | Vehicle status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

### bunks
Stores fuel/service center information.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique bunk identifier |
| bunk_code | VARCHAR(50) | UNIQUE, NOT NULL | Bunk code |
| bunk_name | VARCHAR(100) | NOT NULL | Bunk name |
| location | VARCHAR(255) | | Location address |
| phone | VARCHAR(20) | | Contact phone |
| email | VARCHAR(100) | | Email address |
| is_active | BOOLEAN | DEFAULT TRUE | Bunk status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

### transport_masters
Stores transport company information.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique transport identifier |
| transport_code | VARCHAR(50) | UNIQUE, NOT NULL | Transport code |
| transport_name | VARCHAR(100) | NOT NULL | Company name |
| contact_person | VARCHAR(100) | | Contact person name |
| phone | VARCHAR(20) | | Contact phone |
| email | VARCHAR(100) | | Email address |
| address | VARCHAR(255) | | Office address |
| is_active | BOOLEAN | DEFAULT TRUE | Status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

### account_heads
Stores accounting heads for cash book entries.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique head identifier |
| head_code | VARCHAR(50) | UNIQUE, NOT NULL | Head code |
| head_name | VARCHAR(100) | NOT NULL | Head name |
| head_type | ENUM | | Type: INCOME, EXPENSE, ASSET, LIABILITY |
| description | VARCHAR(255) | | Head description |
| is_active | BOOLEAN | DEFAULT TRUE | Head status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

---

## Consignor/Consignee Tables

### consignors
Stores customer/shipper information.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique consignor identifier |
| consignor_code | VARCHAR(50) | UNIQUE, NOT NULL | Customer code |
| consignor_name | VARCHAR(100) | NOT NULL | Customer name |
| contact_person | VARCHAR(100) | | Contact person |
| phone | VARCHAR(20) | | Phone number |
| email | VARCHAR(100) | | Email address |
| address | VARCHAR(255) | | Address |
| city | VARCHAR(100) | | City |
| state | VARCHAR(100) | | State |
| pincode | VARCHAR(10) | | Postal code |
| gst_number | VARCHAR(50) | | GST registration number |
| account_type | ENUM | | TOPAY, ACCOUNT, or PAID |
| credit_limit | DECIMAL(12,2) | | Credit limit amount |
| branch_id | INT | FK → branches | Associated branch |
| is_active | BOOLEAN | DEFAULT TRUE | Status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

### consignees
Stores receiver/recipient information.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique consignee identifier |
| consignee_code | VARCHAR(50) | UNIQUE, NOT NULL | Recipient code |
| consignee_name | VARCHAR(100) | NOT NULL | Recipient name |
| contact_person | VARCHAR(100) | | Contact person |
| phone | VARCHAR(20) | | Phone number |
| email | VARCHAR(100) | | Email address |
| address | VARCHAR(255) | | Address |
| city | VARCHAR(100) | | City |
| state | VARCHAR(100) | | State |
| pincode | VARCHAR(10) | | Postal code |
| is_active | BOOLEAN | DEFAULT TRUE | Status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

---

## Waybill Management

### waybills
Main waybill/GC (Goods Consignment) table.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique waybill identifier |
| gc_number | VARCHAR(50) | UNIQUE, NOT NULL | Goods Consignment number |
| gc_date | DATE | NOT NULL | GC creation date |
| consignor_id | INT | FK → consignors | Shipper reference |
| consignee_id | INT | FK → consignees | Receiver reference |
| origin_branch_id | INT | FK → branches | Origin branch |
| destination_branch_id | INT | FK → branches | Destination branch |
| destination_city | VARCHAR(100) | | Destination city |
| invoice_number | VARCHAR(50) | | Invoice number |
| invoice_date | DATE | | Invoice date |
| total_articles | INT | | Total number of articles |
| total_weight | DECIMAL(10,2) | | Total weight in kg |
| freight_type | ENUM | | TOPAY, ACCOUNT, or PAID |
| freight_amount | DECIMAL(12,2) | | Freight charges |
| dd_charges | DECIMAL(12,2) | | Door delivery charges |
| handling_charges | DECIMAL(12,2) | | Handling charges |
| stationary_charges | DECIMAL(12,2) | | Stationary charges |
| service_tax | DECIMAL(12,2) | | Service tax amount |
| total_amount | DECIMAL(12,2) | | Total amount |
| status | ENUM | | PENDING, DISPATCHED, DELIVERED, CANCELLED |
| deliver_status | ENUM | | PENDING, DELIVERED, RETURNED |
| amount_paid | DECIMAL(12,2) | | Amount paid |
| remarks | VARCHAR(255) | | Additional remarks |
| created_by | INT | FK → users | Created by user |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

### waybill_articles
Stores article details for each waybill.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique article identifier |
| waybill_id | INT | FK → waybills | Waybill reference |
| article_type | VARCHAR(100) | | Type of article |
| article_description | VARCHAR(255) | | Article description |
| no_of_articles | INT | | Number of articles |
| weight | DECIMAL(10,2) | | Weight in kg |
| rate | DECIMAL(10,2) | | Rate per unit |
| amount | DECIMAL(12,2) | | Total amount |

---

## Trip Sheet Management

### trip_sheets
Stores trip/journey information.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique trip identifier |
| trip_number | VARCHAR(50) | UNIQUE, NOT NULL | Trip number |
| trip_date | DATE | NOT NULL | Trip date |
| vehicle_id | INT | FK → vehicles | Vehicle reference |
| driver_id | INT | FK → drivers | Driver reference |
| owner_name | VARCHAR(100) | | Vehicle owner |
| dispatch_date | DATE | | Dispatch date |
| dispatch_branch_id | INT | FK → branches | Dispatch branch |
| destination_branch_id | INT | FK → branches | Destination branch |
| advance_amount | DECIMAL(12,2) | | Advance given |
| lr_number | VARCHAR(50) | | LR (Lorry Receipt) number |
| cr_number | VARCHAR(50) | | CR (Consignment Receipt) number |
| indent_number | VARCHAR(50) | | Indent number |
| trip_remarks | VARCHAR(255) | | Trip remarks |
| status | ENUM | | PENDING, DISPATCHED, DELIVERED, CANCELLED |
| ack_date | DATE | | Acknowledgement date |
| ack_remarks | VARCHAR(255) | | Acknowledgement remarks |
| created_by | INT | FK → users | Created by user |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

### trip_sheet_details
Maps waybills to trip sheets (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique detail identifier |
| trip_sheet_id | INT | FK → trip_sheets | Trip reference |
| waybill_id | INT | FK → waybills | Waybill reference |

---

## Inward Waybill Management

### inward_waybills
Stores inward/received waybill information.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique inward record identifier |
| gc_number | VARCHAR(50) | NOT NULL | Goods Consignment number |
| inward_date | DATE | NOT NULL | Inward/receipt date |
| inward_branch_id | INT | FK → branches | Receiving branch |
| total_articles | INT | | Total articles received |
| total_weight | DECIMAL(10,2) | | Total weight received |
| status | ENUM | | RECEIVED, PENDING, CANCELLED |
| remarks | VARCHAR(255) | | Inward remarks |
| received_by | INT | FK → users | Received by user |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

---

## E-Way Bill Management

### eway_bills
Stores GST E-Way Bill information.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique e-way bill identifier |
| eway_bill_number | VARCHAR(50) | UNIQUE, NOT NULL | E-Way Bill number |
| eway_bill_date | DATE | NOT NULL | E-Way Bill generation date |
| waybill_id | INT | FK → waybills | Associated waybill |
| consignor_gstin | VARCHAR(50) | | Consignor GST number |
| consignee_gstin | VARCHAR(50) | | Consignee GST number |
| vehicle_number | VARCHAR(50) | | Vehicle number |
| from_state | VARCHAR(100) | | Origin state |
| to_state | VARCHAR(100) | | Destination state |
| total_value | DECIMAL(12,2) | | Total invoice value |
| hsn_code | VARCHAR(50) | | HSN code |
| status | ENUM | | GENERATED, CANCELLED, EXPIRED |
| valid_upto | DATE | | Validity date |
| created_by | INT | FK → users | Created by user |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

---

## Unload Report Management

### unload_reports
Stores unloading report information.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique unload report identifier |
| unload_report_id | VARCHAR(50) | UNIQUE, NOT NULL | Unload report ID |
| trip_sheet_id | INT | FK → trip_sheets | Trip reference |
| unloading_date | DATE | NOT NULL | Unloading date |
| from_branch_id | INT | FK → branches | Unloading branch |
| total_articles | INT | | Total articles unloaded |
| total_weight | DECIMAL(10,2) | | Total weight unloaded |
| hamali_paid | DECIMAL(12,2) | | Hamali (loading) charges paid |
| remarks | VARCHAR(255) | | Remarks |
| vehicle_number | VARCHAR(50) | | Vehicle number |
| driver_name | VARCHAR(100) | | Driver name |
| trip_date | DATE | | Trip date |
| advance_amount | DECIMAL(12,2) | | Advance amount |
| unloaded_by | VARCHAR(100) | | Unloaded by person |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

---

## ACK Report Management

### ack_reports
Stores acknowledgement report headers.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique ACK report identifier |
| ack_report_id | VARCHAR(50) | UNIQUE, NOT NULL | ACK report ID |
| report_date | DATE | NOT NULL | Report generation date |
| from_date | DATE | | Report period from |
| to_date | DATE | | Report period to |
| branch_id | INT | FK → branches | Branch reference |
| total_pending_acks | INT | | Total pending ACKs |
| created_by | INT | FK → users | Created by user |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

### ack_report_details
Stores ACK report line items.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique detail identifier |
| ack_report_id | INT | FK → ack_reports | ACK report reference |
| waybill_id | INT | FK → waybills | Waybill reference |
| rpt_status | VARCHAR(50) | | Report status |
| deliver_status | VARCHAR(50) | | Delivery status |
| amount_paid | BOOLEAN | | Payment status |
| freight | DECIMAL(12,2) | | Freight amount |
| articles | INT | | Number of articles |
| weight | DECIMAL(10,2) | | Weight |
| dd_charges | DECIMAL(12,2) | | DD charges |
| handling | DECIMAL(12,2) | | Handling charges |
| stationary | DECIMAL(12,2) | | Stationary charges |
| service_tax | DECIMAL(12,2) | | Service tax |

---

## Payment Management

### payments
Stores payment transaction records.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique payment identifier |
| payment_id | VARCHAR(50) | UNIQUE, NOT NULL | Payment ID |
| payment_date | DATE | NOT NULL | Payment date |
| payment_type | ENUM | | GC_WISE or CONSIGNOR_WISE |
| waybill_id | INT | FK → waybills | Waybill reference |
| consignor_id | INT | FK → consignors | Consignor reference |
| outstanding_balance | DECIMAL(12,2) | | Outstanding balance |
| discount | DECIMAL(12,2) | | Discount given |
| paid_amount | DECIMAL(12,2) | | Amount paid |
| payer_name | VARCHAR(100) | | Payer name |
| mode_of_payment | ENUM | | CASH, CHEQUE, DD, BANK_TRANSFER |
| cheque_dd_number | VARCHAR(50) | | Cheque/DD number |
| cheque_dd_date | DATE | | Cheque/DD date |
| remarks | VARCHAR(255) | | Payment remarks |
| created_by | INT | FK → users | Created by user |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

---

## Cash Book Management

### cash_book_entries
Stores cash book transaction entries.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique entry identifier |
| entry_date | DATE | NOT NULL | Entry date |
| branch_id | INT | FK → branches | Branch reference |
| head_id | INT | FK → account_heads | Account head reference |
| transaction_type | ENUM | | DEBIT or CREDIT |
| amount | DECIMAL(12,2) | | Transaction amount |
| description | VARCHAR(255) | | Transaction description |
| reference_number | VARCHAR(50) | | Reference number |
| created_by | INT | FK → users | Created by user |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

---

## Audit & Reporting

### audit_logs
Stores audit trail for data changes.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique audit log identifier |
| gc_number | VARCHAR(50) | | Goods Consignment number |
| table_name | VARCHAR(100) | | Table name |
| record_id | INT | | Record ID |
| old_value | VARCHAR(500) | | Previous value |
| new_value | VARCHAR(500) | | New value |
| field_name | VARCHAR(100) | | Field name |
| changed_by | INT | FK → users | Changed by user |
| change_date | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Change timestamp |
| branch_id | INT | FK → branches | Branch reference |
| remarks | VARCHAR(255) | | Change remarks |

### consignor_history
Stores consignor transaction history summary.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique history record identifier |
| consignor_id | INT | FK → consignors | Consignor reference |
| from_date | DATE | | Period from date |
| to_date | DATE | | Period to date |
| total_booking | DECIMAL(12,2) | | Total booking amount |
| total_delivered | DECIMAL(12,2) | | Total delivered amount |
| total_pending | DECIMAL(12,2) | | Total pending amount |
| total_paid | DECIMAL(12,2) | | Total paid amount |
| total_topay | DECIMAL(12,2) | | Total TOPAY amount |
| total_account | DECIMAL(12,2) | | Total ACCOUNT amount |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |

### user_activity_history
Stores user activity summary.

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | INT | PRIMARY KEY | Unique activity record identifier |
| user_id | INT | FK → users | User reference |
| activity_type | VARCHAR(100) | | Type of activity |
| activity_date | DATE | | Activity date |
| total_bookings | INT | | Total bookings created |
| total_delivered | INT | | Total deliveries processed |
| total_pending | INT | | Total pending items |
| total_paid | DECIMAL(12,2) | | Total payment processed |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |

---

## Key Relationships

### One-to-Many Relationships
- Branch → Users
- Branch → Drivers
- Branch → Vehicles
- Branch → Consignors
- Branch → Trip Sheets
- Branch → Inward Waybills
- Branch → Cash Book Entries
- Consignor → Waybills
- Consignee → Waybills
- Vehicle → Trip Sheets
- Driver → Trip Sheets
- Waybill → Waybill Articles
- Waybill → E-Way Bills
- Trip Sheet → Trip Sheet Details
- Trip Sheet → Unload Reports
- ACK Report → ACK Report Details
- Account Head → Cash Book Entries
- Role → Screen Assignments
- Role → Role Assignments

### Many-to-Many Relationships
- Users ↔ Roles (via role_assignments)
- Trip Sheets ↔ Waybills (via trip_sheet_details)

---

## Indexes for Performance

The following indexes are created for optimal query performance:

- `idx_users_branch` - User lookups by branch
- `idx_users_role` - User lookups by role
- `idx_waybills_consignor` - Waybill lookups by consignor
- `idx_waybills_consignee` - Waybill lookups by consignee
- `idx_waybills_origin` - Waybill lookups by origin branch
- `idx_waybills_destination` - Waybill lookups by destination branch
- `idx_waybills_status` - Waybill lookups by status
- `idx_waybills_gc_number` - Waybill lookups by GC number
- `idx_waybills_gc_date` - Waybill lookups by date
- `idx_trip_sheets_vehicle` - Trip sheet lookups by vehicle
- `idx_trip_sheets_driver` - Trip sheet lookups by driver
- `idx_trip_sheets_trip_number` - Trip sheet lookups by trip number
- `idx_trip_sheets_trip_date` - Trip sheet lookups by date
- `idx_payments_waybill` - Payment lookups by waybill
- `idx_payments_consignor` - Payment lookups by consignor
- `idx_payments_payment_date` - Payment lookups by date
- `idx_payments_payment_type` - Payment lookups by type
- `idx_cash_book_head` - Cash book lookups by account head
- `idx_cash_book_entry_date` - Cash book lookups by date
- `idx_cash_book_branch_id` - Cash book lookups by branch
- `idx_eway_bills_waybill` - E-Way bill lookups by waybill
- `idx_eway_bills_eway_bill_number` - E-Way bill lookups by number
- `idx_inward_waybills_branch` - Inward waybill lookups by branch
- `idx_inward_waybills_gc_number` - Inward waybill lookups by GC number
- `idx_inward_waybills_inward_date` - Inward waybill lookups by date
- `idx_audit_logs_gc_number` - Audit log lookups by GC number
- `idx_audit_logs_change_date` - Audit log lookups by change date

---

## Data Types & Constraints

### Common Data Types Used
- **INT** - Integer values (IDs, counts)
- **VARCHAR(n)** - Variable-length strings
- **DECIMAL(12,2)** - Monetary values with 2 decimal places
- **DATE** - Date values (YYYY-MM-DD)
- **TIMESTAMP** - Date and time values
- **BOOLEAN** - True/False values
- **ENUM** - Predefined set of values

### Constraints Used
- **PRIMARY KEY** - Unique identifier for each row
- **UNIQUE** - Ensures uniqueness of values
- **NOT NULL** - Field must have a value
- **FOREIGN KEY** - References another table
- **DEFAULT** - Default value if not specified
- **AUTO_INCREMENT** - Automatically increment ID
- **ON DELETE CASCADE** - Delete child records when parent is deleted
- **ON UPDATE CURRENT_TIMESTAMP** - Auto-update timestamp on modification

---

## Sample Queries

### Get all waybills for a consignor
```sql
SELECT w.* FROM waybills w
WHERE w.consignor_id = ? 
ORDER BY w.gc_date DESC;
```

### Get payment summary for a consignor
```sql
SELECT 
  c.consignor_name,
  SUM(w.total_amount) as total_booking,
  SUM(p.paid_amount) as total_paid,
  SUM(w.total_amount) - SUM(p.paid_amount) as pending_balance
FROM consignors c
LEFT JOIN waybills w ON c.id = w.consignor_id
LEFT JOIN payments p ON w.id = p.waybill_id
WHERE c.id = ?
GROUP BY c.id;
```

### Get trip sheet with all waybills
```sql
SELECT 
  ts.*,
  w.gc_number,
  w.consignor_id,
  w.total_amount
FROM trip_sheets ts
LEFT JOIN trip_sheet_details tsd ON ts.id = tsd.trip_sheet_id
LEFT JOIN waybills w ON tsd.waybill_id = w.id
WHERE ts.trip_number = ?;
```

### Get cash book summary by head
```sql
SELECT 
  ah.head_name,
  SUM(CASE WHEN cbe.transaction_type = 'DEBIT' THEN cbe.amount ELSE 0 END) as debit,
  SUM(CASE WHEN cbe.transaction_type = 'CREDIT' THEN cbe.amount ELSE 0 END) as credit
FROM cash_book_entries cbe
JOIN account_heads ah ON cbe.head_id = ah.id
WHERE cbe.entry_date BETWEEN ? AND ?
  AND cbe.branch_id = ?
GROUP BY ah.id;
```

---

## Notes

1. All timestamps use UTC timezone
2. Passwords should be hashed using bcrypt or similar before storage
3. Sensitive data should be encrypted at rest
4. Regular backups are recommended
5. Archive old records periodically for performance
6. Consider partitioning large tables by date for better performance
