// The site is plain HTML, CSS and JavaScript in site/, one folder per page so every URL is clean
// (/minds/, /myworker.ai/, …). Vite serves it in development and builds it for production:
// minified, cache-busted CSS and JS, three.js bundled for the About page, and the head of every page
// filled in with search and sharing tags (scripts/vite-site.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import config from './site.config.mjs';
import site from './scripts/vite-site.mjs';

const root = path.resolve('site');

// Every page: site/**/index.html (route = its folder) and the 404 page.
const pages = (dir = root) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const p = path.join(dir, d.name);
  if (d.isDirectory()) return d.name === 'public' ? [] : pages(p);
  return d.name === 'index.html' || (dir === root && d.name === '404.html') ? [p] : [];
});

export default defineConfig(({ command }) => {
  const production = command === 'build';
  const input = {};
  for (const file of pages()) {
    const route = path.relative(root, path.dirname(file));
    if (production && config.devOnly.includes(route)) continue;   // About-meta and the internal pages never ship
    input[path.relative(root, file).replace(/\.html$/, '') || 'index'] = file;
  }
  return {
    root,
    publicDir: 'public',
    appType: 'mpa',
    server: { port: 5180, strictPort: true },
    preview: { port: 5182, strictPort: true },
    build: {
      outDir: path.resolve('dist'),
      emptyOutDir: true,
      assetsDir: 'static',             // built CSS and JS, apart from the site's own /assets and /media
      target: 'es2020',
      rollupOptions: { input },
    },
    plugins: [site({ production })],
  };
});
