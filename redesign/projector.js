// The about page's slide projector: a 1970s carousel projector and tripod screen in 3D, standing
// on the page beside the intro (projector-scene.js and projector-model.js, built on Three.js) and
// showing the photos listed in the stage's .projector__slides. This just loads it, a moment after
// the page has drawn, and falls back to a still photo where WebGL isn't available or the 3D can't load.
(() => {
  const stage = document.querySelector('.projector-stage');
  if (!stage) return;

  const still = (err) => {
    if (err) console.warn('Slide projector: showing a still photo instead.', err);
    stage.classList.add('is-fallback');
    (stage.closest('.about-intro') || stage).classList.add('is-fallback');
  };

  const probe = document.createElement('canvas').getContext('webgl2');
  if (!probe) {
    still();
    return;
  }
  const lose = probe.getExtension('WEBGL_lose_context');
  if (lose) lose.loseContext();

  const later = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
  import('./projector-scene.js')
    .then((scene) => later(() => {
      try { scene.mount(stage); } catch (err) { still(err); }
    }, { timeout: 1500 }))
    .catch(still);
})();
