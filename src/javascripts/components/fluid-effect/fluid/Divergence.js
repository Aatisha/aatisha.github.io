import {
  Mesh, PlaneGeometry, Scene, ShaderMaterial,
} from 'three';
import { faceVertexShader, divergenceShader } from '../utils/Shaders';

export class Divergence {
  constructor(fluid, stage, velocity2, divergence) {
    this.fluid = fluid;
    this.stage = stage;
    this.velocity2 = velocity2;
    this.divergence = divergence;
    this.scene = new Scene();
    this.material = new ShaderMaterial({
      vertexShader: faceVertexShader,
      fragmentShader: divergenceShader,
      uniforms: {
        size: { value: this.fluid.size },
        cellSize: { value: this.fluid.cellSize },
        delta: { value: this.stage.delta },
        velocity: { value: this.velocity2.texture },
      },
    });

    this.geometry = new PlaneGeometry(2, 2);
    this.plane = new Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
  }

  update() {
    this.material.uniforms.delta.value = this.stage.delta;
    this.stage.renderer.setRenderTarget(this.divergence);
    this.stage.renderer.render(this.scene, this.stage.camera);
    this.stage.renderer.setRenderTarget(null);
  }
}
