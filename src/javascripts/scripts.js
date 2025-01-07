import Swiper from 'swiper';
import VanillaTilt from 'vanilla-tilt';
import {
  removeContentByIdAfter, stringInject, removeTags, getFirstNWords, isEqualURLs,
  removeTrailingSlash, getAdjacentItems,
  delay,
} from './utilities';
import './home';
import './design-work';
import './online-assessment';
import './deal-management';
import './literati-women';
import './ux-research';
import './contact';
import './sustainable-ux';
import './ssec-products';
import './rover-usability';
import './project-hero-bg-animation';
import {
  BlogTemplateProperties, BLOG_CARD_TEMPLATE, MEDIUM_USERNAME,
  STARRED_BLOG_ID, DESIGN_URLS, DEV_URLS, DESIGN_ARTICLE_NAVS, DEV_ARTICLE_NAVS, URL_PATHS,
} from './constant';
import { FluidApp } from './components/fluid-effect/FluidApp';

// function reveal() {
//   const reveals = document.querySelectorAll('.reveal');
//   reveals.forEach((element) => {
//     const windowheight = window.innerHeight;
//     const revealTop = element.getBoundingClientRect().top;
//     const revealPoint = 0;

//     if (revealTop < windowheight - revealPoint) {
//       element.classList.add('show-item');
//     } else {
//       element.classList.remove('show-item');
//     }
//   });
// }

function switchNavigation() {
  const navbar = document.getElementById('navigation-bar');
  const navbarHeight = navbar.offsetHeight;
  const heroSection = document.querySelector('.hero-section');
  const { scrollY } = window;
  const logoDot = document.getElementById('logo-dot');
  if (scrollY >= heroSection.offsetHeight - navbarHeight - 30) {
    navbar.classList.add('nav-fixed');
    logoDot.dataset.animate = 'true';
  } else {
    navbar.classList.remove('nav-fixed');
    logoDot.dataset.animate = 'false';
  }
}

function updateActiveNavigation() {
  const currentURL = window.location.href;
  const navLinks = document
    .getElementById('nav-links')
    .getElementsByTagName('a');
  Array.from(navLinks).forEach((link) => {
    if (isEqualURLs(link.href, currentURL)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// if (window.location.pathname === URL_PATHS.home
//     || window.location.pathname === URL_PATHS.about
//     || window.location.pathname === URL_PATHS.tech.home) {
//   const resumeDownloadBtn = document.getElementById('resume-btn-download');
//   resumeDownloadBtn.addEventListener('click', () => {
//     resumeDownloadBtn.classList.toggle('downloaded');
//     setTimeout(() => {
//       resumeDownloadBtn.classList.toggle('downloaded');
//     }, 5000);
//   });
// }

const hamburger = document.getElementById('hamburger');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    document.getElementById('nav-hamburger').classList.toggle('collapsed');
    document.getElementById('navigation-bar').classList.toggle('u-heightAuto');
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.toggle('expanded');
    const navWrapper = document.getElementsByClassName('pretty-nav-wrapper')[0];
    navWrapper.classList.toggle('u-marginT4');
    navWrapper.classList.toggle('u-heightAuto');
    if (navLinks.classList.contains('expanded')) {
      document.getElementById('logo-dot').dataset.animate = 'true';
    }
  });
}

function instantiateSwiper() {
  // eslint-disable-next-line no-unused-vars
  const swiper = new Swiper('.blog-slider', {
    spaceBetween: 30,
    effect: 'fade',
    loop: false,
    mousewheel: {
      invert: false,
    },
    // autoHeight: true,
    pagination: {
      el: '.blog-slider__pagination',
      clickable: true,
    },
  });
}

function customBlogSort(a, b) {
  // Keep the object with the specific ID at the first position
  if (a.guid.includes(STARRED_BLOG_ID)) return -1;
  if (b.guid.includes(STARRED_BLOG_ID)) return 1;

  // Sort by pubDate for other objects
  return new Date(b.pubDate) - new Date(a.pubDate);
}

function addBlogDetailsToDom(blogDetails) {
  const blogSection = document.getElementById('blog-section');
  const blogWrapper = document.getElementById('blog-wrapper');
  if (blogSection && blogWrapper) {
    let blogSlideContent = '';
    blogDetails.items.sort(customBlogSort);
    blogDetails.items.forEach((item, index) => {
      const {
        thumbnail, title, pubDate, guid, stats, content, link, categories,
      } = item;
      const publishDateFormatted = new Date(pubDate).toLocaleDateString('en-us', { day: 'numeric', year: 'numeric', month: 'short' });
      const sanitizeContent = getFirstNWords(removeTags(content), 50).join(' ');
      let firstCategory;
      let secondCategory;
      if (categories && categories.length) {
        [firstCategory] = categories;
        if (categories.length > 1) {
          [, secondCategory] = categories;
        }
      }
      const blogTemplate = new BlogTemplateProperties(thumbnail, title, title, publishDateFormatted,
        stats.claps.toString(), stats.comments.toString(),
        index.toString(), guid, link, sanitizeContent, firstCategory, secondCategory);
      blogSlideContent += stringInject(BLOG_CARD_TEMPLATE, blogTemplate);
    });
    blogWrapper.innerHTML = blogSlideContent;
    blogSection.style.display = 'block';
    setTimeout(() => {
      instantiateSwiper();
    }, 500);
  }
}

function navigationHandle() {
  updateActiveNavigation();
  // change nav logo animation data attribute
  const navbar = document.getElementById('navigation-bar');
  if (window.location.pathname === URL_PATHS.home
    || window.location.pathname === URL_PATHS.tech.home) {
    const logoDotHero = document.getElementById('logo-dot-hero');
    logoDotHero.dataset.animate = 'true';
    navbar.classList.add('nav-home');
    window.addEventListener('scroll', switchNavigation);
  } else {
    navbar.classList.add('nav-fixed');
    const logoDot = document.getElementById('logo-dot');
    logoDot.dataset.animate = 'true';
  }
}

function preloader(bodyContent) {
  removeContentByIdAfter('pre-loader', 500, () => {
    // eslint-disable-next-line no-param-reassign
    bodyContent.style.display = 'block';
    // nav activate
    navigationHandle();
    // window.addEventListener('scroll', reveal);
  });
}

async function fetchMediumBlogs() {
  try {
    const response = await fetch(`https://medium-apis.onrender.com/api/medium/user?id=${MEDIUM_USERNAME}`);
    if (!response.ok) {
      throw new Error(`An error has occurred: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch blogs:', error);
    throw error;
  }
}

function designWorkGallery() {
  const filterContainer = document.getElementById('design-work-filter');
  const galleryItems = document.querySelectorAll('.design-work-gallery-item');
  filterContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('design-work-filter-item')) {
      // deactivate existing active 'design-work-filter-item'
      filterContainer.querySelector('.active').classList.remove('active');
      // activate new 'design-work-filter-item'
      event.target.classList.add('active');
      const filterValue = event.target.getAttribute('data-filter');
      galleryItems.forEach((item) => {
        if (item.classList.contains(filterValue) || filterValue === 'all') {
          item.classList.remove('hide');
          item.classList.add('show');
        } else {
          item.classList.remove('show');
          item.classList.add('hide');
        }
      });
    }
  });
}

function updateArticleNavigator(currentPath, navs) {
  const articleNav = document.getElementById('article-nav');
  if (articleNav) {
    const { prev, next } = getAdjacentItems(currentPath, navs);

    const prevArticle = document.getElementById('article-nav-previous');
    prevArticle.innerHTML = prev.name;
    prevArticle.classList.add(prev.class);
    const prevArticleUrl = document.getElementById('article-nav-previous-url');
    prevArticleUrl.setAttribute('href', prev.path);

    const nextArticle = document.getElementById('article-nav-next');
    nextArticle.innerHTML = next.name;
    nextArticle.classList.add(next.class);
    const nextArticleUrl = document.getElementById('article-nav-next-url');
    nextArticleUrl.setAttribute('href', next.path);

    articleNav.style.display = 'block';
  }
}

function adjustArticleNavigator() {
  const currentPath = removeTrailingSlash(window.location.pathname);
  if (currentPath) {
    if (DESIGN_URLS.includes(currentPath)) {
      updateArticleNavigator(currentPath, DESIGN_ARTICLE_NAVS);
    }
    if (DEV_URLS.includes(currentPath)) {
      updateArticleNavigator(currentPath, DEV_ARTICLE_NAVS);
    }
  }
}

window.onload = async () => {
  const blogSection = document.getElementById('blog-section');
  const loader = document.getElementById('loader');
  const noDataMessage = document.getElementById('no-data-message');
  const blogWrapper = document.getElementById('blog-wrapper');

  if (window.location.pathname.includes(URL_PATHS.blog) && blogSection) {
    blogSection.style.display = 'none';
    loader.style.display = 'block';
    noDataMessage.style.display = 'none';

    try {
      const response = await fetchMediumBlogs();

      if (response && response.items && response.items.length > 0) {
        addBlogDetailsToDom(response);
        loader.style.display = 'none';
      } else {
        loader.style.display = 'none';
        noDataMessage.style.display = 'block';
        blogWrapper.innerHTML = '';
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      loader.style.display = 'none';
      noDataMessage.style.display = 'block';
      blogWrapper.innerHTML = '';
    }
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const bodyContent = document.getElementById('body-content');
  if (bodyContent) {
    bodyContent.style.display = 'none';
    if (window.location.pathname !== URL_PATHS.home) {
      preloader(bodyContent);
      if (window.location.pathname.includes(URL_PATHS.about)
          || window.location.pathname.includes(URL_PATHS.contact)
          || window.location.pathname.includes(URL_PATHS.blog)) {
        const fluidApp = new FluidApp();
        await fluidApp.show(false);
        const heroTextWrapper = document.querySelector('.hero-text');
        await delay(200);
        heroTextWrapper.style.display = 'block';
        heroTextWrapper.style.opacity = '0.75';
      }
    } else {
      const logoAnimation = document.getElementById('logo-animation');
      const heroTextWrapper = document.querySelector('.hero-text');
      logoAnimation.style.display = 'none';
      const fluidApp = new FluidApp();
      await fluidApp.show();
      bodyContent.style.display = 'block';
      heroTextWrapper.style.display = 'block';
      await delay(100);
      navigationHandle();
      logoAnimation.style.display = 'block';
      heroTextWrapper.style.opacity = '0.75';

      const tiltElements = document.querySelectorAll('.tilt-animation');
      if (tiltElements.length > 0) {
        VanillaTilt.init(tiltElements, {
          speed: 4000,
          max: 2,
          perspective: 400,
        });
      }
    }

    if (window.location.pathname.includes(URL_PATHS.design_work)) {
      designWorkGallery();
    }

    if (document.getElementById('article-nav')) {
      adjustArticleNavigator();
    }
  } else {
    const is404 = document.getElementById('404Page');
    if (is404) {
      const fluidApp = new FluidApp();
      await fluidApp.show(false);
    }
  }

  // 1) Select all your target videos
  const videos = document.querySelectorAll('.autoplay-on-visible');

  // 2) If there are no videos with that class, do nothing
  if (!videos || videos.length === 0) {
    return; // Stop execution here
  }

  const observerOptions = {
    root: null,
    threshold: 0.1,
  };

  // 3) This observer handles playing/pausing each video
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target;

      if (entry.isIntersecting && video.dataset.autoplay === 'false') {
        video.play();
        video.dataset.autoplay = 'true';
      } else if (!entry.isIntersecting && video.dataset.autoplay === 'true') {
        video.pause();
        // video.currentTime = 0; // optional reset
        video.dataset.autoplay = 'false';
      }
    });
  }, observerOptions);

  // 4) Optional "lazy load" observer
  const lazyLoadObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // start observing for playback
        videoObserver.observe(entry.target);
        // unobserve from lazy loading
        lazyLoadObserver.unobserve(entry.target);
      }
    });
  });

  // 5) Attach the lazyLoadObserver to each video
  videos.forEach((video) => {
    lazyLoadObserver.observe(video);
  });
});
