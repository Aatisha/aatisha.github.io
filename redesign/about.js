// About page: blocks marked [data-reveal] drift up and come into focus as they scroll into view,
// using the same soft entrance as the home page text. Without the script (or with reduced motion)
// everything simply shows.
(() => {
  const blocks = document.querySelectorAll('[data-reveal]');
  if (!blocks.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.documentElement.classList.add('has-reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-shown');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  blocks.forEach((el) => observer.observe(el));
})();
