import {
  Mesh, PlaneGeometry, Scene, ShaderMaterial,
} from 'three';

import { faceVertexShader, dyeShader } from '../utils/Shaders';

export class Dye {
  constructor(fluid, stage, dye1, dye2, velocity) {
    this.fluid = fluid;

    this.stage = stage;

    this.dye1 = dye1;

    this.dye2 = dye2;

    this.velocity = velocity;

    this.scene = new Scene();

    this.material = new ShaderMaterial({
      vertexShader: faceVertexShader,

      fragmentShader: dyeShader,

      uniforms: {
        size: { value: this.fluid.size },

        cellSize: { value: this.fluid.cellSize },

        dye: { value: this.dye1.texture },

        velocity: { value: this.velocity.texture },

        decay: { value: this.stage.fluidDecay },

        delta: { value: this.stage.delta },
      },
    });

    this.geometry = new PlaneGeometry(2, 2);

    this.plane = new Mesh(this.geometry, this.material);

    this.scene.add(this.plane);
  }

  update(
    renderTargetIn,

    renderTargetOut,
  ) {
    this.material.uniforms.dye.value = renderTargetIn.texture;

    this.material.uniforms.delta.value = this.stage.delta;

    this.material.uniforms.decay.value = this.stage.fluidDecay;

    this.stage.renderer.setRenderTarget(renderTargetOut);

    this.stage.renderer.render(this.scene, this.stage.camera);

    this.stage.renderer.setRenderTarget(null);
  }
}
