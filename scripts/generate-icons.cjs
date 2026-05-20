/**
 * Generates all app icons (PWA + Capacitor) from a single SVG source.
 * Run: node scripts/generate-icons.cjs
 *
 * Output:
 *  - public/icons/icon-{192,512}.png (standard PWA)
 *  - public/icons/icon-maskable-{192,512}.png (with safe zone padding for Android adaptive)
 *  - public/icons/apple-touch-icon.png (180x180)
 *  - public/icons/favicon-{16,32}.png
 *  - public/splash/splash-{2732x2732,1242x2688,1125x2436,750x1334}.png (iOS sizes)
 *  - public/splash/android-splash.png (Android, 2732x2732)
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'assets/icon-source.svg');
const ICONS_DIR = path.join(ROOT, 'public/icons');
const SPLASH_DIR = path.join(ROOT, 'public/splash');

// Krijo folderat nese nuk ekzistojne
for (const dir of [ICONS_DIR, SPLASH_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const svgBuffer = fs.readFileSync(SRC);

async function generateStandardIcon(size) {
  const out = path.join(ICONS_DIR, `icon-${size}.png`);
  await sharp(svgBuffer)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(out);
  console.log(`  ✓ ${out}`);
}

// Maskable: shtojme 20% padding qe Android adaptive icon te jete e centruar
async function generateMaskableIcon(size) {
  const out = path.join(ICONS_DIR, `icon-maskable-${size}.png`);
  const innerSize = Math.round(size * 0.6); // 60% i full size
  const padding = Math.round((size - innerSize) / 2);

  const innerIcon = await sharp(svgBuffer)
    .resize(innerSize, innerSize, { fit: 'cover' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 102, b: 255, alpha: 1 }, // brand color
    },
  })
    .composite([{ input: innerIcon, top: padding, left: padding }])
    .png()
    .toFile(out);

  console.log(`  ✓ ${out}`);
}

async function generateFavicon(size) {
  const out = path.join(ICONS_DIR, `favicon-${size}.png`);
  await sharp(svgBuffer)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(out);
  console.log(`  ✓ ${out}`);
}

async function generateAppleTouchIcon() {
  const out = path.join(ICONS_DIR, 'apple-touch-icon.png');
  await sharp(svgBuffer)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toFile(out);
  console.log(`  ✓ ${out}`);
}

// Splash screen — sfond i bardhë me logo në qendër
async function generateSplash(width, height, name) {
  const out = path.join(SPLASH_DIR, `${name}.png`);
  const logoSize = Math.min(width, height) * 0.3; // 30% e dimensionit më të vogël
  const logoPng = await sharp(svgBuffer)
    .resize(Math.round(logoSize), Math.round(logoSize), { fit: 'cover' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: logoPng,
        top: Math.round((height - logoSize) / 2),
        left: Math.round((width - logoSize) / 2),
      },
    ])
    .png()
    .toFile(out);

  console.log(`  ✓ ${out}`);
}

(async () => {
  console.log('🎨 Duke gjeneruar ikonat e app-it...\n');
  console.log('Standard PWA:');
  await generateStandardIcon(192);
  await generateStandardIcon(512);

  console.log('\nMaskable (Android adaptive):');
  await generateMaskableIcon(192);
  await generateMaskableIcon(512);

  console.log('\nApple Touch Icon:');
  await generateAppleTouchIcon();

  console.log('\nFavicons:');
  await generateFavicon(16);
  await generateFavicon(32);
  await generateFavicon(48);

  console.log('\nSplash screens:');
  // iOS sizes
  await generateSplash(2732, 2732, 'splash-2732x2732');
  await generateSplash(1242, 2688, 'splash-1242x2688');
  await generateSplash(1125, 2436, 'splash-1125x2436');
  await generateSplash(828, 1792, 'splash-828x1792');
  await generateSplash(750, 1334, 'splash-750x1334');
  // Android (universal)
  await generateSplash(2732, 2732, 'android-splash');

  console.log('\n✅ Te gjitha ikonat u gjeneruan me sukses!');
})().catch((err) => {
  console.error('❌ Gabim:', err);
  process.exit(1);
});
