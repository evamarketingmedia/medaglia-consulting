/**
 * One-off: resized derivatives of the REAL client portrait (public/images/alberto-medaglia.png).
 * The original is only READ, never modified. Output: NEW files next to it (AVIF, WebP and a
 * JPEG fallback at 640 / 960 / 1385 px wide). Resize only: no crop, no retouching, no
 * generated content. Crops on the page are done with CSS object-fit / object-position.
 * Run: node scripts/make-portrait-derivatives.mjs (uses the `sharp` copy that ships with Astro).
 */
import sharp from 'sharp';
import { statSync } from 'node:fs';

const SRC = 'public/images/alberto-medaglia.png';
const OUT = 'public/images/alberto-medaglia';
const WIDTHS = [640, 960, 1385];

for (const w of WIDTHS) {
  const base = sharp(SRC).resize({ width: w, withoutEnlargement: true });
  await base.clone().avif({ quality: 55, effort: 6 }).toFile(`${OUT}-${w}.avif`);
  await base.clone().webp({ quality: 78, effort: 6 }).toFile(`${OUT}-${w}.webp`);
  await base.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(`${OUT}-${w}.jpg`);
  for (const ext of ['avif', 'webp', 'jpg']) {
    console.log(`${OUT}-${w}.${ext}`, Math.round(statSync(`${OUT}-${w}.${ext}`).size / 1024), 'KB');
  }
}
