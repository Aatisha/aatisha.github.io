// Makes each page's share image (what shows when a link is pasted into LinkedIn, Slack, iMessage…):
// the top of the page, as a visitor first sees it, at 1200×630. Run it after a visual change with the
// built site being served (`npm run build && npm run preview`), then commit site/public/og/.
//   npm run og                         uses http://localhost:5182
//   npm run og -- http://localhost:5180
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import config from '../site.config.mjs';

const run = promisify(execFile);
const base = (process.argv[2] || 'http://localhost:5182').replace(/\/$/, '');
const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = path.resolve('site/public/og');
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'og-'));
await fs.mkdir(out, { recursive: true });

for (const [route, { og }] of Object.entries(config.pages)) {
  const shot = path.join(tmp, `${og}.png`);
  await run(chrome, ['--headless=new', '--hide-scrollbars', '--mute-audio', '--force-device-scale-factor=2',
    '--window-size=1200,630', '--force-prefers-reduced-motion', '--virtual-time-budget=9000', `--user-data-dir=${path.join(tmp, 'profile')}`,
    `--screenshot=${shot}`, `${base}/${route ? route + '/' : ''}`]);
  await sharp(shot).resize(1200, 630, { fit: 'cover', position: 'top' }).jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(out, `${og}.jpg`));
  console.log(`og: ${og}.jpg`);
}
await fs.rm(tmp, { recursive: true, force: true });
