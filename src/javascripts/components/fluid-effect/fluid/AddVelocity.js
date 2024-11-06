import {
  AdditiveBlending,
  Mesh,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
} from 'three';
import { vertexShader, velocityFragmentShader } from '../utils/Shaders';

export default class AddVelocity {
  constructor(fluid, stage, velocity2) {
    this.fluid = fluid;
    this.stage = stage;
    this.velocity2 = velocity2;
    this.scene = new Scene();
    this.mesh = new Mesh(
      new PlaneGeometry(1, 1),
      new ShaderMaterial({
        vertexShader,
        fragmentShader: velocityFragmentShader,
        transparent: true,
        blending: AdditiveBlending,
        uniforms: {
          size: { value: this.stage.pointerSize },
          force: { value: this.stage.pointerForce },
          center: { value: new Vector2() },
        },
      }),
    );
    this.scene.add(this.mesh);
  }

  update() {
    this.mesh.material.uniforms.center.value.copy(this.stage.pointer);
    this.stage.renderer.setRenderTarget(this.velocity2);
    this.stage.renderer.render(this.scene, this.stage.camera);
  }
}
