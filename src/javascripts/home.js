document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname === '/') {
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
});
