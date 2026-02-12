const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputFile = '/home/mati/Pobrane/logo/logo.png';
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const sizes = [
  { name: 'icon-16', size: 16, format: 'png' },
  { name: 'icon-32', size: 32, format: 'png' },
  { name: 'icon-48', size: 48, format: 'png' },
  { name: 'icon-72', size: 72, format: 'png' },
  { name: 'icon-96', size: 96, format: 'png' },
  { name: 'icon-128', size: 128, format: 'png' },
  { name: 'icon-144', size: 144, format: 'png' },
  { name: 'icon-152', size: 152, format: 'png' },
  { name: 'icon-180', size: 180, format: 'png' }, // Apple touch icon
  { name: 'icon-192', size: 192, format: 'png' },
  { name: 'icon-384', size: 384, format: 'png' },
  { name: 'icon-512', size: 512, format: 'png' },
];

async function optimizeLogos() {
  console.log('🔧 Starting logo optimization...\n');

  for (const { name, size, format } of sizes) {
    try {
      // PNG version
      const pngOutput = path.join(outputDir, `${name}.png`);
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ quality: 90, compressionLevel: 9 })
        .toFile(pngOutput);

      const pngStats = fs.statSync(pngOutput);
      console.log(`✓ ${name}.png (${size}x${size}) - ${(pngStats.size / 1024).toFixed(1)}KB`);

      // WebP version for better compression
      const webpOutput = path.join(outputDir, `${name}.webp`);
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ quality: 85 })
        .toFile(webpOutput);

      const webpStats = fs.statSync(webpOutput);
      console.log(`✓ ${name}.webp (${size}x${size}) - ${(webpStats.size / 1024).toFixed(1)}KB`);
    } catch (error) {
      console.error(`✗ Error processing ${name}:`, error.message);
    }
  }

  // Generate favicon.ico (multi-size)
  try {
    await sharp(inputFile)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.join(outputDir, 'favicon.png'));
    console.log('\n✓ favicon.png generated');
  } catch (error) {
    console.error('✗ Error generating favicon:', error.message);
  }

  console.log('\n✅ Logo optimization complete!');
}

optimizeLogos().catch(console.error);
