-- Add missing columns to admins table
-- (Assuming columns name, email, password already exist)
-- role, is_active, phone_number, etc. already exist in migrations

-- Insert sample admins
INSERT INTO admins (name, email, password, branch_code, role, is_active, created_at, updated_at) VALUES
('naveen', 'naveen@transport.com', '$2y$12$5mDmukdPzGTh2m0p3yOpLOSJhlWLUoSKbZgCcZJXnjH578JeMCJyi', 'BR001', 'SUPERADMIN', 1, NOW(), NOW()),
('pradeep', 'pradeep@transport.com', '$2y$12$5mDmukdPzGTh2m0p3yOpLOSJhlWLUoSKbZgCcZJXnjH578JeMCJyi', 'BR001', 'SUPERADMIN', 1, NOW(), NOW()),
('ravi', 'ravi@transport.com', '$2y$12$5mDmukdPzGTh2m0p3yOpLOSJhlWLUoSKbZgCcZJXnjH578JeMCJyi', 'BR002', 'ADMIN', 1, NOW(), NOW()),
('john', 'john@transport.com', '$2y$12$5mDmukdPzGTh2m0p3yOpLOSJhlWLUoSKbZgCcZJXnjH578JeMCJyi', 'BR003', 'USER', 1, NOW(), NOW()),
('sarah', 'sarah@transport.com', '$2y$12$5mDmukdPzGTh2m0p3yOpLOSJhlWLUoSKbZgCcZJXnjH578JeMCJyi', 'BR004', 'USER', 0, NOW(), NOW());
