<?php

namespace App\Contracts;

interface EwayBillProviderInterface
{
    /**
     * Set the API credentials dynamically.
     */
    public function setCredentials(array $credentials): void;

    /**
     * Generate an e-Way Bill.
     */
    public function generate(array $data): array;

    /**
     * Cancel an e-Way Bill.
     */
    public function cancel(string $ewayBillNo, int $cancelReasonCode, string $cancelRemark): array;

    /**
     * Extend the validity of an e-Way Bill.
     */
    public function extend(array $data): array;

    /**
     * Update Part B (Vehicle details) of an e-Way Bill.
     */
    public function updatePartB(array $data): array;
}
