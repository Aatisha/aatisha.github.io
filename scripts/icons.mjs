// Makes the site's icons from site/public/favicon.svg (the AC mark): run `npm run icons` after
// changing the SVG, then commit what it writes to site/public/.
//   favicon.ico           16, 32 and 48px, for browsers and tools that only ask for /favicon.ico
//   icon-192.png          the size Google prefers for search results (a multiple of 48px)
//   apple-touch-icon.png  180px, for iPhone home screens
import fs from 'node:fs';
import sharp from 'sharp';

const dir = 'site/public';
const svg = fs.readFileSync(`${dir}/favicon.svg`);
const png = (size) => sharp(svg, { density: 1200 }).resize(size, size).png().toBuffer();

await sharp(await png(192)).toFile(`${dir}/icon-192.png`);
await sharp(svg, { density: 1200 }).resize(180, 180).flatten({ background: '#ffffff' }).png().toFile(`${dir}/apple-touch-icon.png`);

// An .ico is a small directory of PNGs.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(png));
const head = Buffer.alloc(6 + 16 * sizes.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
let offset = head.length;
sizes.forEach((size, i) => {
  const at = 6 + 16 * i;
  head.writeUInt8(size, at); head.writeUInt8(size, at + 1);
  head.writeUInt16LE(1, at + 4); head.writeUInt16LE(32, at + 6);
  head.writeUInt32LE(images[i].length, at + 8); head.writeUInt32LE(offset, at + 12);
  offset += images[i].length;
});
fs.writeFileSync(`${dir}/favicon.ico`, Buffer.concat([head, ...images]));
console.log('icons: favicon.ico (16, 32, 48), icon-192.png, apple-touch-icon.png');
