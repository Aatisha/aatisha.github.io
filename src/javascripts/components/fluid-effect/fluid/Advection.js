import {
  Mesh, PlaneGeometry, Scene, ShaderMaterial,
} from 'three';
import { faceVertexShader, advectionShader } from '../utils/Shaders';

export class Advection {
  constructor(fluid, stage, velocity1, velocity2) {
    this.fluid = fluid;
    this.stage = stage;
    this.velocity1 = velocity1;
    this.velocity2 = velocity2;
    this.scene = new Scene();
    this.material = new ShaderMaterial({
      vertexShader: faceVertexShader,
      fragmentShader: advectionShader,
      uniforms: {
        size: { value: this.fluid.size },
        cellSize: { value: this.fluid.cellSize },
        velocity: { value: this.velocity1.texture },
        delta: { value: this.stage.delta },
      },
    });
    this.geometry = new PlaneGeometry(2, 2);
    this.plane = new Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
  }

  update() {
    this.material.uniforms.delta.value = this.stage.delta;
    this.stage.renderer.setRenderTarget(this.velocity2);
    this.stage.renderer.render(this.scene, this.stage.camera);
    this.stage.renderer.setRenderTarget(null);
  }
}
