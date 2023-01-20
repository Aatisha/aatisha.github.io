import lightGallery from 'lightgallery';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgAutoplay from 'lightgallery/plugins/autoplay';

lightGallery(document.getElementById('image-gallery'), {
  autoplayFirstVideo: false,
  pager: false,
  selector: 'a',
  galleryId: 'photographed-images',
  flipHorizontal: false,
  flipVertical: false,
  rotateLeft: false,
  download: false,
  plugins: [lgThumbnail, lgAutoplay],
  mobileSettings: {
    controls: false,
  },
});
