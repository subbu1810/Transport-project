/**
 * Creates a properly padded Android adaptive icon from garuda-logo.png.
 * Android adaptive icons safe zone = center 66% of image.
 * We apply 20% transparent padding on all sides so the logo = 60% of total.
 */

const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');

const inputPath  = path.join(__dirname, '..', 'assets', 'garuda-logo.png');
const outputPath = path.join(__dirname, '..', 'assets', 'adaptive-icon.png');

const OUTPUT_SIZE    = 1024;
const PADDING_PCT    = 0.20;                                               // 20% each side
const LOGO_SIZE      = Math.round(OUTPUT_SIZE * (1 - PADDING_PCT * 2));   // 614 px
const PADDING        = Math.round(OUTPUT_SIZE * PADDING_PCT);              // 205 px

(async () => {
  if (!fs.existsSync(inputPath)) {
    console.error('❌ Not found:', inputPath);
    process.exit(1);
  }

  console.log('Reading garuda-logo.png …');
  const logo = await Jimp.read(inputPath);

  console.log(`Original size: ${logo.width}x${logo.height}`);
  console.log(`Resizing logo to ${LOGO_SIZE}x${LOGO_SIZE} (${Math.round((1 - PADDING_PCT*2)*100)}% of ${OUTPUT_SIZE}) …`);

  logo.resize({ w: LOGO_SIZE, h: LOGO_SIZE });

  // Create white background
  const bg = new Jimp({ width: OUTPUT_SIZE, height: OUTPUT_SIZE, color: 0xFFFFFFFF });

  // Composite logo centered
  bg.composite(logo, PADDING, PADDING);

  await bg.write(outputPath);
  console.log(`\n✅ Created: assets/adaptive-icon.png`);
  console.log(`   Total:  ${OUTPUT_SIZE}x${OUTPUT_SIZE}px`);
  console.log(`   Logo:   ${LOGO_SIZE}x${LOGO_SIZE}px  (padded ${PADDING}px on each side)`);
  console.log(`\n📝 app.json already points to adaptive-icon.png`);
  console.log(`🔨 Rebuild: npx eas build -p android --profile preview`);
})();
