// Opening another page (links marked data-expand) from the home page: a white sheet settles over
// the window so its contents melt away, then the window grows to fill the screen, corners
// straightening as it goes, and the next page (plain white) opens out of it.
// With reduced motion the link just opens.
(() => {
  const win = document.querySelector('.hero__window');
  if (!win) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const MELT = 380;    // ms for the contents to melt into white
  const GROW = 900;    // ms for the window to grow to the full screen
  const OVERLAP = 180; // ms the grow starts before the melt finishes, so it all reads as one move
  let sheet = null;

  document.querySelectorAll('a[data-expand]').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (reduceMotion.matches || !('animate' in Element.prototype)) return;
      e.preventDefault();
      if (sheet) return; // already on its way

      const r = win.getBoundingClientRect();
      const { clientWidth: vw, clientHeight: vh } = document.documentElement;
      const radius = getComputedStyle(win).borderTopLeftRadius;
      const from = `inset(${r.top}px ${vw - r.right}px ${vh - r.bottom}px ${r.left}px round ${radius})`;
      const to = 'inset(0px 0px 0px 0px round 0px)';

      sheet = document.createElement('div');
      sheet.className = 'page-sheet';
      sheet.style.clipPath = from;
      document.body.append(sheet);

      sheet.animate({ opacity: [0, 1] }, { duration: MELT, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'both' });
      sheet.animate({ clipPath: [from, to] }, {
        duration: GROW,
        delay: MELT - OVERLAP,
        easing: 'cubic-bezier(0.76, 0, 0.24, 1)',
        fill: 'forwards',
      }).finished.then(() => { window.location.href = link.href; });
    });
  });

  // Coming back with the browser's Back button restores this page as it was left: lift the sheet.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && sheet) {
      sheet.remove();
      sheet = null;
    }
  });
})();
