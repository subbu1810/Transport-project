<?php

/**
 * Branch Controller
 * Handles HTTP requests for branch operations
 */

namespace Controllers;

use Models\Branch;
use PDO;

class BranchController
{
    private Branch $branchModel;
    private int $statusCode = 200;
    private array $response = [];

    public function __construct(PDO $db)
    {
        $this->branchModel = new Branch($db);
    }

    /**
     * Get all branches
     */
    public function getAll(): void
    {
        try {
            $branches = $this->branchModel->getAll();
            $this->sendResponse(true, 'Branches retrieved successfully', $branches, 200);
        } catch (\Exception $e) {
            $this->sendResponse(false, $e->getMessage(), null, 500);
        }
    }

    /**
     * Get branch by ID
     */
    public function getById(int $id): void
    {
        try {
            $branch = $this->branchModel->getById($id);
            
            if (!$branch) {
                $this->sendResponse(false, 'Branch not found', null, 404);
                return;
            }

            $this->sendResponse(true, 'Branch retrieved successfully', $branch, 200);
        } catch (\Exception $e) {
            $this->sendResponse(false, $e->getMessage(), null, 500);
        }
    }

    /**
     * Create new branch
     */
    public function create(): void
    {
        try {
            // Get JSON input
            $input = $this->getJsonInput();

            if (empty($input)) {
                $this->sendResponse(false, 'Invalid input', null, 400);
                return;
            }

            // Create branch
            $result = $this->branchModel->create($input);
            $this->sendResponse(true, $result['message'], $result['data'], 201);
        } catch (\Exception $e) {
            $this->sendResponse(false, $e->getMessage(), null, 400);
        }
    }

    /**
     * Update branch
     */
    public function update(int $id): void
    {
        try {
            // Get JSON input
            $input = $this->getJsonInput();

            if (empty($input)) {
                $this->sendResponse(false, 'Invalid input', null, 400);
                return;
            }

            // Update branch
            $result = $this->branchModel->update($id, $input);
            $this->sendResponse(true, $result['message'], $result['data'], 200);
        } catch (\Exception $e) {
            $this->sendResponse(false, $e->getMessage(), null, 400);
        }
    }

    /**
     * Delete branch
     */
    public function delete(int $id): void
    {
        try {
            $result = $this->branchModel->delete($id);
            $this->sendResponse(true, $result['message'], null, 200);
        } catch (\Exception $e) {
            $this->sendResponse(false, $e->getMessage(), null, 400);
        }
    }

    /**
     * Search branches
     */
    public function search(): void
    {
        try {
            $query = $_GET['q'] ?? '';

            if (empty($query)) {
                $this->sendResponse(false, 'Search query is required', null, 400);
                return;
            }

            $branches = $this->branchModel->search($query);
            $this->sendResponse(true, 'Search results', $branches, 200);
        } catch (\Exception $e) {
            $this->sendResponse(false, $e->getMessage(), null, 500);
        }
    }

    /**
     * Get active branches
     */
    public function getActive(): void
    {
        try {
            $branches = $this->branchModel->getActive();
            $this->sendResponse(true, 'Active branches retrieved successfully', $branches, 200);
        } catch (\Exception $e) {
            $this->sendResponse(false, $e->getMessage(), null, 500);
        }
    }

    /**
     * Get JSON input from request body
     */
    private function getJsonInput(): array
    {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        return is_array($data) ? $data : [];
    }

    /**
     * Send JSON response
     */
    private function sendResponse(bool $success, string $message, $data = null, int $statusCode = 200): void
    {
        header('Content-Type: application/json');
        http_response_code($statusCode);

        $response = [
            'success' => $success,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ];

        echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
