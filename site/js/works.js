// Work (index.html): each case study's clip plays, muted and looping, only while it's on screen;
// and with a mouse, a "Read case study" label follows the pointer over the picture.
// With reduced motion the clips stay on their poster frame and the label sits still.
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const videos = document.querySelectorAll('.works video[data-autoplay]');
  if (videos.length && 'IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) target.play().catch(() => {});
        else target.pause();
      });
    }, { threshold: 0.25 });
    videos.forEach((video) => observer.observe(video));
  }

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll('.case-card__media').forEach((media) => {
    const label = media.querySelector('.case-card__cursor');
    if (!label) return;
    media.classList.add('has-cursor');
    media.addEventListener('pointermove', (e) => {
      const r = media.getBoundingClientRect();
      label.style.translate = `${e.clientX - r.left}px ${e.clientY - r.top}px`;
    });
  });
})();
