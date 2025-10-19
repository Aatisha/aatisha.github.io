import Swiper from 'swiper';
import VanillaTilt from 'vanilla-tilt';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
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
import './amazon-shopbop';
import './trader-joes';
import './minds';
import './myworker-ai';
import './about';
import { instantiatePlayground } from './playground';
import {
  BlogTemplateProperties, BLOG_CARD_TEMPLATE, MEDIUM_USERNAME,
  STARRED_BLOG_ID, DESIGN_URLS, DEV_URLS, DESIGN_ARTICLE_NAVS, DEV_ARTICLE_NAVS, URL_PATHS,
  WORK_DROPDOWN_ITEMS,
} from './constant';
import { FluidApp } from './components/fluid-effect/FluidApp';
import 'swiper/swiper.min.css';
import 'swiper/modules/pagination.min.css';
import 'swiper/modules/navigation.min.css';
import fallbackData from '../assets/cache/blog.json';

// eslint-disable-next-line no-new
new Swiper('.swiper', {
  spaceBetween: 30,
  centeredSlides: true,
  autoplay: {
    delay: 5000,
    disableOnInteraction: true,
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
  const workNav = document.getElementById('work-nav');

  if (WORK_DROPDOWN_ITEMS.length > 0) {
    // Create the "Work" dropdown toggle button
    const workToggle = document.createElement('div');
    workToggle.classList.add('dropdown-toggle');
    workToggle.innerHTML = 'Work <i class=\'fas fa-caret-down\'></i>';

    // Create the dropdown container
    const dropdownDiv = document.createElement('div');
    dropdownDiv.classList.add('dropdown');

    // Create the dropdown menu
    const dropdownUl = document.createElement('ul');

    // Populate the dropdown with items from the array
    WORK_DROPDOWN_ITEMS.forEach((item) => {
      const listItem = document.createElement('li');
      listItem.classList.add('dropdown-link');

      const anchor = document.createElement('a');
      anchor.href = item.path;
      anchor.textContent = item.shortName;

      listItem.appendChild(anchor);
      dropdownUl.appendChild(listItem);
    });

    // Append the dropdown menu to the dropdown container
    dropdownDiv.appendChild(dropdownUl);

    // Append elements to the nav
    workNav.appendChild(workToggle);
    workNav.appendChild(dropdownDiv);

    // Click event to toggle dropdown
    workToggle.addEventListener('click', () => {
      dropdownDiv.classList.toggle('show'); // Toggle visibility
      workNav.classList.toggle('open'); // Toggle caret rotation
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      if (!workNav.contains(event.target)) {
        dropdownDiv.classList.remove('show');
        workNav.classList.remove('open');
      }
    });
  } else {
    // If no items, display just the Work link without dropdown
    const workLink = document.createElement('a');
    workLink.href = '/';
    workLink.textContent = 'Work';
    workNav.appendChild(workLink);
  }

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
  });
}

async function fetchWithTimeout(url, options = {}, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), timeout);

    fetch(url, options)
      .then((response) => {
        clearTimeout(timer);
        if (response.ok) {
          resolve(response.json());
        } else {
          reject(new Error(`An error occurred: ${response.status}`));
        }
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function fetchMediumBlogs() {
  const apiPromise = fetchWithTimeout(
    `https://medium-apis.onrender.com/api/medium/user?id=${MEDIUM_USERNAME}`,
    {},
    3000, // Timeout in milliseconds
  );

  try {
    // Try fetching from the API with timeout
    return await apiPromise;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('API failed or timed out. Using fallback JSON:', error);

    // Use imported JSON data as fallback
    return fallbackData;
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

function initScrollableTabs(tabsContainer) {
  const tabNavWrapper = tabsContainer.querySelector('.tab-nav-wrapper');
  const tabList = tabsContainer.querySelector('.tab-list');
  const tabItems = tabsContainer.querySelectorAll('.tab-item');
  const tabContents = tabsContainer.querySelectorAll('.tab-content');

  let leftBtn = null;
  let rightBtn = null;

  function scrollTabs(direction) {
    const scrollAmount = 100; // how many pixels to scroll per click
    if (direction === 'left') {
      tabList.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      tabList.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  function createScrollButtons() {
    leftBtn = document.createElement('button');
    leftBtn.classList.add('scroll-btn', 'left');
    leftBtn.setAttribute('aria-label', 'Scroll Left');
    leftBtn.innerHTML = '&lsaquo;';
    leftBtn.addEventListener('click', () => scrollTabs('left'));

    rightBtn = document.createElement('button');
    rightBtn.classList.add('scroll-btn', 'right');
    rightBtn.setAttribute('aria-label', 'Scroll Right');
    rightBtn.innerHTML = '&rsaquo;';
    rightBtn.addEventListener('click', () => scrollTabs('right'));

    tabNavWrapper.insertBefore(leftBtn, tabList);
    tabNavWrapper.appendChild(rightBtn);
  }

  function removeScrollButtons() {
    if (leftBtn) {
      leftBtn.remove();
      leftBtn = null;
    }
    if (rightBtn) {
      rightBtn.remove();
      rightBtn = null;
    }
  }

  function updateButtonState() {
    if (!leftBtn || !rightBtn) return;

    leftBtn.disabled = (tabList.scrollLeft <= 0);

    const scrollableWidth = tabList.scrollWidth - tabList.clientWidth;
    rightBtn.disabled = (tabList.scrollLeft >= scrollableWidth);
  }

  tabItems.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      tabItems.forEach((t) => t.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));
      tab.classList.add('active');
      tabContents[index].classList.add('active');
    });
  });

  function checkOverflow() {
    if (tabList.scrollWidth > tabList.clientWidth) {
      if (!leftBtn || !rightBtn) {
        createScrollButtons();
      }
      updateButtonState();
    } else {
      removeScrollButtons();
    }
  }

  tabList.addEventListener('scroll', updateButtonState);
  window.addEventListener('resize', checkOverflow);
  checkOverflow();
}

function tabHandler() {
  const tabs = document.querySelectorAll('.tabs');

  if (tabs) {
    tabs.forEach((tabsContainer) => {
      initScrollableTabs(tabsContainer);
    });
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

function getNonRepeatingRandomAnimation(allAnimations, recentAnimations) {
  const options = allAnimations.filter((anim) => !recentAnimations.includes(anim));
  const random = options[Math.floor(Math.random() * options.length)];

  // Update recentAnimations history (limit to last 3)
  recentAnimations.push(random);
  if (recentAnimations.length > 3) {
    recentAnimations.shift();
  }

  return random;
}

document.addEventListener('DOMContentLoaded', async () => {
  const bodyContent = document.getElementById('body-content');
  if (bodyContent) {
    bodyContent.style.display = 'none';
    if (window.location.pathname !== URL_PATHS.home) {
      preloader(bodyContent);
      if (window.location.pathname.includes(URL_PATHS.contact)
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

      const badge = document.querySelector('.masked-badge-wrapper');
      const allAnimations = [
        'subtleTilt', 'floatPulse', 'breatheScale', 'squishBounce', 'slidePeek', 'shimmerPop', 'flickerWink', 'tiltHop', 'giggleWiggle',
      ];
      const recentAnimations = [];

      getNonRepeatingRandomAnimation(allAnimations, recentAnimations);

      if (badge) {
        badge.addEventListener('mouseenter', () => {
          badge.style.animation = `${getNonRepeatingRandomAnimation()} 1.5s ease-in-out`;
        });

        badge.addEventListener('mouseleave', () => {
          badge.style.animation = ''; // Reset animation
        });
      }

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

    if (window.location.pathname.includes(URL_PATHS.playground)) {
      instantiatePlayground();
    }

    if (document.getElementById('article-nav')) {
      adjustArticleNavigator();
    }

    tabHandler();

    // Fix anchor links to work correctly with base href
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a');
      if (target && target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const id = target.getAttribute('href').substring(1);
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          // Update URL with full path + hash
          // eslint-disable-next-line no-restricted-globals
          history.pushState(null, '', `${window.location.pathname}#${id}`);
        }
      }
    });

    document.documentElement.style.scrollBehavior = 'smooth';

    const nav = document.querySelector('.case-study-nav');
    if (nav) {
      const navLinks = nav.querySelectorAll('a[href*="#"]');
      const navList = nav.querySelector('ul');
      if (navLinks && navList) {
        // Dynamically get the first target section from nav
        const sectionList = Array.from(navLinks)
          .map((link) => {
            const { hash } = new URL(link.href);
            return document.querySelector(hash);
          })
          .filter(Boolean);

        // Fallback if no sections
        if (!sectionList.length) return;

        const firstSection = sectionList[0]; // dynamically use first linked section

        // eslint-disable-next-line no-inner-declarations
        function onScroll() {
          const scrollPos = window.scrollY + window.innerHeight / 4;
          let currentSection = null;

          sectionList.forEach((section) => {
            if (section.offsetTop <= scrollPos) {
              currentSection = section;
            }
          });

          navLinks.forEach((link) => {
            link.classList.remove('active');
            const linkHash = new URL(link.href).hash;
            if (currentSection && linkHash === `#${currentSection.id}`) {
              link.classList.add('active');
            }
          });

          // Only show nav list if first section is in view
          if (firstSection.getBoundingClientRect().top < window.innerHeight * 0.5) {
            navList.classList.add('visible');
            navList.classList.remove('animating-out');
          } else {
            navList.classList.remove('visible');
            navList.classList.add('animating-out');
          }
        }

        // Prevent flash on load
        window.addEventListener('DOMContentLoaded', () => {
          navList.classList.remove('visible');
        });

        // Smooth scroll spy + entry animation
        window.addEventListener('scroll', onScroll);
        window.addEventListener('load', () => {
          setTimeout(onScroll, 500); // trigger after browser completes hash jump
        });
      }
    }
  } else {
    const is404 = document.getElementById('404Page');
    if (is404) {
      const fluidApp = new FluidApp();
      await fluidApp.show(false);
    }
  }

  const vids = document.querySelectorAll('.speed-control');
  if (vids && vids.length) {
    vids.forEach((video) => {
      const speed = parseFloat(video.dataset.speed) || 1.25;
      // eslint-disable-next-line no-param-reassign
      video.playbackRate = speed;
    });
  }

  const allAnimatedElements = document.querySelectorAll('.animate-on-visible');

  if (allAnimatedElements && allAnimatedElements.length) {
    // Use Intersection Observer to determine if objects are within the viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          return;
        }
        entry.target.classList.remove('in-view');
      });
    });

    // Add the observer to each of those elements
    allAnimatedElements.forEach((element) => observer.observe(element));
  }

  const videos = document.querySelectorAll('.autoplay-on-visible');

  if (videos && videos.length) {
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
  }
});
