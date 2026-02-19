<?php

/**
 * Branch Model
 * Handles all database operations for branches
 */

namespace Models;

use PDO;
use PDOException;

class Branch
{
    private PDO $db;
    private string $table = 'branches';

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Get all branches
     */
    public function getAll(): array
    {
        try {
            $query = "SELECT * FROM {$this->table} ORDER BY created_at DESC";
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new \Exception('Error fetching branches: ' . $e->getMessage());
        }
    }

    /**
     * Get branch by ID
     */
    public function getById(int $id): ?array
    {
        try {
            $query = "SELECT * FROM {$this->table} WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (PDOException $e) {
            throw new \Exception('Error fetching branch: ' . $e->getMessage());
        }
    }

    /**
     * Get branch by code
     */
    public function getByCode(string $code): ?array
    {
        try {
            $query = "SELECT * FROM {$this->table} WHERE branch_code = :code";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':code', $code, PDO::PARAM_STR);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (PDOException $e) {
            throw new \Exception('Error fetching branch: ' . $e->getMessage());
        }
    }

    /**
     * Create new branch
     */
    public function create(array $data): array
    {
        try {
            // Validate required fields
            $this->validateBranchData($data);

            // Check if branch code already exists
            if ($this->getByCode($data['branch_code'])) {
                throw new \Exception('Branch code already exists');
            }

            $query = "INSERT INTO {$this->table} 
                      (branch_code, branch_name, address, city, state, pincode, phone, email, is_active) 
                      VALUES 
                      (:branch_code, :branch_name, :address, :city, :state, :pincode, :phone, :email, :is_active)";

            $stmt = $this->db->prepare($query);

            // Bind parameters
            $stmt->bindParam(':branch_code', $data['branch_code'], PDO::PARAM_STR);
            $stmt->bindParam(':branch_name', $data['branch_name'], PDO::PARAM_STR);
            $stmt->bindParam(':address', $data['address'] ?? null, PDO::PARAM_STR);
            $stmt->bindParam(':city', $data['city'] ?? null, PDO::PARAM_STR);
            $stmt->bindParam(':state', $data['state'] ?? null, PDO::PARAM_STR);
            $stmt->bindParam(':pincode', $data['pincode'] ?? null, PDO::PARAM_STR);
            $stmt->bindParam(':phone', $data['phone'] ?? null, PDO::PARAM_STR);
            $stmt->bindParam(':email', $data['email'] ?? null, PDO::PARAM_STR);
            $stmt->bindParam(':is_active', $data['is_active'] ?? true, PDO::PARAM_BOOL);

            if ($stmt->execute()) {
                $id = $this->db->lastInsertId();
                return [
                    'success' => true,
                    'message' => 'Branch created successfully',
                    'id' => $id,
                    'data' => $this->getById((int)$id)
                ];
            }

            throw new \Exception('Failed to create branch');
        } catch (PDOException $e) {
            throw new \Exception('Database error: ' . $e->getMessage());
        }
    }

    /**
     * Update branch
     */
    public function update(int $id, array $data): array
    {
        try {
            // Check if branch exists
            $branch = $this->getById($id);
            if (!$branch) {
                throw new \Exception('Branch not found');
            }

            // Validate required fields
            $this->validateBranchData($data, true);

            // Check if new branch code already exists (if code is being changed)
            if (isset($data['branch_code']) && $data['branch_code'] !== $branch['branch_code']) {
                if ($this->getByCode($data['branch_code'])) {
                    throw new \Exception('Branch code already exists');
                }
            }

            $updateFields = [];
            $params = [':id' => $id];

            // Build dynamic update query
            foreach ($data as $key => $value) {
                if (in_array($key, ['branch_code', 'branch_name', 'address', 'city', 'state', 'pincode', 'phone', 'email', 'is_active'])) {
                    $updateFields[] = "$key = :$key";
                    $params[":$key"] = $value;
                }
            }

            if (empty($updateFields)) {
                throw new \Exception('No valid fields to update');
            }

            $query = "UPDATE {$this->table} SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = :id";
            $stmt = $this->db->prepare($query);

            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }

            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Branch updated successfully',
                    'data' => $this->getById($id)
                ];
            }

            throw new \Exception('Failed to update branch');
        } catch (PDOException $e) {
            throw new \Exception('Database error: ' . $e->getMessage());
        }
    }

    /**
     * Delete branch
     */
    public function delete(int $id): array
    {
        try {
            // Check if branch exists
            $branch = $this->getById($id);
            if (!$branch) {
                throw new \Exception('Branch not found');
            }

            // Check if branch has related records
            if ($this->hasRelatedRecords($id)) {
                throw new \Exception('Cannot delete branch with related records');
            }

            $query = "DELETE FROM {$this->table} WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);

            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Branch deleted successfully'
                ];
            }

            throw new \Exception('Failed to delete branch');
        } catch (PDOException $e) {
            throw new \Exception('Database error: ' . $e->getMessage());
        }
    }

    /**
     * Check if branch has related records
     */
    private function hasRelatedRecords(int $branchId): bool
    {
        $tables = ['users', 'drivers', 'vehicles', 'consignors', 'trip_sheets', 'inward_waybills', 'cash_book_entries'];

        foreach ($tables as $table) {
            $query = "SELECT COUNT(*) as count FROM $table WHERE branch_id = :branch_id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':branch_id', $branchId, PDO::PARAM_INT);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result['count'] > 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Validate branch data
     */
    private function validateBranchData(array $data, bool $isUpdate = false): void
    {
        if (!$isUpdate) {
            if (empty($data['branch_code'])) {
                throw new \Exception('Branch code is required');
            }
            if (empty($data['branch_name'])) {
                throw new \Exception('Branch name is required');
            }
        } else {
            if (isset($data['branch_code']) && empty($data['branch_code'])) {
                throw new \Exception('Branch code cannot be empty');
            }
            if (isset($data['branch_name']) && empty($data['branch_name'])) {
                throw new \Exception('Branch name cannot be empty');
            }
        }

        // Validate email if provided
        if (isset($data['email']) && !empty($data['email'])) {
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                throw new \Exception('Invalid email format');
            }
        }

        // Validate phone if provided
        if (isset($data['phone']) && !empty($data['phone'])) {
            if (!preg_match('/^[0-9\-\+\(\)\s]{7,20}$/', $data['phone'])) {
                throw new \Exception('Invalid phone format');
            }
        }
    }

    /**
     * Search branches
     */
    public function search(string $query): array
    {
        try {
            $searchQuery = "%{$query}%";
            $sql = "SELECT * FROM {$this->table} 
                    WHERE branch_code LIKE :query 
                    OR branch_name LIKE :query 
                    OR city LIKE :query 
                    OR state LIKE :query 
                    ORDER BY created_at DESC";

            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':query', $searchQuery, PDO::PARAM_STR);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new \Exception('Error searching branches: ' . $e->getMessage());
        }
    }

    /**
     * Get active branches only
     */
    public function getActive(): array
    {
        try {
            $query = "SELECT * FROM {$this->table} WHERE is_active = TRUE ORDER BY branch_name ASC";
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new \Exception('Error fetching active branches: ' . $e->getMessage());
        }
    }
}
