// Case study (minds.html): the section index follows along as you read, marking the section in
// view; and the before/after homepage slider, where dragging the range reveals more of either.
(() => {
  const links = [...document.querySelectorAll('.cs-index a')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const byId = new Map(links.map((a) => [a.hash.slice(1), a]));
  const visible = new Set();

  const mark = () => {
    // The first section (in page order) that's on screen is the one being read.
    const current = links.find((a) => visible.has(a.hash.slice(1)));
    if (!current) return;
    links.forEach((a) => {
      if (a === current) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) visible.add(target.id);
      else visible.delete(target.id);
    });
    mark();
  }, { rootMargin: '-35% 0px -55% 0px' });

  byId.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
})();

document.querySelectorAll('[data-compare]').forEach((compare) => {
  const range = compare.querySelector('input[type="range"]');
  const set = () => compare.style.setProperty('--split', `${range.value}%`);
  range.addEventListener('input', set);
  set();
});
