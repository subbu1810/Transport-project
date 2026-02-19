<?php

/**
 * API Routes
 * Defines all API endpoints for the application
 */

namespace Routes;

use Controllers\BranchController;
use Config\Database;

class Router
{
    private string $method;
    private string $path;
    private array $pathParts;
    private BranchController $branchController;

    public function __construct()
    {
        $this->method = $_SERVER['REQUEST_METHOD'];
        $this->path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $this->pathParts = array_filter(explode('/', $this->path));

        // Initialize database and controller
        $db = new Database();
        $this->branchController = new BranchController($db->getConnection());
    }

    /**
     * Route the request to appropriate controller
     */
    public function route(): void
    {
        // Remove base path from pathParts
        $pathParts = array_values($this->pathParts);

        // Check if request is for API
        if (!isset($pathParts[0]) || $pathParts[0] !== 'api') {
            $this->notFound();
            return;
        }

        // Handle /api/v1 prefix
        $resourceIndex = 1;
        if (isset($pathParts[1]) && $pathParts[1] === 'v1') {
            $resourceIndex = 2;
        }

        // Get resource and ID
        $resource = $pathParts[$resourceIndex] ?? null;
        $id = $pathParts[$resourceIndex + 1] ?? null;
        $action = $pathParts[$resourceIndex + 2] ?? null;

        // Route to appropriate controller
        match ($resource) {
            'branches' => $this->handleBranchRoutes($id, $action),
            default => $this->notFound()
        };
    }

    /**
     * Handle branch routes
     */
    private function handleBranchRoutes(?string $id, ?string $action): void
    {
        match ($this->method) {
            'GET' => $this->handleBranchGet($id, $action),
            'POST' => $this->handleBranchPost($id, $action),
            'PUT' => $this->handleBranchPut($id),
            'DELETE' => $this->handleBranchDelete($id),
            default => $this->methodNotAllowed()
        };
    }

    /**
     * Handle GET requests for branches
     */
    private function handleBranchGet(?string $id, ?string $action): void
    {
        if ($action === 'search') {
            $this->branchController->search();
        } elseif ($action === 'active') {
            $this->branchController->getActive();
        } elseif ($id) {
            $this->branchController->getById((int)$id);
        } else {
            $this->branchController->getAll();
        }
    }

    /**
     * Handle POST requests for branches
     */
    private function handleBranchPost(?string $id, ?string $action): void
    {
        if ($id && $action === 'search') {
            $this->branchController->search();
        } else {
            $this->branchController->create();
        }
    }

    /**
     * Handle PUT requests for branches
     */
    private function handleBranchPut(?string $id): void
    {
        if (!$id) {
            $this->badRequest('Branch ID is required');
            return;
        }

        $this->branchController->update((int)$id);
    }

    /**
     * Handle DELETE requests for branches
     */
    private function handleBranchDelete(?string $id): void
    {
        if (!$id) {
            $this->badRequest('Branch ID is required');
            return;
        }

        $this->branchController->delete((int)$id);
    }

    /**
     * Send 404 Not Found response
     */
    private function notFound(): void
    {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Endpoint not found',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }

    /**
     * Send 405 Method Not Allowed response
     */
    private function methodNotAllowed(): void
    {
        header('Content-Type: application/json');
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }

    /**
     * Send 400 Bad Request response
     */
    private function badRequest(string $message): void
    {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
}
