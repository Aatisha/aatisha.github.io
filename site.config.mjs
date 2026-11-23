// One place for what the build needs to know about the site.
export default {
  url: 'https://aatishacyrill.com',
  name: 'Aatisha Cyrill',
  role: 'Product Designer',
  // Google Analytics 4 (the same property as the previous site). Added to production builds only.
  analytics: 'G-6V3R2CPPKF',
  themeColor: '#0f1f1e',
  sameAs: ['https://www.linkedin.com/in/aatisha-cyrill/', 'https://github.com/Aatisha'],

  // Pages that stay in the code but never ship: not built, not in the sitemap, not linked.
  devOnly: ['about-meta', 'design-system', 'carousel'],

  // Each page's share image (1200×630, made by `npm run og` into site/public/og/) and its kind.
  // Titles and descriptions come from each page's own <title> and <meta name="description">.
  pages: {
    '': { og: 'home', type: 'website' },
    about: { og: 'about', type: 'profile' },
    playground: { og: 'playground', type: 'website' },
    postcard: { og: 'postcard', type: 'website' },
    minds: { og: 'minds', type: 'article' },
    'myworker.ai': { og: 'myworker', type: 'article' },
    'amazon-shopbop': { og: 'shopbop', type: 'article' },
    'ssec-products': { og: 'ssec', type: 'article' },
    'sustainable-ux': { og: 'sustain', type: 'article' },
  },

  // Clips cut from longer recordings: /media/clips/<page>/<name>.mp4 ← a stretch of an original.
  clips: {
    'shopbop/choose': { src: 'work/amazon-shopbop/final-demo.mp4', start: 16, duration: 11 },
    'shopbop/rank': { src: 'work/amazon-shopbop/final-demo.mp4', start: 27, duration: 15 },
    'shopbop/trending': { src: 'work/amazon-shopbop/final-demo.mp4', start: 43, duration: 7 },
    'shopbop/shop': { src: 'work/amazon-shopbop/final-demo.mp4', start: 50, duration: 21 },
    'ssec/hero': { src: 'work/ssec-products/demo.mp4', start: 0, duration: 11 },
    'ssec/compare': { src: 'work/ssec-products/demo.mp4', start: 12.5, duration: 3.6 },
    'ssec/zoom': { src: 'work/ssec-products/demo.mp4', start: 15.5, duration: 12 },
    'ssec/winds': { src: 'work/ssec-products/demo.mp4', start: 30.5, duration: 8 },
  },
};
