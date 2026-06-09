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
        $value = $setting ? $setting->value : null;

        // Fallback for gst_number: get from first transport if not in settings
        if (!$value && ($key === 'gst_number' || $key === 'gstin')) {
            $transport = \App\Models\Transport::where('is_active', true)->first() 
                      ?? \App\Models\Transport::first();
            $value = $transport?->gst_number;
        }

        return response()->json([
            'success' => true,
            'data' => $value
        ]);
    }

    public function getAllSettings()
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        
        // Ensure gst fallback is present in settings list
        if (!isset($settings['gst_number']) || !isset($settings['gstin'])) {
            $transport = \App\Models\Transport::where('is_active', true)->first() 
                      ?? \App\Models\Transport::first();
            if ($transport && $transport->gst_number) {
                if (!isset($settings['gst_number'])) $settings['gst_number'] = $transport->gst_number;
                if (!isset($settings['gstin'])) $settings['gstin'] = $transport->gst_number;
            }
        }

        return response()->json([
            'success' => true,
            'data' => $settings
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

            // Store the file using ImageHelper for compression
            $filename = 'logo_' . time();
            $path = \App\Helpers\ImageHelper::compressAndStore($file, 'logos', $filename);

            if ($path) {
                // Delete old logo if exists
                $oldSetting = Setting::where('key', 'logo_path')->first();
                if ($oldSetting && $oldSetting->value) {
                    \App\Helpers\ImageHelper::purge($oldSetting->value);
                }

                $setting = Setting::updateOrCreate(
                    ['key' => 'logo_path'],
                    ['value' => $path]
                );

                return response()->json([
                    'success' => true,
                    'message' => 'Logo uploaded successfully',
                    'data' => [
                        'path' => $path,
                        'url' => asset('storage/' . $path)
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
            \App\Helpers\ImageHelper::purge($setting->value);
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

    public function updateUPIDetails(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'upi_id' => 'required|string',
            'account_holder' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        Setting::updateOrCreate(['key' => 'upi_id'], ['value' => $request->upi_id]);
        Setting::updateOrCreate(['key' => 'upi_account_holder'], ['value' => $request->account_holder]);

        return response()->json([
            'success' => true,
            'message' => 'UPI details updated successfully'
        ]);
    }

    public function updateQR(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'qr_code' => 'required|file|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->hasFile('qr_code')) {
            $file = $request->file('qr_code');
            $extension = strtolower($file->getClientOriginalExtension());
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'svg'];

            if (!in_array($extension, $allowedExtensions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'The QR code must be a file of type: ' . implode(', ', $allowedExtensions)
                ], 422);
            }

            $filename = 'upi_qr_' . time();
            $path = \App\Helpers\ImageHelper::compressAndStore($file, 'qr_codes', $filename);

            if ($path) {
                // Delete old QR if exists
                $oldSetting = Setting::where('key', 'upi_qr_path')->first();
                if ($oldSetting && $oldSetting->value) {
                    \App\Helpers\ImageHelper::purge($oldSetting->value);
                }

                Setting::updateOrCreate(
                    ['key' => 'upi_qr_path'],
                    ['value' => $path]
                );

                return response()->json([
                    'success' => true,
                    'message' => 'QR code uploaded successfully',
                    'data' => [
                        'path' => $path,
                        'url' => asset('storage/' . $path)
                    ]
                ]);
            }
        }

        return response()->json(['success' => false, 'message' => 'Failed to upload QR code'], 500);
    }

    public function deleteQR()
    {
        $setting = Setting::where('key', 'upi_qr_path')->first();
        if ($setting && $setting->value) {
            \App\Helpers\ImageHelper::purge($setting->value);
            $setting->update(['value' => null]);
            
            return response()->json([
                'success' => true,
                'message' => 'QR code deleted successfully'
            ]);
        }

        return response()->json(['success' => false, 'message' => 'No QR code found to delete'], 404);
    }
}
