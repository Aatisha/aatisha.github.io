import {
  Mesh, PlaneGeometry, Scene, ShaderMaterial,
} from 'three';

import { faceVertexShader, poissonFragmentShader } from '../utils/Shaders';

const ITERATIONS = 16;

export class Poisson {
  constructor(fluid, stage, divergence, pressure1, pressure2) {
    this.fluid = fluid;

    this.stage = stage;

    this.divergence = divergence;

    this.pressure1 = pressure1;

    this.pressure2 = pressure2;

    this.scene = new Scene();

    this.material = new ShaderMaterial({
      vertexShader: faceVertexShader,

      fragmentShader: poissonFragmentShader,

      uniforms: {
        cellSize: {
          value: this.fluid.cellSize,
        },

        divergence: {
          value: this.divergence.texture,
        },

        pressure: {
          value: this.pressure1.texture,
        },
      },
    });

    this.pressure = this.pressure2;

    this.geometry = new PlaneGeometry(2, 2);

    this.plane = new Mesh(this.geometry, this.material);

    this.scene.add(this.plane);
  }

  update() {
    let pressureIn; let
      pressureOut;

    for (let i = 0; i < ITERATIONS; i++) {
      if (i % 2 === 0) {
        pressureIn = this.pressure1;

        pressureOut = this.pressure2;
      } else {
        pressureIn = this.pressure2;

        pressureOut = this.pressure1;
      }

      this.material.uniforms.pressure.value = pressureIn.texture;

      this.pressure = pressureOut;

      this.stage.renderer.setRenderTarget(pressureOut);

      this.stage.renderer.render(this.scene, this.stage.camera);

      this.stage.renderer.setRenderTarget(null);
    }
  }
}
