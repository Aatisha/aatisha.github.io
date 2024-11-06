import { MathUtils, Vector2 } from 'three';

// @ts-ignore

import { createNoise2D } from 'simplex-noise';

export class FakePointer {
  constructor(stage) {
    this.stage = stage;
    this.pointer = new Vector2();
    this.size = 1.25;
    this.opacity = 3;
    this.force = 3;
    this.noise = createNoise2D();
  }

  update(time) {
    const { aspect } = this.stage;

    const speed = 0.0003;

    const t = time * speed;

    this.size = 1.25 + (Math.sin(t) + 1) * 0.5;

    const elapsed = MathUtils.lerp(0.9, 1, this.stage.elapsed);

    const x = this.noise(0, t) * elapsed;

    const y = (this.noise(1, t) * elapsed) / aspect;

    this.pointer.set(x, y);
  }
}
