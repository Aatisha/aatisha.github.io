import {
  LinearFilter,
  MathUtils,
  PerspectiveCamera,
  Scene,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from 'three';
import { Easing, Group, Tween } from '@tweenjs/tween.js';
import { Fluid } from './fluid/Fluid';

import FluidTitleController from './fluidTitle/FluidTitleController';

import { FakePointer } from './fluid/FakePointer';

// import { delay } from './utils/delay';

import RayCaster from './RayCaster';

export class Stage {
  constructor(node, app) {
    this.titles = new Map();
    this.movement = new Vector2();
    this.activeTitles = [];
    this.pointer = new Vector2();
    this.devicePointer = new Vector2();
    this.lastPointer = new Vector2();
    this.pointerSize = new Vector2();
    this.pointerForce = new Vector2();
    this.group = new Group();
    this.sdfTextures = new Map();
    this.sdfFonts = new Map();
    this.width = 0;
    this.height = 0;
    this.left = 0;
    this.top = 0;
    this.hFov = 1;
    this.vFov = 1;
    this.aspect = 1;
    this.elapsed = 0;
    this.pointerOpacity = 0.4;
    this.landscape = false;
    this.pointerMix = 1;
    this.pointerMixTarget = 1;
    this.fluidDecay = 0.99;
    this.delta = 1 / 60;

    this.node = node;
    this.app = app;
    this.node = node;
    this.app = app;
    this.scene = new Scene();
    this.camera = new PerspectiveCamera();
    this.camera.position.z = 10;
    this.renderer = new WebGLRenderer({ antialias: true });
    this.rayCaster = new RayCaster(this, app);
    this.fakePointer = new FakePointer(this);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.autoClear = false;
    this.renderer.setClearColor(0x000000);
    this.dpr = this.renderer.getPixelRatio();
    this.node.appendChild(this.renderer.domElement);
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('touchstart', this.onTouchMove.bind(this));
    document.addEventListener('touchmove', this.onTouchMove.bind(this), {
      passive: false,
    });
    this.fluid = new Fluid(this);
    const observer = new ResizeObserver(this.resize.bind(this));
    observer.observe(this.node);
    this.resize();
    // console.table(this.renderer.capabilities);
  }

  async load(fluidTitles = []) {
    await Promise.all([
      this.loadSDFFont('regular'),
      this.loadSDFFont('italic'),
      this.loadSDFTexture('regular'),
      this.loadSDFTexture('italic'),
      // this.loadIcons()
    ]);

    const promises = [];

    this.activeTitles = [];

    fluidTitles.forEach((node) => {
      let title = this.titles.get(node);
      if (!title) {
        title = new FluidTitleController(this, node);
        this.titles.set(node, title);
        promises.push(title.init());
      }
      this.activeTitles.push(title);
    });
    await Promise.all(promises);
  }

  async loadSDFTexture(type) {
    if (this.sdfTextures.has(type)) return;

    const texture = await new TextureLoader().loadAsync(
      type === 'regular'
        ? '../../../assets/fluid-effect/SourceSerif4Variable-DisplayL.png'
        : '../../../assets/fluid-effect/SourceSerif4-LightItalic-BPAXV4MN.png',
    );

    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    this.sdfTextures.set(type, texture);
  }

  async loadSDFFont(type) {
    if (this.sdfFonts.has(type)) return;
    const response = await fetch(
      type === 'regular'
        ? '../../../assets/fluid-effect/SourceSerif4Variable-DisplayL.file.json'
        : '../../../assets/fluid-effect/SourceSerif4-LightItalic.file.json',
    );

    const font = await response.json();
    this.sdfFonts.set(type, font);
  }

  onHover() {
    this.activeTitles.forEach((title) => title.setHover(this.rayCaster.hover));
  }

  async hide() {
    const promises = [];
    this.titles.forEach((title) => promises.push(title.hide()));
    await Promise.all(promises);
    this.activeTitles = [];
  }

  // eslint-disable-next-line no-return-assign
  // async show(animate = false) {
  //   if (animate) {
  //     new Tween({ elapsed: 0 }, this.group)
  //       .to({ elapsed: 1 }, 4000)
  //       .easing(Easing.Exponential.InOut)
  //       .onUpdate(({ elapsed }) => {
  //         this.elapsed = elapsed;
  //       })
  //       .onComplete(() => {
  //         this.elapsed = 1;
  //       })
  //       .start();
  //     await delay(1500);
  //   } else {
  //     this.elapsed = 1;
  //   }
  //   await Promise.all(this.activeTitles.map((label) => label.show()));
  // }

  async show(animate = false, callback = () => {}) {
    if (animate) {
      new Tween({ elapsed: 0 }, this.group)
        .to({ elapsed: 1 }, 4000)
        .easing(Easing.Exponential.InOut)
        .onUpdate(({ elapsed }) => {
          this.elapsed = elapsed;
        })
        .onComplete(() => {
          this.elapsed = 1;
          callback(); // Call the callback here once the animation is complete
        })
        .start();
      // await delay(500); // You may want to check if this delay is necessary after the animation
    } else {
      this.elapsed = 1;
    }
    await Promise.all(this.activeTitles.map((label) => label.show()));
  }

  resize() {
    const {
      left, top, width, height,
    } = this.node.getBoundingClientRect();
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
    this.landscape = width > height;
    this.aspect = this.width / this.height;
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.camera.position.z = ((1 / this.camera.aspect) * this.camera.getFocalLength())
      / this.camera.getFilmHeight();
    this.vFov = (this.camera.position.z * this.camera.getFilmHeight())
      / this.camera.getFocalLength();
    this.hFov = this.vFov * this.camera.aspect;
    this.activeTitles.forEach((label) => label.resize());
    this.fluid.resize();
  }

  onTouchMove(event) {
    this.pointerMixTarget = 1;
    const { clientX, clientY } = event.touches[0];
    this.onMove(clientX, clientY);
  }

  onMouseMove(event) {
    this.pointerMixTarget = 1;
    const { x, y } = event;
    this.onMove(x, y);
  }

  onMove(x, y) {
    const left = ((x - this.left) / this.width) * 2 - 1;
    const top = -((y - this.top) / this.height) * 2 + 1;
    this.devicePointer.set(left, top);
  }

  update(time) {
    this.group.update(time);
    this.pointerMixTarget *= 0.995;
    this.pointerMix += (this.pointerMixTarget - this.pointerMix) * 0.01;
    this.pointer.lerpVectors(
      this.fakePointer.pointer,
      this.devicePointer,
      this.pointerMix,
    );

    this.movement.subVectors(this.pointer, this.lastPointer);
    this.lastPointer.copy(this.pointer);
    this.delta = MathUtils.lerp(1 / 180, 1 / 60, this.pointerMix);
    this.fluidDecay = MathUtils.lerp(0.995, 0.99, this.pointerMix);
    this.pointerOpacity = MathUtils.lerp(this.fakePointer.opacity, 4, this.pointerMix)
      * this.movement.length();
    this.pointerForce
      .copy(this.movement)
      .multiplyScalar(
        MathUtils.lerp(this.fakePointer.force, 2, this.pointerMix),
      );
    const size = MathUtils.lerp(this.fakePointer.size, 1.25, this.pointerMix);
    this.pointerSize.set(
      this.landscape ? size / this.aspect : size,
      this.landscape ? size : size * this.aspect,
    );
    this.rayCaster.update();
    this.fluid.update(time);
    this.activeTitles.forEach((title) => title.update(time, this.fluid.outputTexture));
    this.fakePointer.update(time);
    this.renderer.render(this.scene, this.camera);
  }

  get scrollY() {
    return this.app.scrollY;
  }

  get hover() {
    return this.rayCaster.hover;
  }

  get isDesktop() {
    return this.app.isDesktop;
  }

  get fluidMap() {
    return this.fluid.outputTexture;
  }
}
