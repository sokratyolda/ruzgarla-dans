// İkonları public/favicon.svg dosyasından üretir: npm run icons
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const svg = await readFile(new URL('../public/favicon.svg', import.meta.url));
const out = (n) => fileURLToPath(new URL(`../public/${n}`, import.meta.url));

await sharp(svg).resize(192, 192).png().toFile(out('pwa-192.png'));
await sharp(svg).resize(512, 512).png().toFile(out('pwa-512.png'));
await sharp(svg).resize(180, 180).png().toFile(out('apple-touch-icon.png'));
// Maskelenebilir ikon: kenarlarda güvenli boşluk bırakır, köşeler düz.
const inner = await sharp(svg).resize(400, 400).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#14110f' } })
  .composite([{ input: inner, top: 56, left: 56 }])
  .png()
  .toFile(out('pwa-maskable-512.png'));
console.log('İkonlar üretildi.');
