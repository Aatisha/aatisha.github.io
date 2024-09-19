import { URL_PATHS } from './constant';

// Function to check if today's date is even or odd
function getClassByDate() {
  const today = new Date();
  const date = today.getDate();
  return date % 2 === 0 ? 'cosmos-bg' : 'galaxy-bg';
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname === URL_PATHS.home) {
    const contents = Array.from(document.querySelectorAll('.other-work-card'));
    /* eslint no-param-reassign: "error" */
    contents.slice(0, 4).forEach((content) => {
      content.style.display = 'block';
    });
    const loadMore = document.querySelector('#load-more-other-work');
    loadMore.addEventListener('click', (e) => {
      e.preventDefault();
      const hiddenContents = contents.filter((content) => content.style.display !== 'block');
      /* eslint no-param-reassign: "error" */
      hiddenContents.slice(0, 2).forEach((content) => {
        content.style.display = 'block';
      });
      if ((hiddenContents.length - 2) <= 0) {
        loadMore.disabled = true;
        loadMore.style.display = 'none';
      }
    });
  }

  if (window.location.pathname === URL_PATHS.home
      || window.location.pathname === URL_PATHS.tech.home) {
    // hover effect for background animation
    const heroImage = document.getElementById('hero-image');
    const bgAnimation = document.querySelector('#bg-animation');

    heroImage.addEventListener('mouseenter', () => {
      bgAnimation.classList.add(getClassByDate());
      bgAnimation.style.display = 'block';
      document.body.classList.add('contrast-mode');
    });

    heroImage.addEventListener('mouseleave', () => {
      bgAnimation.style.display = 'none';
      document.body.classList.remove('contrast-mode');
    });
  }
});
