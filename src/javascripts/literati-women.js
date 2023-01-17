import lightGallery from 'lightgallery';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgAutoplay from 'lightgallery/plugins/autoplay';

lightGallery(document.getElementById('literati-women-screenshots'), {
  autoplayFirstVideo: false,
  pager: false,
  selector: 'a',
  galleryId: 'literati-women-gallery',
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
