import lightGallery from 'lightgallery';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgAutoplay from 'lightgallery/plugins/autoplay';
import lgZoom from 'lightgallery/plugins/zoom';
import lgFullscreen from 'lightgallery/plugins/fullscreen';

function waitForElementVisible(el, callback) {
  const observer = new MutationObserver(() => {
    if (window.getComputedStyle(el).display !== 'none') {
      observer.disconnect();
      callback();
    }
  });

  observer.observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
}

export function instantiatePlayground() {
  // ========== 1. HERO TEXT CURSOR MOVEMENT ==========
  const heroTitle = document.querySelector('.playground-hero-title');
  const heroSubtitle = document.querySelector('.playground-hero-subtitle');

  document.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const deltaX = (clientX - centerX) / centerX;
    const deltaY = (clientY - centerY) / centerY;

    if (heroTitle) {
      heroTitle.style.transform = `translate(${deltaX * 10}px, ${deltaY * 10}px)`;
    }

    if (heroSubtitle) {
      heroSubtitle.style.transform = `translate(${deltaX * 5}px, ${deltaY * 5}px)`;
    }
  });

  // ========== 2. LIGHTGALLERY ==========
  document.querySelectorAll('[data-gallery]').forEach((gallery) => {
    lightGallery(gallery, {
      selector: 'a',
      download: false,
      thumbnail: true,
      animateThumb: false,
      showThumbByDefault: false,
      plugins: [lgThumbnail, lgAutoplay, lgZoom, lgFullscreen],
      speed: 500,
    });
  });

  // ========== 3. CURSOR TRAIL (STAR PARTICLES) ==========
  const canvas = document.getElementById('starCanvas');
  const ctx = canvas?.getContext('2d');
  const heroSection = document.querySelector('.playground-hero-section');
  const bodyContent = document.getElementById('body-content');

  function resizeCanvas() {
    if (!canvas || !heroSection) return;
    canvas.width = heroSection.offsetWidth;
    canvas.height = heroSection.offsetHeight;
  }

  if (bodyContent) {
    if (window.getComputedStyle(bodyContent).display === 'none') {
      waitForElementVisible(bodyContent, () => {
        resizeCanvas();
      });
    } else {
      resizeCanvas();
    }
  }
  window.addEventListener('resize', resizeCanvas);

  class Star {
    constructor(x, y, vx, vy) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 2 + 1;
      this.alpha = 1;
      this.vx = vx * 0.1;
      this.vy = vy * 0.1 + 1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= 0.015;
    }

    draw() {
      if (!ctx) return;
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4);
      gradient.addColorStop(0, `rgba(0, 0, 0, ${this.alpha})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const stars = [];
  let lastX = 0;
  let lastY = 0;

  if (heroSection && canvas) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dx = x - lastX;
      const dy = y - lastY;
      lastX = x;
      lastY = y;

      for (let i = 0; i < 2; i++) {
        stars.push(new Star(x, y, dx + Math.random() * 2 - 1, dy + Math.random() * 2 - 1));
      }
    });
  }

  function animate() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach((s) => {
      s.update();
      s.draw();
    });
    for (let i = stars.length - 1; i >= 0; i--) {
      if (stars[i].alpha <= 0) stars.splice(i, 1);
    }
    requestAnimationFrame(animate);
  }

  animate();
}
