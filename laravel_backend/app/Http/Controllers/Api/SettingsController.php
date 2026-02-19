<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    public function getSetting($key)
    {
        $setting = Setting::where('key', $key)->first();
        return response()->json([
            'success' => true,
            'data' => $setting ? $setting->value : null
        ]);
    }

    public function updateLogo(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'logo' => 'required|file|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->hasFile('logo')) {
            $file = $request->file('logo');
            $extension = strtolower($file->getClientOriginalExtension());
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg'];

            if (!in_array($extension, $allowedExtensions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'The logo must be a file of type: ' . implode(', ', $allowedExtensions)
                ], 422);
            }

            // Create directories if they don't exist
            $publicPath = public_path('storage/logos');
            if (!file_exists($publicPath)) {
                mkdir($publicPath, 0755, true);
            }

            // Delete old logo if exists
            $oldSetting = Setting::where('key', 'logo_path')->first();
            if ($oldSetting && $oldSetting->value) {
                $oldFilePath = public_path('storage/' . $oldSetting->value);
                if (file_exists($oldFilePath)) {
                    unlink($oldFilePath);
                }
            }

            // Generate unique filename
            $filename = 'logo_' . time() . '_' . uniqid() . '.' . $extension;
            $relativePath = 'logos/' . $filename;
            $fullPath = public_path('storage/' . $relativePath);

            // Move uploaded file using native PHP
            if (move_uploaded_file($file->getRealPath(), $fullPath)) {
                $setting = Setting::updateOrCreate(
                    ['key' => 'logo_path'],
                    ['value' => $relativePath]
                );

                return response()->json([
                    'success' => true,
                    'message' => 'Logo uploaded successfully',
                    'data' => [
                        'path' => $relativePath,
                        'url' => asset('storage/' . $relativePath)
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to save logo file'
                ], 500);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'No logo file provided'
        ], 400);
    }

    public function deleteLogo()
    {
        $setting = Setting::where('key', 'logo_path')->first();
        if ($setting && $setting->value) {
            $filePath = public_path('storage/' . $setting->value);
            if (file_exists($filePath)) {
                unlink($filePath);
            }
            $setting->update(['value' => null]);
            
            return response()->json([
                'success' => true,
                'message' => 'Logo deleted successfully'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No logo found to delete'
        ], 404);
    }
}
