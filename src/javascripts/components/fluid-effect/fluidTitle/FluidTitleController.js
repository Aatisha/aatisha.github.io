import {
  Color, Group, Mesh, ShaderMaterial, Vector2,
} from 'three';

import { Easing, Tween } from '@tweenjs/tween.js';

import subdivide from '../sdf/subdivide';

import { FONT_SCALE, SPACE_WIDTH } from '../utils/const';

import { FluidSecondaryText } from './FluidSecondaryText';

import { getTextGeometry } from '../textGeometry/getTextGeometry';

import { labelFragmentShader, labelVertexShader } from '../utils/Shaders';

const MAX_SCALE_LANDSCAPE = 2;

const MAX_SCALE_PORTRAIT = 4;

const LINE_HEIGHT = 1 / 16;

export default class FluidTitleController {
  constructor(stage, node) {
    this.object = new Group();
    this.meshes = [];
    this.offset = -1;
    this.positions = [];
    this.widths = [];
    this.maxWidth = 0;
    this.isLandscape = null;
    this.top = 0;
    this.ratio = 1;
    this.height = 0;
    this.active = false;
    this.initialized = false;
    this.stage = stage;
    this.node = node;
    this.object.visible = false;
    this.stage.scene.add(this.object);
    const title = node.querySelector('.title-text');
    this.anchor = node.querySelector('.secondary-text');
    this.text = title?.textContent || '';
    this.lines = this.text.split('\n');
    this.material = new ShaderMaterial({
      transparent: true,
      vertexShader: labelVertexShader,
      fragmentShader: labelFragmentShader,
      depthTest: false,
      uniforms: {
        offset: { value: this.offset },
        time: { value: 0 },
        left: { value: 0 },
        width: { value: 0 },
        opacity: { value: 1 },
        resolution: { value: new Vector2() },
        map: { value: null },
        // iconMap: { value: this.stage.iconsTexture },
        uvOffset: { value: new Vector2(0.0, 0.75) },
        sdf: { value: this.stage.sdfTextures.get('regular') },
        color: { value: new Color('#e7e7e7') },
      },
    });
  }

  async init() {
    if (this.initialized) return;
    const geometries = await Promise.all(
      this.lines.map((line) => getTextGeometry(
        line,
        'regular',
        FONT_SCALE,
        this.stage.sdfFonts.get('regular'),
      )),
    );

    this.meshes = geometries.map(({ geometry, size }) => {
      this.positions.push(new Vector2());
      this.widths.push(size.x);
      this.maxWidth += size.x;
      const mesh = new Mesh(subdivide(geometry, 4), this.material);
      this.object.add(mesh);
      return mesh;
    });

    this.maxWidth += (this.meshes.length - 1) * SPACE_WIDTH;

    if (this.anchor) {
      this.secondaryText = new FluidSecondaryText(
        this.stage,
        this.object,
        this.anchor,
      );

      await this.secondaryText.init();
    }

    this.initialized = true;

    this.resize();
  }

  async show() {
    // eslint-disable-next-line no-unused-expressions
    this.tween?.stop();
    // only animate titles in viewport
    const { scrollY, height } = this.stage;
    const ratio = (this.top - scrollY) / height;
    if (ratio < -0.99 || ratio > 0.99) {
      this.active = true;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.tween = new Tween({ ratio: 1 }, this.stage.group)
        .to({ ratio: 0 }, 3000)
        .easing(Easing.Sinusoidal.Out)
        .onStart(() => {
          this.object.visible = true;
        })
        .onUpdate(({ rto }) => {
          this.ratio = rto;
        })
        .onComplete(() => {
          this.active = true;
          resolve();
        })
        .start();
    });
  }

  async hide() {
    // eslint-disable-next-line no-unused-expressions
    this.tween?.stop();
    this.active = false;
    // only animate titles in viewport
    const { scrollY, height } = this.stage;
    const ratio = (this.top - scrollY) / height;
    if (ratio < -0.5 || ratio > 0.5) {
      this.object.visible = false;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.tween = new Tween({ ratio: this.ratio }, this.stage.group)
        .easing(Easing.Sinusoidal.In)
        .to({ ratio: 1 }, 1500)
        .onUpdate(({ rto }) => {
          this.ratio = rto;
        })
        .onComplete(() => {
          this.object.visible = false;
          resolve();
        })
        .start();
    });
  }

  setHover(hover) {
    // eslint-disable-next-line no-unused-expressions
    this.secondaryText?.setHover(hover);
  }

  resize() {
    if (!this.initialized) return;

    const {
      aspect, width, height, dpr, scrollY, landscape,
    } = this.stage;
    const rect = this.node.getBoundingClientRect();
    this.top = rect.top + scrollY;
    this.height = rect.height;
    const totalWidth = landscape ? this.maxWidth : Math.max(...this.widths);
    const totalHeight = landscape
      ? LINE_HEIGHT
      : LINE_HEIGHT * this.meshes.length;
    this.material.uniforms.resolution.value.set(width * dpr, height * dpr);
    const scaleX = 0.8 / totalWidth;
    const scaleY = 0.8 / (totalHeight * aspect);
    const scale = Math.min(
      Math.min(scaleX, scaleY),
      landscape ? MAX_SCALE_LANDSCAPE : MAX_SCALE_PORTRAIT,
    );

    this.object.scale.set(scale, scale, scale);
    // eslint-disable-next-line no-unused-expressions
    this.secondaryText?.resize(scale);
    if (this.isLandscape === null || landscape !== this.isLandscape) {
      this.isLandscape = landscape;
      this.material.uniforms.width.value = totalWidth;
      let offsetLeft = totalWidth * -0.5;
      let offsetTop = 0;
      this.meshes.forEach((mesh, index) => {
        const left = landscape ? offsetLeft : this.widths[index] * -0.5;
        const top = landscape
          ? LINE_HEIGHT * -0.25
          : LINE_HEIGHT * -0.25
            - index * LINE_HEIGHT
            + (this.meshes.length - 1) * LINE_HEIGHT * 0.5
            + 0.025;
        offsetLeft += this.widths[index] + SPACE_WIDTH;
        mesh.geometry.translate(
          this.positions[index].x * -1,
          this.positions[index].y * -1,
          0,
        );
        this.positions[index].set(left, top);
        mesh.geometry.translate(
          this.positions[index].x,
          this.positions[index].y,
          0,
        );
        offsetTop = top;
      });

      offsetTop -= (LINE_HEIGHT * (landscape ? 1.15 : 3)) / scale;
      // eslint-disable-next-line no-unused-expressions
      this.secondaryText?.setPositionY(offsetTop);
    }
  }

  update(time, map) {
    if (!this.initialized) return;
    const { scrollY } = this.stage;
    const ratio = (this.top - scrollY) / this.height;
    if (this.active) {
      const rounded = Math.round(ratio);
      this.ratio += (rounded - this.ratio) * 0.05;
    }

    if (ratio < -1 || ratio > 1) {
      this.object.visible = false;
      return;
    }

    this.object.visible = true;
    this.object.position.x = this.ratio * 0.025;
    this.material.uniforms.offset.value = this.ratio;
    this.material.uniforms.time.value = time;
    this.material.uniforms.map.value = map;
    // eslint-disable-next-line no-unused-expressions
    this.secondaryText?.update(time, map, this.ratio);
  }
}
