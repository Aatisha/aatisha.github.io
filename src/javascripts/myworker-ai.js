import lightGallery from 'lightgallery';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgAutoplay from 'lightgallery/plugins/autoplay';
import lgZoom from 'lightgallery/plugins/zoom';
import lgFullscreen from 'lightgallery/plugins/fullscreen';

// Initialize lightGallery when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const galleryElement = document.getElementById('myworker-ai-images');
  if (galleryElement) {
    lightGallery(galleryElement, {
      autoplayFirstVideo: false,
      pager: false,
      selector: '.myworker-ai-thumbnail',
      galleryId: 'myworker-ai-gallery',
      flipHorizontal: false,
      flipVertical: false,
      rotateLeft: false,
      download: false,
      plugins: [
        lgThumbnail,
        lgAutoplay,
        lgZoom,
        lgFullscreen,
      ],
      mobileSettings: {
        controls: false,
      },
    });
  }

  // White Papers Modal
  const modal = document.getElementById('white-papers-modal');
  const trigger = document.getElementById('research-papers-trigger');
  const closeBtn = document.getElementById('white-papers-modal-close');
  const overlay = document.getElementById('white-papers-modal-overlay');

  if (!modal || !trigger || !closeBtn || !overlay) {
    // eslint-disable-next-line no-console
    console.warn('White papers modal elements not found');
    return;
  }

  function openModal() {
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Open modal
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal();
    }
  });

  // Close modal
  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
  });

  overlay.addEventListener('click', closeModal);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });
});
