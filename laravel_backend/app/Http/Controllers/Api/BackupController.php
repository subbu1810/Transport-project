<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;
use App\Models\BackupLog;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

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

        try {
            // Force register the backup command since it's only loaded in console by default
            \Illuminate\Support\Facades\Artisan::registerCommand(app(\Spatie\Backup\Commands\BackupCommand::class));

            $params = [];
            if ($request->type === 'database') {
                $params['--only-db'] = true;
            } elseif ($request->type === 'files') {
                $params['--only-files'] = true;
            }
            
            $exitCode = Artisan::call('backup:run', $params);
            
            if ($exitCode !== 0) {
                throw new \Exception(Artisan::output() ?: 'Backup command failed with exit code ' . $exitCode);
            }

            return response()->json([
                'success' => true,
                'message' => 'Backup generated successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Backup failed: ' . $e->getMessage()
            ], 500);
        }
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
            \Log::error('Failed to create BackupLog: ' . $e->getMessage());
        }

        return $disk->download($foundPath);
    }
}
