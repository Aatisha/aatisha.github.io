import lightGallery from 'lightgallery';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgAutoplay from 'lightgallery/plugins/autoplay';

lightGallery(document.getElementById('ux-research-images'), {
  autoplayFirstVideo: false,
  pager: false,
  selector: 'a',
  galleryId: 'ux-research-gallery',
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
