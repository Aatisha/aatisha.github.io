import lightGallery from 'lightgallery';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgAutoplay from 'lightgallery/plugins/autoplay';
import lgZoom from 'lightgallery/plugins/zoom';
import lgFullscreen from 'lightgallery/plugins/fullscreen';
import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/swiper.min.css';
import 'swiper/modules/pagination.min.css';
import 'swiper/modules/navigation.min.css';

// eslint-disable-next-line no-new
new Swiper('.swiper', {
  spaceBetween: 30,
  centeredSlides: true,
  autoplay: {
    delay: 5000,
    disableOnInteraction: false,
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  modules: [Navigation, Pagination, Autoplay],
});

lightGallery(document.getElementById('rover-usability-images'), {
  autoplayFirstVideo: false,
  pager: false,
  selector: '.rover-usability-thumbnail',
  galleryId: 'rover-usability-gallery',
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
