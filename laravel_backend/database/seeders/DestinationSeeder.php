<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Taluk;
use App\Models\Destination;
use App\Models\Branch;
use App\Models\BranchDestinationMapping;

class DestinationSeeder extends Seeder
{
    public function run(): void
    {
        $destinationsByTaluk = [
            'Bengaluru North' => [
                'Peenya Industrial Area',
                'Yeshwanthpur',
                'Jalahalli',
                'Hebbal',
            ],
            'Bengaluru South' => [
                'Electronic City',
                'Bommasandra Industrial Area',
                'Koramangala',
                'Bannerghatta Road',
                'JP Nagar',
            ],
            'Bengaluru East' => [
                'Whitefield',
                'Mahadevapura',
                'KR Puram',
                'Marathahalli',
            ],
            'Yelahanka' => [
                'Yelahanka New Town',
                'Doddaballapur Road Industrial Area',
            ],
            'Anekal' => [
                'Jigani Industrial Area',
                'Attibele',
                'Chandapura',
            ],
            'Mysuru Taluk' => [
                'Mysuru City Central',
                'Hebbal Industrial Area Mysuru',
                'Metagalli',
            ],
            'Nanjangud' => [
                'Nanjangud Industrial Area',
            ],
            'Mangaluru' => [
                'Mangalore Port / Wharf',
                'Baikampady Industrial Estate',
                'Hampankatta',
            ],
            'Hubballi' => [
                'Hubli Central Market',
                'Gokul Road Industrial Area',
                'Tarihal Industrial Estate',
            ],
            'Belagavi Taluk' => [
                'Belagavi Udyambag',
                'Auto Nagar Belagavi',
            ],
            'Guindy' => [
                'Guindy Industrial Estate',
                'Ekkatuthangal',
            ],
            'Ambattur' => [
                'Ambattur Industrial Estate',
                'Ambattur OT',
            ],
            'Coimbatore South' => [
                'Coimbatore City Market',
                'SIDCO Industrial Estate Kurichi',
            ],
            'Coimbatore North' => [
                'Ganapathy',
                'Peelamedu',
            ],
            'Pollachi' => [
                'Pollachi Market Hub',
            ],
            'Tiruppur Taluk' => [
                'Tiruppur Cotton Hub',
                'Veerapandi Common Facility',
            ],
            'Andheri' => [
                'Andheri East MIDC',
                'Sakinaka Industrial Area',
            ],
            'Kurla' => [
                'Kurla West Market',
                'Bandra Kurla Complex (BKC)',
            ],
            'Haveli' => [
                'Bhosari MIDC',
                'Hadapsar Industrial Estate',
                'Chakan Industrial Area',
            ],
            'Pune City' => [
                'Swargate Commercial Yard',
                'Shivajinagar',
            ],
            'Bhiwandi' => [
                'Bhiwandi Logistics Park',
                'Mankoli Warehousing Zone',
            ],
            'Secunderabad' => [
                'Sanath Nagar Industrial Estate',
                'Nacharam IDA',
            ],
            'Serilingampally' => [
                'Madhapur Commercial Hub',
                'Gachibowli',
            ],
            'Visakhapatnam Urban' => [
                'Vizag Port Trust Area',
                'Autonagar Vizag',
            ],
            'Gajuwaka' => [
                'Gajuwaka Industrial Corridor',
            ],
            'Vijayawada Urban' => [
                'Vijayawada Autonagar',
                'One Town Commercial Market',
            ],
            'Kanayannur / Kochi' => [
                'Willingdon Island Port',
                'Kalamassery Industrial Estate',
            ],
            'Daskroi' => [
                'Sanand GIDC',
                'Naroda Industrial Estate',
            ],
        ];

        $totalCount = 0;
        $branches = Branch::where('is_active', true)->get();

        foreach ($destinationsByTaluk as $talukName => $cities) {
            $taluk = Taluk::where('name', $talukName)->first();

            if (!$taluk) {
                $this->command->warn("Taluk {$talukName} not found, skipping its destinations.");
                continue;
            }

            foreach ($cities as $cityName) {
                $destination = Destination::updateOrCreate(
                    [
                        'taluk_id' => $taluk->id,
                        'city_name' => $cityName,
                    ],
                    [
                        'is_active' => true,
                    ]
                );

                // Map to existing active branches
                foreach ($branches as $branch) {
                    BranchDestinationMapping::firstOrCreate([
                        'branch_id' => $branch->id,
                        'destination_id' => $destination->id,
                    ]);
                }

                $totalCount++;
            }
        }

        $this->command->info("Destination seeder completed successfully! ({$totalCount} destinations seeded and mapped to branches)");
    }
}
