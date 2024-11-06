import {
  Mesh, PlaneGeometry, Scene, ShaderMaterial,
} from 'three';

import { faceVertexShader, pressureFragmentShader } from '../utils/Shaders';

export class Pressure {
  constructor(fluid, stage, velocity1, velocity2, pressure) {
    this.fluid = fluid;

    this.stage = stage;

    this.velocity1 = velocity1;

    this.velocity2 = velocity2;

    this.pressure = pressure;

    this.scene = new Scene();

    this.material = new ShaderMaterial({
      vertexShader: faceVertexShader,

      fragmentShader: pressureFragmentShader,

      uniforms: {
        cellSize: {
          value: this.fluid.cellSize,
        },

        velocity: {
          value: this.velocity2.texture,
        },

        pressure: {
          value: this.pressure.texture,
        },

        delta: { value: this.stage.delta },
      },
    });

    this.geometry = new PlaneGeometry(2, 2);

    this.plane = new Mesh(this.geometry, this.material);

    this.scene.add(this.plane);
  }

  update(pressure) {
    this.material.uniforms.delta.value = this.stage.delta;

    this.material.uniforms.pressure.value = pressure.texture;

    this.stage.renderer.setRenderTarget(this.velocity1);

    this.stage.renderer.render(this.scene, this.stage.camera);

    this.stage.renderer.setRenderTarget(null);
  }
}
