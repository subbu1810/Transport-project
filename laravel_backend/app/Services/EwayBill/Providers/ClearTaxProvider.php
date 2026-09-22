<?php

namespace App\Services\EwayBill\Providers;

use App\Contracts\EwayBillProviderInterface;
use Exception;

class ClearTaxProvider implements EwayBillProviderInterface
{
    protected array $credentials;

    public function setCredentials(array $credentials): void
    {
        $this->credentials = $credentials;
        // Expected keys: api_key, auth_token, owner_id, etc.
    }

    public function generate(array $data): array
    {
        // TODO: Implement ClearTax API call to generate E-Way Bill
        // Mock response for now
        return [
            'success' => true,
            'ewayBillNo' => 'CT' . time(),
            'message' => 'e-Way Bill generated successfully via ClearTax.',
            'raw_response' => []
        ];
    }

    public function cancel(string $ewayBillNo, int $cancelReasonCode, string $cancelRemark): array
    {
        // TODO: Implement cancel API
        return [
            'success' => true,
            'message' => 'e-Way Bill cancelled successfully via ClearTax.',
        ];
    }

    public function extend(array $data): array
    {
        // TODO: Implement extend API
        return [
            'success' => true,
            'message' => 'e-Way Bill extended successfully via ClearTax.',
        ];
    }

    public function updatePartB(array $data): array
    {
        // TODO: Implement update Part B API
        return [
            'success' => true,
            'message' => 'Part B updated successfully via ClearTax.',
        ];
    }
}
