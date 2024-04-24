import lightGallery from 'lightgallery';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgAutoplay from 'lightgallery/plugins/autoplay';

lightGallery(document.getElementById('sustainable-ux-screenshots'), {
  autoplayFirstVideo: false,
  pager: false,
  selector: '.sustainable-ux-thumbnail',
  galleryId: 'sustainable-ux-gallery',
  flipHorizontal: false,
  flipVertical: false,
  rotateLeft: false,
  download: false,
  plugins: [
    lgThumbnail,
    lgAutoplay,
  ],
  mobileSettings: {
    controls: false,
  },
});
