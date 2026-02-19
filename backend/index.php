<?php

/**
 * Transport Management System - API Entry Point
 * Latest PHP 8.2+ with modern practices
 */

// Enable error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/error.log');

// Set default timezone
date_default_timezone_set('UTC');

// Define base path
define('BASE_PATH', __DIR__);
define('CONFIG_PATH', BASE_PATH . '/config');
define('MODELS_PATH', BASE_PATH . '/models');
define('CONTROLLERS_PATH', BASE_PATH . '/controllers');
define('ROUTES_PATH', BASE_PATH . '/routes');

// Autoloader for classes
spl_autoload_register(function ($class) {
    $prefix = '';
    $base_dir = '';

    // Check namespace and map to directory
    if (strpos($class, 'Config\\') === 0) {
        $base_dir = CONFIG_PATH . '/';
        $prefix = 'Config\\';
    } elseif (strpos($class, 'Models\\') === 0) {
        $base_dir = MODELS_PATH . '/';
        $prefix = 'Models\\';
    } elseif (strpos($class, 'Controllers\\') === 0) {
        $base_dir = CONTROLLERS_PATH . '/';
        $prefix = 'Controllers\\';
    } elseif (strpos($class, 'Routes\\') === 0) {
        $base_dir = ROUTES_PATH . '/';
        $prefix = 'Routes\\';
    }

    if (!$base_dir) {
        return;
    }

    // Remove prefix from class name
    $relative_class = substr($class, strlen($prefix));

    // Build file path
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    // Require file if it exists
    if (file_exists($file)) {
        require $file;
    }
});

// Load environment variables
if (file_exists(BASE_PATH . '/.env')) {
    $env_file = file_get_contents(BASE_PATH . '/.env');
    $lines = explode("\n", $env_file);
    
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        
        if (strpos($line, '=') !== false) {
            [$key, $value] = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Route the request
try {
    $router = new Routes\Router();
    $router->route();
} catch (\Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error',
        'error' => $_ENV['APP_ENV'] === 'development' ? $e->getMessage() : null,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
