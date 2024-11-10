import { MathUtils, ShaderMaterial, Vector2 } from 'three';
// eslint-disable-next-line import/extensions
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { outputVertexShader, outputFragmentShader } from '../utils/Shaders';

export class Output {
  constructor(stage) {
    this.stage = stage;
    this.startScale = 0;
    this.endScale = 1;
    this.fsQuad = new FullScreenQuad();
    this.material = new ShaderMaterial({
      vertexShader: outputVertexShader,
      fragmentShader: outputFragmentShader,
      depthWrite: false,
      uniforms: {
        diffuse: { value: null },
        amount: { value: 0.1 },
        smoothAmount: { value: 0.3 },
        elapsed: { value: this.startScale },
        resolution: { value: new Vector2() },
      },
    });
    this.fsQuad.material = this.material;
  }

  resize() {
    const aspect = this.stage.width / this.stage.height;
    const { isDesktop, width, dpr } = this.stage;
    this.startScale = isDesktop ? 0.3 / aspect : 0.65;
    this.endScale = (isDesktop ? aspect : 1 / aspect) + 0.25;
    this.stage.renderer.getDrawingBufferSize(
      this.material.uniforms.resolution.value,
    );

    this.material.uniforms.elapsed.value = MathUtils.lerp(
      this.startScale,
      this.endScale,
      this.stage.elapsed,
    );

    this.material.uniforms.smoothAmount.value = 200 / (width * dpr);
  }

  update(time, texture) {
    this.material.uniforms.elapsed.value = MathUtils.lerp(
      this.startScale,
      this.endScale,
      this.stage.elapsed,
    );

    this.material.uniforms.diffuse.value = texture;
    this.fsQuad.render(this.stage.renderer);
  }
}
