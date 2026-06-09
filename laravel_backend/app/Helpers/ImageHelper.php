<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ImageHelper
{
    /**
     * Compress and resize an image to reduce storage space.
     * Optimized for shared hosting environments like MilesWeb.
     * 
     * @param mixed $file The uploaded file object
     * @param string $directory Relative path in storage
     * @param string $filename Custom filename base
     * @param int $maxWidth Maximum width of the image
     * @param int $quality Compression quality (0-100)
     * @return string Returns relative path on success
     */
    public static function compressAndStore($file, $directory, $filename, $maxWidth = 1000, $quality = 75)
    {
        try {
            $sourcePath = $file->getRealPath();
            $extension = strtolower($file->getClientOriginalExtension());
            
            // Safer Mime Detection (finfo might be disabled on MilesWeb)
            $mime = null;
            if (function_exists('finfo_open')) {
                $mime = $file->getMimeType();
            } else {
                $info = @getimagesize($sourcePath);
                $mime = $info['mime'] ?? 'image/' . $extension;
            }

            // Handle SVG: Vector files should not be bitmap-compressed
            if ($extension === 'svg' || str_contains($mime, 'svg')) {
                return $file->storeAs($directory, $filename . '.svg', 'public');
            }

            // If GD is missing, we must just store the file raw
            if (!extension_loaded('gd')) {
                Log::warning('GD Extension missing on server. Storing raw image.');
                return $file->storeAs($directory, $filename . '.' . $extension, 'public');
            }

            $info = @getimagesize($sourcePath);
            if (!$info) {
                return $file->storeAs($directory, $filename . '.' . $extension, 'public');
            }

            $mime = $info['mime'];
            $image = null;
            
            // Create image resource based on type
            switch ($mime) {
                case 'image/jpeg':
                case 'image/jpg':
                    $image = @imagecreatefromjpeg($sourcePath);
                    // Fix Orientation (iPhone/Android photos)
                    if (function_exists('exif_read_data') && $image) {
                        $exif = @exif_read_data($sourcePath);
                        if ($exif && isset($exif['Orientation'])) {
                            switch ($exif['Orientation']) {
                                case 3: $image = imagerotate($image, 180, 0); break;
                                case 6: $image = imagerotate($image, -90, 0); break;
                                case 8: $image = imagerotate($image, 90, 0); break;
                            }
                        }
                    }
                    break;
                case 'image/png':
                    $image = @imagecreatefrompng($sourcePath);
                    break;
                case 'image/gif':
                    $image = @imagecreatefromgif($sourcePath);
                    break;
                case 'image/webp':
                    if (function_exists('imagecreatefromwebp')) {
                        $image = @imagecreatefromwebp($sourcePath);
                    }
                    break;
                case 'image/bmp':
                case 'image/x-ms-bmp':
                    if (function_exists('imagecreatefrombmp')) {
                        $image = @imagecreatefrombmp($sourcePath);
                    }
                    break;
            }

            // Fallback if image resource creation failed
            if (!$image) {
                return $file->storeAs($directory, $filename . '.' . $extension, 'public');
            }

            // Original dimensions
            $width = imagesx($image);
            $height = imagesy($image);

            // Resize logic
            if ($width > $maxWidth) {
                $newWidth = $maxWidth;
                $newHeight = floor($height * ($maxWidth / $width));
                $tmpImage = imagecreatetruecolor($newWidth, $newHeight);
                
                // Preserve transparency
                imagealphablending($tmpImage, false);
                imagesavealpha($tmpImage, true);
                
                imagecopyresampled($tmpImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
                imagedestroy($image);
                $image = $tmpImage;
            }

            // Prepare Storage Directory
            if (!Storage::disk('public')->exists($directory)) {
                Storage::disk('public')->makeDirectory($directory);
            }

            // Shared Hosting Check: Does GD support WebP?
            if (function_exists('imagewebp')) {
                $savePath = $directory . '/' . $filename . '.webp';
                $absolutePath = storage_path('app/public/' . $savePath);
                imagewebp($image, $absolutePath, $quality);
                @chmod($absolutePath, 0644);
            } else {
                // Fallback to JPEG if WebP is not supported by server's GD
                $savePath = $directory . '/' . $filename . '.jpg';
                $absolutePath = storage_path('app/public/' . $savePath);
                imagejpeg($image, $absolutePath, $quality);
                @chmod($absolutePath, 0644);
            }

            imagedestroy($image);
            return $savePath;

        } catch (\Exception $e) {
            Log::error('Hosting Image Helper Error: ' . $e->getMessage());
            // Safe fallback for shared hosting
            $ext = $file->getClientOriginalExtension();
            return $file->storeAs($directory, $filename . '.' . $ext, 'public');
        }
    }

    /**
     * Delete an image from storage if it exists.
     */
    public static function purge($path)
    {
        try {
            if ($path && Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
                return true;
            }
        } catch (\Exception $e) {
            Log::error('Purge Error: ' . $e->getMessage());
        }
        return false;
    }
}
