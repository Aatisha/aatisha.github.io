// What every page gets on top of its own HTML, so the pages themselves stay plain:
//   - search and sharing: canonical URL, Open Graph and Twitter cards (title and description from the
//     page's own <title> and <meta name="description">, image from site/public/og/), structured data
//   - icons and theme colour
//   - Google Analytics, in production builds only
//   - responsive images: a 1200px version alongside each large /media image (from the media build)
// and, in production, the sitemap and robots.txt.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import config from '../site.config.mjs';

const META = path.resolve('.media-cache/meta.json');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const unesc = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

// '/minds/index.html' -> 'minds', '/index.html' -> '', '/404.html' -> '404'
const routeOf = (p) => p.replace(/^\//, '').replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '');
const urlOf = (route) => `${config.url}/${route ? route + '/' : ''}`;
const fileOf = (route) => path.resolve('site', route, 'index.html');

// When a page's file was first committed and last changed, from git (full ISO dates). The deploy
// checks out the whole history so these are real; outside git they're simply left out.
const git = (...args) => {
  try { return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; }
};
const datesOf = (route) => {
  const file = path.relative(process.cwd(), fileOf(route));
  const added = git('log', '--follow', '--diff-filter=A', '--format=%cI', '--', file).split('\n').filter(Boolean).pop();
  const changed = git('log', '-1', '--format=%cI', '--', file);
  return { published: added || undefined, modified: changed || undefined };
};

function head(html, route, production) {
  const page = config.pages[route];
  const title = unesc(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? config.name);
  const description = unesc(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '');
  // A page may give its share card a longer description than search gets.
  const ownShare = html.match(/<meta property="og:description" content="([^"]*)"/)?.[1];
  const share = ownShare ? unesc(ownShare) : description;
  const tags = [];
  const meta = (attr, key, content) => tags.push(`<meta ${attr}="${key}" content="${esc(content)}">`);

  meta('name', 'theme-color', config.themeColor);
  tags.push('<link rel="icon" href="/favicon.svg" type="image/svg+xml">');
  tags.push('<link rel="icon" href="/favicon.ico" sizes="32x32">');
  tags.push('<link rel="apple-touch-icon" href="/apple-touch-icon.png">');

  if (!page) {
    // The 404 page, and the internal pages while developing: never indexed.
    meta('name', 'robots', 'noindex');
  } else {
    const url = urlOf(route);
    const image = `${config.url}/og/${page.og}.jpg`;
    tags.push(`<link rel="canonical" href="${url}">`);
    meta('property', 'og:type', page.type === 'article' ? 'article' : page.type === 'profile' ? 'profile' : 'website');
    meta('property', 'og:site_name', config.name);
    meta('property', 'og:title', title);
    if (!ownShare) meta('property', 'og:description', share);
    meta('property', 'og:url', url);
    meta('property', 'og:image', image);
    meta('property', 'og:image:width', '1200');
    meta('property', 'og:image:height', '630');
    meta('property', 'og:image:alt', title);
    meta('property', 'og:locale', 'en_US');
    meta('name', 'twitter:card', 'summary_large_image');
    meta('name', 'twitter:title', title);
    meta('name', 'twitter:description', share);
    meta('name', 'twitter:image', image);

    const person = { '@type': 'Person', name: config.name, jobTitle: config.role, url: urlOf(''), sameAs: config.sameAs };
    const { published, modified } = page.type === 'article' ? datesOf(route) : {};
    const data = page.type === 'article'
      ? { '@context': 'https://schema.org', '@type': 'Article', headline: title.replace(/ — .*$/, ''), description, image, url, datePublished: published, dateModified: modified, author: person, publisher: person }
      : route === ''
        ? { '@context': 'https://schema.org', '@type': 'WebSite', name: config.name, url, description, author: person }
        : page.type === 'profile'
          ? { '@context': 'https://schema.org', '@type': 'ProfilePage', url, description, mainEntity: person }
          : { '@context': 'https://schema.org', '@type': 'WebPage', name: title, url, description, author: person };
    tags.push(`<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`);
  }

  // Analytics loads only on the live site, so previews of a build aren't counted as visits.
  if (production && config.analytics) {
    const id = config.analytics, host = new URL(config.url).hostname;
    tags.push(`<script>if(location.hostname==='${host}'||location.hostname==='www.${host}'){var g=document.createElement('script');g.async=true;g.src='https://www.googletagmanager.com/gtag/js?id=${id}';document.head.appendChild(g);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments);};gtag('js',new Date());gtag('config','${id}');}</script>`);
  }
  return tags.map((t) => '  ' + t).join('\n');
}

// <img src="/media/x.webp"> with a 1200px version -> srcset, so phones and small windows load the smaller file.
function srcset(html) {
  if (!fs.existsSync(META)) return html;
  const media = JSON.parse(fs.readFileSync(META, 'utf8'));
  return html.replace(/<img\b[^>]*>/g, (tag) => {
    const src = tag.match(/\ssrc="(\/media\/[^"]+\.webp)"/)?.[1];
    const entry = src && media[src];
    if (!entry?.small || /\ssrcset=/.test(tag)) return tag;
    const sizes = /\sloading="lazy"/.test(tag) ? 'auto, 100vw' : '100vw';
    let out = tag.replace(/\s*\/?>$/, ` srcset="${entry.small.url} ${entry.small.width}w, ${src} ${entry.width}w" sizes="${sizes}">`);
    if (!/\sdecoding=/.test(out)) out = out.replace(/^<img/, '<img decoding="async"');
    return out;
  });
}

export default function site({ production }) {
  let outDir;
  return {
    name: 'site',
    configResolved(c) { outDir = c.build.outDir; },
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const route = routeOf(ctx.path);
        html = html.replace(/<\/title>/, `</title>\n${head(html, route, production)}`);
        return srcset(html);
      },
    },
    closeBundle() {
      if (!production) return;
      // Each page's own last change, so a deploy only marks the pages that really changed.
      const urls = Object.keys(config.pages).map((r) => {
        const day = datesOf(r).modified?.slice(0, 10);
        const lastmod = day ? `<lastmod>${day}</lastmod>` : '';
        return `  <url><loc>${urlOf(r)}</loc>${lastmod}<priority>${r === '' ? '1.0' : config.pages[r].type === 'article' ? '0.8' : '0.6'}</priority></url>`;
      });
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
      fs.writeFileSync(path.join(outDir, 'robots.txt'),
        `User-agent: *\nAllow: /\n\nSitemap: ${config.url}/sitemap.xml\n`);
    },
  };
}
