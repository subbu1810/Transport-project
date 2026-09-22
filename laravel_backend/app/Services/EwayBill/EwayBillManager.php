<?php

namespace App\Services\EwayBill;

use App\Contracts\EwayBillProviderInterface;
use App\Models\EwayBillConfiguration;
use App\Services\EwayBill\Providers\ClearTaxProvider;
use App\Services\EwayBill\Providers\MastersIndiaProvider;
use Exception;

class EwayBillManager
{
    /**
     * Resolve the e-Way bill provider for a given transport.
     *
     * @param int $transportId
     * @return EwayBillProviderInterface
     * @throws Exception
     */
    public static function resolve(int $transportId): EwayBillProviderInterface
    {
        $config = EwayBillConfiguration::where('transport_id', $transportId)
            ->where('is_active', true)
            ->first();

        if (!$config) {
            throw new Exception("No active e-Way Bill configuration found for this transport company.");
        }

        $provider = self::getProviderInstance($config->provider);
        $provider->setCredentials($config->credentials ?? []);

        return $provider;
    }

    /**
     * Instantiate the specific provider class.
     *
     * @param string $providerName
     * @return EwayBillProviderInterface
     * @throws Exception
     */
    private static function getProviderInstance(string $providerName): EwayBillProviderInterface
    {
        return match ($providerName) {
            'masters_india' => new MastersIndiaProvider(),
            'cleartax' => new ClearTaxProvider(),
            default => throw new Exception("Unsupported e-Way Bill provider: {$providerName}"),
        };
    }
}
