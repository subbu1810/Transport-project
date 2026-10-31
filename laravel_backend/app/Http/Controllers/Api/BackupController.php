<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;
use App\Models\BackupLog;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;


class BackupController extends Controller
{
    public function status()
    {
        $setting = Setting::where('key', 'auto_backup')->first();
        return response()->json([
            'success' => true,
            'enabled' => $setting ? filter_var($setting->value, FILTER_VALIDATE_BOOLEAN) : false
        ]);
    }

    public function toggle(Request $request)
    {
        $request->validate(['enabled' => 'required|boolean']);

        Setting::updateOrCreate(
            ['key' => 'auto_backup'],
            ['value' => $request->enabled ? '1' : '0']
        );

        return response()->json([
            'success' => true,
            'message' => 'Auto backup setting updated successfully',
            'enabled' => $request->enabled
        ]);
    }

    public function manual(Request $request)
    {
        $request->validate([
            'type' => 'required|in:database,files,combined'
        ]);

        // Skip Spatie/Artisan entirely (causes Blade cache errors in API context).
        // Use the native PHP backup directly.
        try {
            $zipFileName = $this->generatePhpNativeBackup();
            return response()->json([
                'success' => true,
                'message' => 'Backup generated successfully.',
                'file' => $zipFileName
            ]);
        } catch (\Exception $e) {
            Log::error('Native backup failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Backup failed: ' . $e->getMessage()
            ], 500);
        }
    }

    private function generatePhpNativeBackup()
    {
        $appName = preg_replace('/[^A-Za-z0-9_\-]/', '_', config('app.name', 'TransportBackup'));

        // Try storage/app first; fall back to system temp dir if not writable
        $baseDir = storage_path('app');
        if (!is_dir($baseDir) || !is_writable($baseDir)) {
            $baseDir = sys_get_temp_dir();
        }
        $folder = $baseDir . DIRECTORY_SEPARATOR . $appName;

        if (!is_dir($folder)) {
            if (!@mkdir($folder, 0775, true)) {
                // Last resort: just use the base writable dir directly
                $folder = $baseDir;
            }
        }

        $timestamp = date('Y-m-d-H-i-s');
        $sqlFile = $folder . '/database_' . $timestamp . '.sql';
        $zipFile = $folder . '/' . $timestamp . '.zip';

        // Export tables via PDO
        $pdo = \DB::connection()->getPdo();
        $tables = $pdo->query('SHOW TABLES')->fetchAll(\PDO::FETCH_COLUMN);

        $handle = fopen($sqlFile, 'w');
        fwrite($handle, "-- Transport Management System Native Database Backup\n-- Date: " . date('Y-m-d H:i:s') . "\n\nSET FOREIGN_KEY_CHECKS=0;\n\n");

        foreach ($tables as $table) {
            $createTable = $pdo->query("SHOW CREATE TABLE `{$table}`")->fetch(\PDO::FETCH_NUM);
            fwrite($handle, "DROP TABLE IF EXISTS `{$table}`;\n" . $createTable[1] . ";\n\n");

            $rows = $pdo->query("SELECT * FROM `{$table}`")->fetchAll(\PDO::FETCH_ASSOC);
            if (!empty($rows)) {
                $columns = array_keys($rows[0]);
                $colNames = implode('`, `', $columns);

                foreach ($rows as $row) {
                    $values = array_map(function ($val) use ($pdo) {
                        return is_null($val) ? 'NULL' : $pdo->quote($val);
                    }, array_values($row));
                    $valList = implode(', ', $values);
                    fwrite($handle, "INSERT INTO `{$table}` (`{$colNames}`) VALUES ({$valList});\n");
                }
                fwrite($handle, "\n");
            }
        }

        fwrite($handle, "SET FOREIGN_KEY_CHECKS=1;\n");
        fclose($handle);

        // Create Zip
        $zip = new \ZipArchive();
        if ($zip->open($zipFile, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
            $zip->addFile($sqlFile, 'db-dumps/mysql-' . $timestamp . '.sql');
            $zip->close();
        }

        if (file_exists($sqlFile)) {
            unlink($sqlFile);
        }

        // Auto-prune: Keep only the newest 2 backups on disk to protect server storage
        $existingZips = glob($folder . '/*.zip');
        if ($existingZips && count($existingZips) > 2) {
            usort($existingZips, function ($a, $b) {
                return filemtime($b) - filemtime($a);
            });
            foreach (array_slice($existingZips, 2) as $oldZip) {
                @unlink($oldZip);
            }
        }

        return basename($zipFile);
    }

    public function index()
    {
        $diskName = config('backup.backup.destination.disks')[0] ?? 'local';
        $appName = config('backup.backup.name') ?? config('app.name');

        $disk = Storage::disk($diskName);
        $files = $disk->allFiles($appName);

        // if the folder doesn't exist or is empty, try root of disk
        if (empty($files)) {
            $files = array_filter($disk->allFiles(''), function ($file) {
                return str_ends_with($file, '.zip');
            });
        }

        $backups = [];
        foreach ($files as $file) {
            if (!str_ends_with($file, '.zip'))
                continue;

            $backups[] = [
                'name' => basename($file),
                'path' => $file,
                'size' => $disk->size($file),
                'date' => date('Y-m-d H:i:s', $disk->lastModified($file))
            ];
        }

        // Sort by newest
        usort($backups, function ($a, $b) {
            return $b['date'] <=> $a['date'];
        });

        return response()->json([
            'success' => true,
            'data' => $backups
        ]);
    }

    public function globalStatus()
    {
        // Check if any backup was downloaded in the last 7 days
        $lastDownload = BackupLog::orderBy('created_at', 'desc')->first();
        
        if ($lastDownload && $lastDownload->created_at >= now()->subDays(7)) {
            return response()->json([
                'success' => true,
                'locked' => false,
                'last_download' => $lastDownload
            ]);
        }
        
        return response()->json([
            'success' => true,
            'locked' => true
        ]);
    }

    public function logs()
    {
        $logs = BackupLog::orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    public function download(Request $request)
    {
        $fileName = $request->query('file');
        if (!$fileName) {
            return response()->json(['success' => false, 'message' => 'File name required'], 400);
        }

        $diskName = config('backup.backup.destination.disks')[0] ?? 'local';
        $disk = Storage::disk($diskName);

        // Find the exact path for the file. 
        // It might be in the appName folder or in the root.
        $files = $disk->allFiles('');
        $foundPath = null;
        foreach ($files as $file) {
            if (basename($file) === $fileName) {
                $foundPath = $file;
                break;
            }
        }

        if (!$foundPath || !$disk->exists($foundPath)) {
            return response()->json(['success' => false, 'message' => 'Backup file not found'], 404);
        }

        // Log the download event
        try {
            BackupLog::create([
                'user_id' => $request->query('user_id'),
                'user_name' => $request->query('user_name'),
                'file_name' => $fileName,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);
        } catch (\Exception $e) {
            // Log error silently to not disrupt the download
            Log::error('Failed to create BackupLog: ' . $e->getMessage());
        }

        return $disk->download($foundPath);
    }
}
