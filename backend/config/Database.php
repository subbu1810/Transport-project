<?php

/**
 * Database Connection Class
 * Handles MySQL database connections using PDO
 */

namespace Config;

use PDO;
use PDOException;

class Database
{
    private string $host;
    private string $db_name;
    private string $username;
    private string $password;
    private string $charset;
    private ?PDO $pdo = null;

    public function __construct()
    {
        $this->host = $_ENV['DB_HOST'] ?? 'localhost';
        $this->db_name = $_ENV['DB_NAME'] ?? 'transport_management_system';
        $this->username = $_ENV['DB_USER'] ?? 'transport_user';
        $this->password = $_ENV['DB_PASSWORD'] ?? 'secure_password_123';
        $this->charset = 'utf8mb4';
    }

    /**
     * Connect to database
     */
    public function connect(): PDO
    {
        if ($this->pdo !== null) {
            return $this->pdo;
        }

        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset={$this->charset}";
            
            $this->pdo = new PDO(
                $dsn,
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );

            return $this->pdo;
        } catch (PDOException $e) {
            die('Database Connection Error: ' . $e->getMessage());
        }
    }

    /**
     * Get database connection
     */
    public function getConnection(): PDO
    {
        return $this->connect();
    }

    /**
     * Close database connection
     */
    public function disconnect(): void
    {
        $this->pdo = null;
    }
}
