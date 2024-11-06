import {
  Color, Group, Mesh, ShaderMaterial, Vector2,
} from 'three';

import { Easing, Tween } from '@tweenjs/tween.js';
import { FONT_SCALE } from '../utils/const';

import { RAY_LAYER } from '../RayCaster';

import { getTextGeometry } from '../textGeometry/getTextGeometry';

import { labelVertexShader, labelFragmentShader } from '../utils/Shaders';

const SCALE_LANDSCAPE = 0.5;

const SCALE_PORTRAIT = 1.25;

export class FluidSecondaryText {
  constructor(stage, parent, anchor) {
    this.stage = stage;
    this.object = new Group();
    this.hoverElapsed = 0;
    this.initialized = false;
    this.parentScale = 1;

    this.text = anchor?.textContent || '';

    this.textMaterial = new ShaderMaterial({
      transparent: true,

      vertexShader: labelVertexShader,

      fragmentShader: labelFragmentShader,

      depthTest: false,

      uniforms: {
        offset: { value: 0 },

        time: { value: 0 },

        left: { value: 0 },

        width: { value: 0 },

        opacity: { value: 1 },

        resolution: { value: new Vector2() },

        map: { value: null },

        sdf: { value: this.stage.sdfTextures.get('italic') },

        color: { value: new Color('#e7e7e7') },
      },
    });

    this.object.scale.set(SCALE_LANDSCAPE, SCALE_LANDSCAPE, SCALE_LANDSCAPE);

    parent.add(this.object);
  }

  async init() {
    if (this.initialized) return;

    const { geometry, size } = await getTextGeometry(
      this.text,
      'italic',
      FONT_SCALE,
      this.stage.sdfFonts.get('italic'),
      true,
    );

    this.mesh = new Mesh(geometry, this.textMaterial);

    this.textMaterial.uniforms.width.value = size.x;

    this.object.add(this.mesh);

    this.initialized = true;
  }

  setActive() {
    // eslint-disable-next-line no-unused-expressions
    this.mesh?.layers.enable(RAY_LAYER);
  }

  unsetActive() {
    // eslint-disable-next-line no-unused-expressions
    this.mesh?.layers.disable(RAY_LAYER);
  }

  // eslint-disable-next-line no-unused-vars, no-return-assign
  setHover(hover) {
    // eslint-disable-next-line no-unused-expressions
    this.tween?.stop();

    this.tween = new Tween({ elapsed: this.hoverElapsed }, this.stage.group)
      .to({ elapsed: 1 }, 250)
      .easing(Easing.Cubic.InOut)
      .onUpdate(({ elapsed }) => {
        this.hoverElapsed = elapsed;
      })
      .start();
  }

  setPositionY(y) {
    this.object.position.y = y;
  }

  resize(parentScale) {
    if (!this.initialized) return;

    const { width, height, dpr } = this.stage;

    this.parentScale = parentScale;

    if (this.mesh) {
      this.mesh.material.uniforms.resolution.value.set(
        width * dpr,
        height * dpr,
      );
    }
  }

  update(time, map, ratio) {
    if (!this.initialized) return;

    const { isDesktop } = this.stage;
    // eslint-disable-next-line no-unused-expressions
    ratio > -0.1 && ratio < 0.1 ? this.setActive() : this.unsetActive();

    const opacity = 1 - this.hoverElapsed * 0.8;

    const baseScale = isDesktop ? SCALE_LANDSCAPE : SCALE_PORTRAIT;

    const scale = (baseScale * (1 - this.hoverElapsed * 0.05)) / this.parentScale;

    this.object.scale.set(scale, scale, scale);

    if (this.mesh) {
      this.mesh.material.uniforms.offset.value = ratio;

      this.mesh.material.uniforms.time.value = time;

      this.mesh.material.uniforms.map.value = map;

      this.mesh.material.uniforms.opacity.value = opacity;
    }
  }
}
