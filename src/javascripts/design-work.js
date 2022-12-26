import lightGallery from 'lightgallery';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgAutoplay from 'lightgallery/plugins/autoplay';

lightGallery(document.getElementById('design-work-gallery'), {
  autoplayFirstVideo: false,
  pager: false,
  galleryId: 'design-work',
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
