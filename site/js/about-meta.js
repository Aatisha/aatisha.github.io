// About-meta (about-meta.html): my profile song. The pill under the bio plays the song's preview
// from its data-song-start (in seconds), looping back there at the end; a second tap pauses it.
// Its bars dance while it plays.
(() => {
  const song = document.querySelector('[data-song]');
  if (!song) return;
  const chip = song.querySelector('[data-song-toggle]');
  const audio = song.querySelector('[data-song-audio]');
  const start = Number(audio.dataset.songStart) || 0;

  const setPlaying = (playing) => {
    song.classList.toggle('is-playing', playing);
    chip.setAttribute('aria-pressed', String(playing));
    chip.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} Sailor Song by Gigi Perez`);
  };

  audio.addEventListener('playing', () => setPlaying(true));
  audio.addEventListener('pause', () => setPlaying(false));
  audio.addEventListener('ended', () => {
    audio.currentTime = start;
    audio.play().catch(() => setPlaying(false));
  });

  chip.addEventListener('click', () => {
    if (audio.paused) {
      if (audio.currentTime < start) audio.currentTime = start;
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  });
})();
