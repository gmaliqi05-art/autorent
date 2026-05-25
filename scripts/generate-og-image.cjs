#!/usr/bin/env node
/**
 * Gjeneron og-image.jpg (1200x630) + logo.png nga icon-512 ekzistues.
 *
 * Perdorimi:
 *   node scripts/generate-og-image.cjs
 *
 * Output:
 *   public/og-image.jpg  — 1200x630 me logo te qendrueshme + branding text
 *   public/logo.png      — kopja e icon-512 (per JSON-LD organization.logo)
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const ICON_512 = path.join(ROOT, 'public/icons/icon-512.png');
const OUT_OG = path.join(ROOT, 'public/og-image.jpg');
const OUT_LOGO = path.join(ROOT, 'public/logo.png');

const BRAND_PRIMARY = '#2563eb'; // primary-600
const BRAND_DARK = '#1a1a2e';   // dark-950

async function main() {
  // 1. logo.png — vetem kopje e icon-512
  await sharp(ICON_512).png().toFile(OUT_LOGO);
  console.log(`logo.png u krijua (${(fs.statSync(OUT_LOGO).size / 1024).toFixed(1)} KB)`);

  // 2. og-image.jpg — 1200x630 me gradient bg + logo + texte
  const W = 1200;
  const H = 630;

  // Logo resize-uar ne 200x200 per qender
  const logoBuffer = await sharp(ICON_512).resize(200, 200).png().toBuffer();

  const svgOverlay = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${BRAND_DARK}" />
          <stop offset="100%" stop-color="${BRAND_PRIMARY}" />
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#bg)" />
      <text x="${W / 2}" y="${H / 2 + 140}" font-family="Arial, sans-serif" font-size="64" font-weight="800" fill="#ffffff" text-anchor="middle">RentaKar</text>
      <text x="${W / 2}" y="${H / 2 + 195}" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.85)" text-anchor="middle">Platforma e qirase se makinave</text>
      <text x="${W / 2}" y="${H / 2 + 235}" font-family="Arial, sans-serif" font-size="22" fill="rgba(255,255,255,0.7)" text-anchor="middle">Kosove · Shqiperi · Maqedoni</text>
    </svg>
  `;

  await sharp(Buffer.from(svgOverlay))
    .composite([{
      input: logoBuffer,
      top: Math.round(H / 2 - 200),
      left: Math.round(W / 2 - 100),
    }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(OUT_OG);

  console.log(`og-image.jpg u krijua (${(fs.statSync(OUT_OG).size / 1024).toFixed(1)} KB)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
