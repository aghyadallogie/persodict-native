// Renders the Persodict logo (same geometry as src/components/ui/logo.tsx) into the
// app icon, Android adaptive icon, splash and favicon PNGs under assets/images.
//
//   npm i --no-save sharp && node scripts/generate-icons.mjs
//
// sharp is deliberately not a dependency; it is only needed when the logo changes.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/images');

const GOLD_LIGHT = '#CDB478';
const GOLD_DARK = '#8C7440';
const CREAM = '#F4EBD3';
const INK = '#1F2020';

// Logo artwork spans x 14..108, y 24..108 in the 120-unit logo space.
const ART_CENTER = { x: 61, y: 66 };

const gradient = `
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${GOLD_LIGHT}"/>
    <stop offset="1" stop-color="${GOLD_DARK}"/>
  </linearGradient>`;

const artwork = `
  <rect x="54" y="24" width="54" height="40" rx="14" fill="${CREAM}"/>
  <path d="M96 64 L102 78 L82 64 Z" fill="${CREAM}"/>
  <rect x="66" y="33" width="30" height="5" rx="2.5" fill="${GOLD_DARK}"/>
  <rect x="66" y="41" width="20" height="5" rx="2.5" fill="${GOLD_DARK}" opacity="0.55"/>
  <rect x="14" y="48" width="58" height="46" rx="15" fill="${INK}"/>
  <path d="M26 94 L20 108 L42 94 Z" fill="${INK}"/>
  <path d="M34 83 V59 H44 a9.5 9.5 0 0 1 0 19 H34" fill="none" stroke="${CREAM}"
        stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;

// Alpha-only version for Android themed icons: cut-outs instead of colors.
const monoArtwork = `
  <defs>
    <mask id="back" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
      <rect width="120" height="120" fill="black"/>
      <rect x="54" y="24" width="54" height="40" rx="14" fill="white"/>
      <path d="M96 64 L102 78 L82 64 Z" fill="white"/>
      <rect x="66" y="33" width="30" height="5" rx="2.5" fill="black"/>
      <rect x="66" y="41" width="20" height="5" rx="2.5" fill="black"/>
      <rect x="14" y="48" width="58" height="46" rx="15" fill="black" stroke="black" stroke-width="8"/>
    </mask>
    <mask id="front" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
      <rect width="120" height="120" fill="black"/>
      <rect x="14" y="48" width="58" height="46" rx="15" fill="white"/>
      <path d="M26 94 L20 108 L42 94 Z" fill="white"/>
      <path d="M34 83 V59 H44 a9.5 9.5 0 0 1 0 19 H34" fill="none" stroke="black"
            stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </mask>
  </defs>
  <rect width="120" height="120" fill="white" mask="url(#back)"/>
  <rect width="120" height="120" fill="white" mask="url(#front)"/>`;

const place = (scale) =>
  `translate(${512 - ART_CENTER.x * scale} ${512 - ART_CENTER.y * scale}) scale(${scale})`;

const canvas = (inner, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
     <defs>${defs}</defs>${inner}
   </svg>`;

const files = {
  // Full-bleed square; the OS applies its own corner mask.
  'icon.png': canvas(
    `<rect width="1024" height="1024" fill="url(#g)"/><g transform="${place(6.2)}">${artwork}</g>`,
    gradient,
  ),
  'android-icon-background.png': canvas(`<rect width="1024" height="1024" fill="url(#g)"/>`, gradient),
  // Adaptive icons are masked to a ~66% safe zone, so keep the artwork smaller.
  'android-icon-foreground.png': canvas(`<g transform="${place(5.2)}">${artwork}</g>`),
  'android-icon-monochrome.png': canvas(`<g transform="${place(5.2)}">${monoArtwork}</g>`),
  // Splash + favicon use the rounded badge exactly as it appears on the login screen.
  'splash-icon.png': `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 120 120">
      <defs>${gradient}</defs>
      <rect x="4" y="4" width="112" height="112" rx="28" fill="url(#g)"/>${artwork}
    </svg>`,
};
files['favicon.png'] = files['splash-icon.png'];

for (const [name, svg] of Object.entries(files)) {
  const size = name === 'favicon.png' ? 48 : 1024;
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(OUT, name));
  console.log(`wrote ${name} (${size}x${size})`);
}
