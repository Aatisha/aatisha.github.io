import { Raycaster } from 'three';

export const RAY_LAYER = 2;

export default class RayCaster {
  constructor(stage, app) {
    this.caster = new Raycaster();
    this.hover = null;
    this.stage = stage;
    this.app = app;
    this.caster.layers.set(RAY_LAYER);
    this.caster.layers.enable(RAY_LAYER);
  }

  update() {
    this.caster.setFromCamera(this.stage.devicePointer, this.stage.camera);
    const [intersect] = this.caster.intersectObjects(this.stage.scene.children);
    const href = intersect?.object.userData.href || null;
    const hover = href || null;
    if (this.hover !== hover) {
      this.hover = hover;
      this.stage.onHover();
      this.app.onHover(this.hover);
    }
  }
}
