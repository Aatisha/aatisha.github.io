import { Stage } from './Stage';

export class FluidApp {
  constructor() {
    this.isDesktop = false;
    this.update = this.update.bind(this);
    const mq = window.matchMedia('(min-width:1024px)');
    mq.addEventListener('change', () => {
      this.isDesktop = mq.matches;
    });
    this.isDesktop = mq.matches;
    const stage = document.querySelector('.stage');
    this.stage = new Stage(stage, this);
    this.init();
  }

  async init() {
    requestAnimationFrame(this.update);
  }

  async show(callback = () => {}) {
    await this.stage.show(true, callback);
  }

  update(time) {
    requestAnimationFrame(this.update);
    // eslint-disable-next-line no-unused-expressions
    this.stage?.update(time);
  }
}
