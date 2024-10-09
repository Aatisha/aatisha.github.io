import lightGallery from 'lightgallery';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgAutoplay from 'lightgallery/plugins/autoplay';
import lgZoom from 'lightgallery/plugins/zoom';
import lgFullscreen from 'lightgallery/plugins/fullscreen';

lightGallery(document.getElementById('ssec-products-images'), {
  autoplayFirstVideo: false,
  pager: false,
  selector: '.ssec-products-thumbnail',
  galleryId: 'ssec-products-gallery',
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

document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('demoVideo');
  if (video) {
    const observerOptions = {
      root: null, // This means observing the viewport
      threshold: 0.1, // The video should be 100% in view
    };

    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && video.dataset.autoplay === 'false') {
          video.play(); // Play video when fully in view
          video.dataset.autoplay = 'true';
        } else if (!entry.isIntersecting && video.dataset.autoplay === 'true') {
          video.pause();
          // video.currentTime = 0; // Reset the video
          video.dataset.autoplay = 'false';
        }
      });
    }, observerOptions);

    // Only observe the video when it's lazy-loaded
    const lazyLoadObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          videoObserver.observe(video); // Start observing for playback when video is loaded
          lazyLoadObserver.unobserve(video); // Unobserve for lazy loading
        }
      });
    });

    lazyLoadObserver.observe(video);
  }
});
