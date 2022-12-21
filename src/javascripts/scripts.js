import Swiper from 'swiper';
import {
  removeContentByIdAfter, stringInject, removeTags, getFirstNWords,
} from './utilities';
import { BlogTemplateProperties, BLOG_SLIDE_TEMPLATE, MEDIUM_USERNAME } from './constant';

function reveal() {
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach((element) => {
    const windowheight = window.innerHeight;
    const revealTop = element.getBoundingClientRect().top;
    const revealPoint = 100;

    if (revealTop < windowheight - revealPoint) {
      element.classList.add('show-item');
    } else {
      element.classList.remove('show-item');
    }
  });
}

function switchNavigation() {
  const navbar = document.getElementById('navigation-bar');
  if (
    document.body.scrollTop >= 65
    || document.documentElement.scrollTop >= 65
  ) {
    // navbar height
    navbar.classList.add('nav-with-bg');
  } else {
    navbar.classList.remove('nav-with-bg');
  }
}

function updateActiveNavigation() {
  const currentPath = window.location.href;
  const navLinks = document
    .getElementById('nav-links')
    .getElementsByTagName('a');
  Array.from(navLinks).forEach((link) => {
    if (link.href === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

document.getElementById('nav-contact').addEventListener('click', () => {
  setTimeout(() => {
    updateActiveNavigation();
    document.getElementById('nav-hamburger').className = '';
    document.getElementById('nav-links').className = '';
  }, 0);
});

if (window.location.pathname === '/' || window.location.pathname === 'about') {
  const resumeDownloadBtn = document.getElementById('resume-btn-download');
  resumeDownloadBtn.addEventListener('click', () => {
    resumeDownloadBtn.classList.toggle('downloaded');
    setTimeout(() => {
      resumeDownloadBtn.classList.toggle('downloaded');
    }, 5000);
  });
}

document.getElementById('nav-hamburger').addEventListener('click', () => {
  document.getElementById('nav-hamburger').classList.toggle('collapsed');
  document.getElementById('navigation-bar').classList.toggle('u-heightAuto');
  const navLinks = document.getElementById('nav-links');
  navLinks.classList.toggle('expanded');
  navLinks.style.display = 'flex';
  const navWrapper = document.getElementsByClassName('pretty-nav-wrapper')[0];
  navWrapper.classList.toggle('u-marginT4');
  navWrapper.classList.toggle('u-heightAuto');
});

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

function addBlogDetailsToDom(blogDetails) {
  const blogSection = document.getElementById('blog-section');
  const blogWrapper = document.getElementById('blog-wrapper');
  let blogSlideContent = '';
  blogDetails.items.forEach((item, index) => {
    const {
      thumbnail, title, pubDate, guid, stats, content, link,
    } = item;
    const publishDateFormatted = new Date(pubDate).toLocaleDateString('en-us', { year: 'numeric', month: 'short' });
    const sanitizeContent = getFirstNWords(removeTags(content), 50).join(' ');
    const blogTemplate = new BlogTemplateProperties(thumbnail, title, title, publishDateFormatted,
      stats.claps.toString(), stats.comments.toString(),
      index.toString(), guid, link, sanitizeContent);
    blogSlideContent += stringInject(BLOG_SLIDE_TEMPLATE, blogTemplate);
  });
  blogWrapper.innerHTML = blogSlideContent;
  blogSection.style.display = 'block';
  setTimeout(() => {
    instantiateSwiper();
  }, 500);
}

function disableBodyContent() {
  const bodyContent = document.getElementById('body-content');
  bodyContent.style.display = 'none';
  return bodyContent;
}

function preloader(bodyContent) {
  removeContentByIdAfter('pre-loader', 200, () => {
    // eslint-disable-next-line no-param-reassign
    bodyContent.style.display = 'block';
    // nav activate
    updateActiveNavigation();
    // change nav logo animation data attribute
    const logoDot = document.getElementById('logo-dot');
    logoDot.dataset.animate = 'true';
    window.addEventListener('scroll', switchNavigation);
    window.addEventListener('scroll', reveal);
  });
}

async function fetchMediumBlogs() {
  const response = await fetch(`https://medium-apis.onrender.com/api/medium/user?id=${MEDIUM_USERNAME}`);
  if (!response.ok) {
    const message = `An error has occured: ${response.status}`;
    throw new Error(message);
  }
  const blogDetails = await response.json();
  return blogDetails;
}

// eslint-disable-next-line no-unused-expressions
fetchMediumBlogs().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  const bodyContent = disableBodyContent();
  preloader(bodyContent);
});

window.onload = async () => {
  const bodyContent = disableBodyContent();
  // console.log(window.location.pathname);
  if (window.location.pathname === '/') {
    const response = await fetchMediumBlogs();
    addBlogDetailsToDom(response);
  }
  preloader(bodyContent);
};
