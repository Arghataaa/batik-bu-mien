const sharp = require('sharp');

const size = 512;
const circleSvg = Buffer.from(
  `<svg width="${size}" height="${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/>
  </svg>`
);

async function main() {
  // Trim whitespace, resize to square, mask with circle
  await sharp('public/logo.png')
    .trim()
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: circleSvg, blend: 'dest-in' }])
    .png()
    .toFile('public/logo-circle.png');

  console.log('logo-circle.png created (512x512, circular)');

  // Also make small favicon version
  await sharp('public/logo-circle.png')
    .resize(64, 64)
    .png()
    .toFile('public/favicon-64.png');

  console.log('favicon-64.png created (64x64)');
}

main().catch(console.error);
