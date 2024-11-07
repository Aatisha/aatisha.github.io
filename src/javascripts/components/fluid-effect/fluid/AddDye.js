import {
  AdditiveBlending,
  Mesh,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
} from 'three';

import { vertexShader, fragmentShader } from '../utils/Shaders';

const TIME_OFFSET = Math.random() * 20000;

export default class AddDye {
  constructor(fluid, stage) {
    this.fluid = fluid;
    this.stage = stage;
    this.scene = new Scene();
    this.mesh = new Mesh(
      new PlaneGeometry(1, 1),
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        blending: AdditiveBlending,
        uniforms: {
          time: { value: 0 },
          opacity: { value: this.stage.pointerOpacity },
          colorChange: { value: 0.0005 },
          grad: { value: null },
          size: { value: this.stage.pointerSize },
          center: { value: this.stage.pointer },
        },
      }),
    );
    this.scene.add(this.mesh);
  }

  setTexture(texture) {
    this.mesh.material.uniforms.grad.value = texture;
  }

  update(time, dye) {
    this.mesh.material.uniforms.time.value = TIME_OFFSET + time;
    this.mesh.material.uniforms.opacity.value = this.stage.pointerOpacity;
    this.stage.renderer.setRenderTarget(dye);
    this.stage.renderer.render(this.scene, this.stage.camera);
    this.stage.renderer.setRenderTarget(null);
  }
}
