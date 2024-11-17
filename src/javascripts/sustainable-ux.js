import lightGallery from 'lightgallery';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgAutoplay from 'lightgallery/plugins/autoplay';
import lgZoom from 'lightgallery/plugins/zoom';
import lgFullscreen from 'lightgallery/plugins/fullscreen';

lightGallery(document.getElementById('sustainable-ux-images'), {
  autoplayFirstVideo: false,
  pager: false,
  selector: '.sustainable-ux-thumbnail',
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
