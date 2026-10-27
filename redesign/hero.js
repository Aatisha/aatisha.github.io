// In cutout mode, lays the SVG paper-cut letters exactly over the (transparent) HTML title.
// Positions are written as attributes (not CSS) because browsers don't reliably
// repaint SVG masks when only styles change.
(() => {
  const heading = document.querySelector('.hero__title');
  const cut = document.querySelector('.hero__cut text');
  const paper = document.querySelector('.hero__paper');
  if (!heading || !cut || !paper) return;

  // An empty inline-block sits on the text baseline, so its position gives the baseline exactly.
  const marker = document.createElement('span');
  marker.setAttribute('aria-hidden', 'true');
  marker.style.cssText = 'display:inline-block;width:0;height:0;';
  heading.append(marker);

  const align = () => {
    cut.setAttribute('y', marker.getBoundingClientRect().top - paper.getBoundingClientRect().top);
  };

  new ResizeObserver(align).observe(heading);
  document.fonts.ready.then(align);
  align();
})();
