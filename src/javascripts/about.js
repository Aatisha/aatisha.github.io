import {URL_PATHS} from './constant';


if (window.location.pathname.includes(URL_PATHS.about)) {
  /* ------------------------------------------------------------
         GENERAL SCROLL OBSERVER: Add 'animate-in' when section is in view
         ------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll(".scroll-section");
    const options = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    }, options);
    sections.forEach((sec) => observer.observe(sec));
  });
  const travelCards = document.querySelectorAll(".travel-card");
  console.log(travelCards, "HIIIIIIIIII")
  
  /* ============================================================
         TRAVELLING SECTION JS (Auto-play + Toggle Play/Pause)
         ============================================================ */
  document.addEventListener("DOMContentLoaded", () => {
    const travelCards = document.querySelectorAll(".travel-card");
    console.log(travelCards)
    travelCards.forEach((card) => {
      const video = card.querySelector("video");
      const btn = card.querySelector("button");
      console.log(btn)
      // Attempt to autoplay
      video.play().catch(() => {
        /* ignore autoplay restriction */
      });
      // Toggle play/pause
      btn.addEventListener("click", () => {
        debugger
        if (video.paused) {
          video.play();
          btn.innerHTML = "&#10074;&#10074;";
        } else {
          video.pause();
          btn.innerHTML = "&#9658;";
        }
      });
    });
  });
  
  /* ============================================================
         LITERARY SECTION JS (Spread/Gather Animations for static items)
         ============================================================ */
  document.addEventListener("DOMContentLoaded", () => {
    const literarySec = document.querySelector(".literary-section");
    const bookItems = document.querySelectorAll(".book-item");
  
    // IntersectionObserver: threshold 0 to catch any intersection change
    const litObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= 0.5) {
            // Spread when ≥ 50% is visible
            bookItems.forEach((item) => {
              item.classList.remove("book-gathered");
              item.classList.add("book-spread");
              item.style.opacity = "1";
              item.style.transform = "translate(0, 0) scale(1)";
            });
          } else if (entry.boundingClientRect.top > 0) {
            // Gather only when the top edge is below viewport bottom (scrolling up, section out below)
            bookItems.forEach((item) => {
              const x = item.style.getPropertyValue("--offset-x");
              const y = item.style.getPropertyValue("--offset-y");
              const delay = item.style.getPropertyValue("--delay");
              item.classList.remove("book-spread");
              item.classList.add("book-gathered");
              item.style.transitionDelay = delay;
              item.style.transform = `translate(${x}, ${y}) scale(0.8)`;
              item.style.opacity = "0.9";
            });
          }
          // Do nothing if rect.bottom < 0 (section above viewport)
        });
      },
      { threshold: [0, 0.5] }
    );
  
    litObserver.observe(literarySec);
  });
  
  /* ============================================================
         COSMIC SECTION JS (Stars + Parallax)
         ============================================================ */
  document.addEventListener("DOMContentLoaded", () => {
    // Generate 50 random pulsating stars
    const cosmicStars = document.querySelector(".cosmic-stars");
    for (let i = 0; i < 50; i++) {
      const star = document.createElement("div");
      star.classList.add("star");
      star.style.top = Math.random() * 100 + "%";
      star.style.left = Math.random() * 100 + "%";
      star.style.animationDelay = Math.random() * 3 + "s";
      star.style.animationDuration = 2 + Math.random() * 2 + "s";
      cosmicStars.appendChild(star);
    }
  
    // Fade-in for static cosmic cards
    const cosmicCards = document.querySelectorAll(".cosmic-card");
    const cosmicObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.1 }
    );
    cosmicCards.forEach((card) => cosmicObserver.observe(card));
  
    // Parallax on scroll
    window.addEventListener("scroll", () => {
      cosmicCards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const scrollProgress = Math.max(
          0,
          Math.min(
            1,
            (window.innerHeight - rect.top) / (window.innerHeight + rect.height)
          )
        );
        const depth = card.getAttribute("data-depth");
        let speed = 1;
        if (depth === "deep") speed = 0.5;
        else if (depth === "medium") speed = 0.75;
        else speed = 1.2;
        const translateY = (scrollProgress - 0.5) * 100 * speed;
        const scale = scrollProgress >= 0.5 ? 1 : 0.9;
        card.style.transform = `translateY(${translateY}px) scale(${scale})`;
      });
    });
  });
  
  /* ============================================================
         GAMING SECTION JS (Fade-in & Toggle Selection)
         ============================================================ */
  document.addEventListener("DOMContentLoaded", () => {
    const gamingCards = document.querySelectorAll(".gaming-card");
    const gameObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.transition = `all 0.6s cubic-bezier(0.25,0.46,0.45,0.94) ${entry.target.style.animationDelay}`;
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0) scale(1)";
          }
        });
      },
      { threshold: 0.1 }
    );
    gamingCards.forEach((card) => gameObserver.observe(card));
  
    // Toggle selected state
    gamingCards.forEach((card) => {
      card.addEventListener("click", () => {
        card.classList.toggle("selected");
      });
    });
  });
  
  /* ------------------------------------------------------------
         TYPEWRITER & PULSE KEYFRAMES
         ------------------------------------------------------------ */
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
        @keyframes typewriter {
          to { white-space: normal; }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%     { opacity: 0.5; transform: scale(0.8); }
        }
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `;
  document.head.appendChild(styleSheet);
}
