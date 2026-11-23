# aatishacyrill.com

Aatisha Cyrill's portfolio. Plain HTML, CSS and JavaScript, built with [Vite](https://vite.dev) and published to GitHub Pages.

## Run it

```bash
npm install
npm run dev        # http://localhost:5180
```

The first run makes the web versions of the media (a few minutes); after that only what changed is rebuilt.

## How it's laid out

| Folder | What's in it |
| --- | --- |
| `site/` | The pages, one folder per URL: `site/minds/index.html` is `/minds/`. Shared `css/` and `js/`. |
| `site/public/` | Files served as they are: icons, share images (`og/`), small assets, `CNAME`. |
| `media/` | The original images and recordings, at full quality. Never served directly. |
| `scripts/build-media.mjs` | Makes `/media/…` for the pages from `media/`: WebP images (with a 1200px version for phones), H.264 videos that start before they've fully loaded, clips and poster frames. Output goes to `site/public/media/` and isn't committed. |
| `scripts/vite-site.mjs` | Adds to every page: canonical URL, share cards, structured data, icons and Google Analytics (live site only); writes `sitemap.xml` and `robots.txt`. |
| `site.config.mjs` | Site URL, Analytics ID, each page's share image, video clips, and the pages that stay out of production. |

A page refers to media by its web path, e.g. `/media/work/minds/problem.webp`; the build finds the original (`media/work/minds/problem.png`) and makes it.

**Internal pages.** `about-meta`, `design-system` and `carousel` work in `npm run dev` but aren't built for production.

## Publish

Pushing to `master` builds and deploys the site (`.github/workflows/deploy.yml`). In the repository's settings, Pages → Source is **GitHub Actions**.

```bash
npm run build      # the site, in dist/
npm run preview    # serve dist/ at http://localhost:5182
npm run og         # remake the share images from the served build, then commit site/public/og/
```

## The previous site

The 2025 site is kept in the `legacy` branch and the `legacy-v1` tag.
