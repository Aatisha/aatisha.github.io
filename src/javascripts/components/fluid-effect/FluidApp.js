// import "../../index.css";

// // import { delay } from '../utils/delay';

// // import "../keyframes.css";

// import { update as ae2canvasUpdate } from '@kilokilo/ae2canvas';
import { EventEmitter } from './EventEmitter';

import { Stage } from './Stage';

export class FluidApp extends EventEmitter {
  constructor() {
    super();

    this.pointerX = 0;
    this.pointerY = 0;
    this.bodyWidth = 0;
    this.bodyHeight = 0;
    this.windowWidth = 0;
    this.windowHeight = 0;
    this.scrollY = 0;
    this.isDesktop = false;
    this.isLandscape = false;

    this.update = this.update.bind(this);

    const mq = window.matchMedia('(min-width:1024px)');

    mq.addEventListener('change', () => {
      this.isDesktop = mq.matches;
    });

    this.isDesktop = mq.matches;

    this.windowWidth = window.innerWidth;

    this.windowHeight = window.innerHeight;

    this.isLandscape = this.windowWidth > this.windowHeight;

    this.intersectionObserver = new IntersectionObserver((entries) => this.emit('intersect', entries));

    this.observer = new ResizeObserver(this.onResize.bind(this));

    const stage = document.querySelector('.stage');

    this.stage = new Stage(stage, this);

    this.init();
  }

  async init() {
    requestAnimationFrame(this.update);
    const fluidTitles = Array.from(document.querySelectorAll('.hero-fluid-text-wrapper'));

    await this.stage.load(fluidTitles);

    this.observer.observe(document.body);

    // await this.stage.show(true);
  }

  async show(callback = () => {}) {
    await this.stage.show(true, callback);
  }

  // eslint-disable-next-line  no-return-assign, class-methods-use-this
  onHover(hover) {
    if (hover === null) {
      document.body.style.removeProperty('cursor');
    } else {
      document.body.style.setProperty('cursor', 'pointer');
    }
  }

  onResize() {
    const { width, height } = document
      .querySelector('.hero-fluid-text-container')
      ?.getBoundingClientRect() || { width: 0, height: 0 };

    // prevent resize events on scroll

    if (this.bodyWidth !== width || this.bodyHeight !== height) {
      this.windowWidth = window.innerWidth;

      this.windowHeight = window.innerHeight;

      this.bodyWidth = width;

      this.bodyHeight = height;

      this.isLandscape = this.windowWidth > this.windowHeight;
    }
  }

  update(time) {
    requestAnimationFrame(this.update);
    // ae2canvasUpdate(time);
    // eslint-disable-next-line no-unused-expressions
    this.stage?.update(time);
  }
}
