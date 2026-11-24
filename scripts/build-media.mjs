// Makes the web versions of the site's media, from the originals in media/.
//
// The pages ask for files under /media/… and this builds exactly those, into site/public/media/ (not
// committed; Vite serves it in development and copies it into the build):
//   /media/<path>.webp          ← media/<path>.{png,jpg,jpeg,webp}  WebP, up to 2400px wide, transparency kept;
//                                  plus <path>-1200.webp when the original is wider, for srcset
//   /media/<path>@<w>.webp      ← the same, at most <w>px wide, for images that are always shown small
//   /media/<path>.mp4           ← media/<path>.{mp4,mov}            H.264 at native size (up to 2560px wide),
//                                  near-lossless, no audio, starts playing before it has fully loaded
//   /media/clips/<page>/<n>.mp4 ← a stretch of a longer original (site.config.mjs `clips`)
//   /media/<path>.poster.jpg    ← a frame of the matching video
// Each output is rebuilt only when its original or the settings change, so after the first run
// (and in CI, where site/public/media and .media-cache are cached) it takes seconds.
import { createHash } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import ffmpeg from 'ffmpeg-static';
import config from '../site.config.mjs';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = path.join(ROOT, 'site');
const MEDIA = path.join(ROOT, 'media');
const CACHE = path.join(ROOT, '.media-cache');
const OUT = path.join(SITE, 'public', 'media');
const META = path.join(CACHE, 'meta.json');
// Bump to rebuild that kind of output after changing how it's made (images: 4 = turned upright).
const VERSION = { image: 4, video: 3 };
const IMG = { maxWidth: 2400, small: 1200, quality: 86 };
const VID = { maxWidth: 2560, crf: 20, preset: 'slow', posterAt: 0.4 };

// Every file under `dir`, skipping folders named in `skip`.
const files = async (dir, skip = []) => {
  const found = [];
  for (const d of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) { if (!skip.includes(d.name)) found.push(...await files(p, skip)); } else found.push(p);
  }
  return found;
};
const hashFile = (p) => new Promise((ok, no) => {
  const h = createHash('sha1'); createReadStream(p).on('data', (d) => h.update(d)).on('end', () => ok(h.digest('hex'))).on('error', no);
});
const firstExisting = (stem, exts) => exts.map((e) => stem + e).find((p) => existsSync(p));

// ---------- What the pages ask for ----------
const wanted = new Set();
for (const f of await files(SITE, ['public'])) {
  if (!/\.(html|css|js)$/.test(f)) continue;
  for (const m of (await fs.readFile(f, 'utf8')).matchAll(/\/media\/[A-Za-z0-9_.\/@-]+\.(?:webp|mp4|jpg)/g)) wanted.add(m[0]);
}

// ---------- Jobs ----------
const jobs = [];
const missing = [];
for (const url of [...wanted].sort()) {
  const rel = url.slice('/media/'.length);
  if (rel.endsWith('.poster.jpg')) {
    jobs.push({ kind: 'poster', url, video: '/media/' + rel.replace(/\.poster\.jpg$/, '.mp4') });
  } else if (rel.endsWith('.mp4') && rel.startsWith('clips/')) {
    const clip = config.clips[rel.slice(6, -4)];
    if (!clip) { missing.push(url); continue; }
    jobs.push({ kind: 'video', url, src: path.join(MEDIA, clip.src), start: clip.start, duration: clip.duration });
  } else if (rel.endsWith('.mp4')) {
    const src = firstExisting(path.join(MEDIA, rel.slice(0, -4)), ['.mp4', '.mov']);
    if (!src) { missing.push(url); continue; }
    jobs.push({ kind: 'video', url, src });
  } else if (rel.endsWith('.webp')) {
    const [, stem, max] = rel.match(/^(.*?)(?:@(\d+))?\.webp$/);
    const src = firstExisting(path.join(MEDIA, stem), ['.png', '.jpg', '.jpeg', '.webp', '.PNG', '.JPG']);
    if (!src) { missing.push(url); continue; }
    jobs.push({ kind: 'image', url, src, max: max && Number(max) });
  } else missing.push(url);
}
if (missing.length) {
  console.error(`media: no original for\n  ${missing.join('\n  ')}`);
  process.exit(1);
}

// ---------- Build ----------
const meta = existsSync(META) ? JSON.parse(await fs.readFile(META, 'utf8')) : {};
const next = {};
const out = (url) => path.join(OUT, url.slice('/media/'.length));
let built = 0;

async function image(job, key) {
  // Phone photos often store "turn 90°" as a tag rather than in the pixels, and WebP drops the tag,
  // so each image is turned upright first (.rotate() with no angle) and measured the way it's seen.
  const meta = await sharp(job.src, { limitInputPixels: false }).metadata();
  const sideways = meta.orientation >= 5;
  const [width, height] = sideways ? [meta.height, meta.width] : [meta.width, meta.height];
  const w = Math.min(width, job.max || IMG.maxWidth);
  await fs.mkdir(path.dirname(out(job.url)), { recursive: true });
  const upright = () => sharp(job.src, { limitInputPixels: false }).rotate();
  const enc = (s) => s.webp({ quality: IMG.quality, alphaQuality: 100, effort: 5, smartSubsample: true });
  await enc(upright().resize({ width: w, withoutEnlargement: true })).toFile(out(job.url));
  const entry = { key, width: w, height: Math.round((height * w) / width) };
  if (!job.max && w > IMG.small * 1.2) {
    const smallUrl = job.url.replace(/\.webp$/, `-${IMG.small}.webp`);
    await enc(upright().resize({ width: IMG.small })).toFile(out(smallUrl));
    entry.small = { url: smallUrl, width: IMG.small };
  }
  return entry;
}

async function video(job, key) {
  await fs.mkdir(path.dirname(out(job.url)), { recursive: true });
  const trim = job.start != null ? ['-ss', String(job.start), '-t', String(job.duration)] : [];
  await run(ffmpeg, ['-y', '-v', 'error', ...trim, '-i', job.src, '-an',
    '-vf', `scale='min(${VID.maxWidth},iw)':-2:flags=lanczos`,
    '-c:v', 'libx264', '-preset', VID.preset, '-crf', String(VID.crf), '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-tag:v', 'avc1', '-movflags', '+faststart', out(job.url)], { maxBuffer: 1 << 26 });
  return { key };
}

async function poster(job, key) {
  await fs.mkdir(path.dirname(out(job.url)), { recursive: true });
  await run(ffmpeg, ['-y', '-v', 'error', '-ss', String(VID.posterAt), '-i', out(job.video), '-frames:v', '1', '-q:v', '3', out(job.url)]);
  return { key };
}

// Images in parallel, videos one at a time (ffmpeg already uses every core), posters after their videos.
const order = { image: 0, video: 1, poster: 2 };
jobs.sort((a, b) => order[a.kind] - order[b.kind]);
const sourceKey = new Map();
const keyFor = async (job) => {
  if (job.kind === 'poster') return `${VERSION.video}:${next[job.video]?.key}`;
  if (!sourceKey.has(job.src)) sourceKey.set(job.src, await hashFile(job.src));
  return `${VERSION[job.kind]}:${sourceKey.get(job.src)}:${job.start ?? ''}:${job.duration ?? ''}:${JSON.stringify(job.kind === 'image' ? IMG : VID)}`;
};
const doJob = async (job) => {
  const key = await keyFor(job);
  if (meta[job.url]?.key === key && existsSync(out(job.url))) { next[job.url] = meta[job.url]; return; }
  const t = Date.now();
  next[job.url] = await ({ image, video, poster })[job.kind](job, key);
  built += 1;
  console.log(`media: ${job.url}  (${((Date.now() - t) / 1000).toFixed(1)}s)`);
};
const images = jobs.filter((j) => j.kind === 'image');
for (let i = 0; i < images.length; i += 6) await Promise.all(images.slice(i, i + 6).map(doJob));
for (const job of jobs.filter((j) => j.kind !== 'image')) await doJob(job);

// Remove outputs nothing asks for any more.
const keep = new Set(Object.entries(next).flatMap(([u, e]) => [out(u), e.small && out(e.small.url)]).filter(Boolean));
if (existsSync(OUT)) for (const f of await files(OUT)) if (!keep.has(f)) await fs.rm(f);
await fs.mkdir(CACHE, { recursive: true });
await fs.writeFile(META, JSON.stringify(next, null, 1));
console.log(`media: ${jobs.length} files ready (${built} built)`);
