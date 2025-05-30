import lightGallery from 'lightgallery';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgAutoplay from 'lightgallery/plugins/autoplay';
import lgZoom from 'lightgallery/plugins/zoom';
import lgFullscreen from 'lightgallery/plugins/fullscreen';

export function instantiatePlayground() {
  // HERO: Cursor Movement
  const heroTitle = document.querySelector('.playground-hero-title');
  const heroSubtitle = document.querySelector('.playground-hero-subtitle');

  document.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const deltaX = (clientX - centerX) / centerX;
    const deltaY = (clientY - centerY) / centerY;

    if (heroTitle) {
      heroTitle.style.transform = `translate(${deltaX * 10}px, ${
        deltaY * 10
      }px)`;
    }

    if (heroSubtitle) {
      heroSubtitle.style.transform = `translate(${deltaX * 5}px, ${
        deltaY * 5
      }px)`;
    }
  });

  document.querySelectorAll('[data-gallery]').forEach((gallery) => {
    lightGallery(gallery, {
      selector: 'a',
      download: false,
      thumbnail: true,
      animateThumb: false,
      showThumbByDefault: false,
      plugins: [
        lgThumbnail,
        lgAutoplay,
        lgZoom,
        lgFullscreen,
      ],
      speed: 500,
    });
  });
}
