document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('.project-hero');
  const interBubble = document.querySelector('.interactive');
  if (section && interBubble) {
    let curX = 0;
    let curY = 0;
    let tgX = 0;
    let tgY = 0;

    function move() {
      curX += (tgX - curX) / 20;
      curY += (tgY - curY) / 20;
      interBubble.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
      requestAnimationFrame(move);
    }

    section.addEventListener('mousemove', (event) => {
      const rect = section.getBoundingClientRect();
      tgX = event.clientX - rect.left;
      tgY = event.clientY - rect.top;
    });

    move();
  }
});
