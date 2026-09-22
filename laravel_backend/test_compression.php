<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Http\UploadedFile;

echo "Generating a large dummy image (3000x3000 pixels)...\n";
$file = UploadedFile::fake()->image('test_pod.jpg', 3000, 3000);
$originalSize = filesize($file->getRealPath());

echo "Original Image Size: " . round($originalSize / 1024, 2) . " KB\n";
echo "Original Dimensions: 3000x3000\n\n";

echo "Applying compression (Width: 800px, Quality: 60%)...\n";

$manager = new ImageManager(new Driver());
$image = $manager->read($file->getRealPath());

if ($image->width() > 800) {
    $image->scaleDown(width: 800);
}

$encoded = $image->toJpeg(60);
$compressedSize = strlen($encoded->toString());

echo "Compressed Image Size: " . round($compressedSize / 1024, 2) . " KB\n";
echo "Compressed Dimensions: " . $image->width() . "x" . $image->height() . "\n";
echo "Storage Space Saved: " . round((1 - ($compressedSize / $originalSize)) * 100, 2) . "%\n";
