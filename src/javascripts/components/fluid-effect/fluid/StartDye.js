import {
  AdditiveBlending,
  Mesh,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
} from 'three';

import { createNoise2D } from 'simplex-noise';

import { fragmentShader, pointerVertexShader } from '../utils/Shaders';

const TIME_OFFSET = Math.random() * 20000;

export default class AddDye {
  constructor(fluid, stage) {
    this.fluid = fluid;

    this.stage = stage;

    this.noise = createNoise2D();

    this.scene = new Scene();

    this.mesh = new Mesh(
      new PlaneGeometry(1, 1),
      new ShaderMaterial({
        vertexShader: pointerVertexShader,

        fragmentShader,

        transparent: true,

        blending: AdditiveBlending,

        uniforms: {
          time: { value: 0 },

          opacity: { value: 1 },

          colorChange: { value: 0.0008 },

          grad: { value: null },

          size: { value: new Vector2(0.25, 0.25) },

          center: { value: new Vector2() },
        },
      }),
    );

    this.scene.add(this.mesh);
  }

  setTexture(texture) {
    this.mesh.material.uniforms.grad.value = texture;
  }

  update(time, dye) {
    const { landscape, aspect } = this.stage;

    const t = time * 0.00125;

    const dimension = landscape ? 0.35 : 0.75;

    const x = this.noise(0, t) * dimension;

    const y = this.noise(1, t) * dimension * aspect;

    const size = landscape ? 1.25 : 2;

    this.mesh.material.uniforms.time.value = TIME_OFFSET + time;

    this.mesh.material.uniforms.opacity.value = (1 - this.stage.elapsed) * 0.1;

    this.mesh.material.uniforms.center.value.set(x, y);

    this.mesh.material.uniforms.size.value.set(
      landscape ? size / aspect : size,
      landscape ? size : size * aspect,
    );

    this.stage.renderer.setRenderTarget(dye);

    this.stage.renderer.render(this.scene, this.stage.camera);

    this.stage.renderer.setRenderTarget(null);
  }
}
