<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Admin;
use App\Models\ScreenAssignment;

class AssignScreensSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = Admin::where('name', 'guru')->first();

        if ($admin) {
            // Clear existing assignments permanently
            ScreenAssignment::where('admin_id', $admin->id)->forceDelete();

            // Assign key screens
            $screens = [
                ['path' => '/gc-entry', 'name' => 'GC Entry', 'category' => 'Way Bill'],
                ['path' => '/gc-track', 'name' => 'GC Track', 'category' => 'Way Bill'],
                ['path' => '/trip-sheet-entry', 'name' => 'Trip Sheet Entry', 'category' => 'Trip Sheet'],
                ['path' => '/trip-sheet-report', 'name' => 'Trip Sheet Report', 'category' => 'Trip Sheet'],
            ];

            foreach ($screens as $screen) {
                ScreenAssignment::create([
                    'admin_id' => $admin->id,
                    'screen_path' => $screen['path'],
                    'screen_name' => $screen['name'],
                    'category' => $screen['category'],
                    'is_active' => true,
                ]);
            }

            echo "Screens assigned to user 'guru'!\n";
        } else {
            echo "User 'guru' not found.\n";
        }
    }
}
