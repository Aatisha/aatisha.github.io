import {
  FloatType,
  HalfFloatType,
  TextureLoader,
  Vector2,
  WebGLRenderTarget,
} from 'three';
import { Advection } from './Advection';

import AddVelocity from './AddVelocity';

import { Divergence } from './Divergence';

import { Poisson } from './Poisson';

import { Pressure } from './Pressure';

import { Dye } from './Dye';

import { Output } from './Output';

import AddDye from './AddDye';

import StartDye from './StartDye';

const RESOLUTION = 0.25;

export const GRADIENT = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAABCAYAAACouxZ2AAAAAXNSR0IArs4c6QAAAR5JREFUSEvtVNl1xEAIE/Sw/beQBjPkcZm5c30m/sHsCIHEeOn1ehMiQj4igv/87/gBCMACUMTnvYFYICQWn/PEUQMYAE24hUtxXr/nKx7Dsd4/gWgc+hbPlY/bomXsO/V79MR83GCfg/JsdedcB56uxvu6P6t/6Yeeu4+pf92F1jvuzBfz2PzzLvv+4950/2ZZym2/ycV5bAUdz5ybnFufjkdxLj/m/Eaude8dXv/bfsJj/pz6HnToCrIur+SVZ6cv5v3Ur4Ofpl+v1ZlHP38BoxFDQBCLmpNFIUKLuMVlTeDbloNRv3uPHlc9vo7LWZPnxHfHRb9BX+nu9bo/7sfgT+h9zjOfYs1RHKMPoy/uee1k9a/fzQ1XO5376cwfQQkCZ3rauhMAAAAASUVORK5CYII=';

export class Fluid {
  constructor(stage) {
    this.stage = stage;
    this.step = 0;
    this.outputTexture = null;
    this.size = new Vector2();
    this.cellSize = new Vector2();
    this.setSize();

    this.renderTargets = {
      velocity1: this.createRenderTarget(),

      velocity2: this.createRenderTarget(),

      divergence: this.createRenderTarget(),

      pressure1: this.createRenderTarget(),

      pressure2: this.createRenderTarget(),

      dye1: this.createRenderTarget(),

      dye2: this.createRenderTarget(),
    };

    this.startDye = new StartDye(this, this.stage);

    this.advection = new Advection(
      this,
      stage,
      this.renderTargets.velocity1,
      this.renderTargets.velocity2,
    );

    this.addVelocity = new AddVelocity(
      this,
      this.stage,
      this.renderTargets.velocity2,
    );

    this.addDye = new AddDye(this, this.stage);

    this.divergence = new Divergence(
      this,

      this.stage,

      this.renderTargets.velocity2,

      this.renderTargets.divergence,
    );

    this.dye = new Dye(
      this,

      this.stage,

      this.renderTargets.dye1,

      this.renderTargets.dye2,

      this.renderTargets.velocity2,
    );

    this.poisson = new Poisson(
      this,

      this.stage,

      this.renderTargets.divergence,

      this.renderTargets.pressure1,

      this.renderTargets.pressure2,
    );

    this.pressure = new Pressure(
      this,

      stage,

      this.renderTargets.velocity1,

      this.renderTargets.velocity2,

      this.renderTargets.pressure1,
    );

    this.output = new Output(stage);

    this.resize();

    this.load();
  }

  async load() {
    const texture = await new TextureLoader().loadAsync(GRADIENT);

    this.startDye.setTexture(texture);

    this.addDye.setTexture(texture);
  }

  createRenderTarget() {
    const type = /(iPad|iPhone|iPod)/g.test(navigator.userAgent)
      ? HalfFloatType
      : FloatType;

    return new WebGLRenderTarget(this.size.x, this.size.y, {
      type,
    });
  }

  setSize() {
    const width = Math.round(RESOLUTION * this.stage.width);

    const height = Math.round(RESOLUTION * this.stage.height);

    const cellWidth = 1 / width;

    const cellHeight = 1 / height;

    this.cellSize.set(cellWidth, cellHeight);

    this.size.set(width, height);
  }

  resize() {
    this.setSize();

    Object.values(this.renderTargets).forEach(
      (renderTarget) => renderTarget.setSize(this.size.x, this.size.y),
    );

    this.output.resize();
  }

  update(time) {
    this.step++;

    const sign = this.step % 2 === 0;

    if (this.stage.elapsed < 1) {
      this.startDye.update(
        time,
        sign ? this.renderTargets.dye1 : this.renderTargets.dye2,
      );
    }

    this.advection.update();

    this.addVelocity.update();

    this.addDye.update(
      time,
      sign ? this.renderTargets.dye1 : this.renderTargets.dye2,
    );

    this.divergence.update();

    this.poisson.update();

    this.pressure.update(this.poisson.pressure);

    this.dye.update(
      sign ? this.renderTargets.dye1 : this.renderTargets.dye2,

      sign ? this.renderTargets.dye2 : this.renderTargets.dye1,
    );

    this.outputTexture = sign
      ? this.renderTargets.dye2.texture
      : this.renderTargets.dye1.texture;

    this.output.update(time, this.outputTexture);

    // this.output.update(time, this.renderTargets.dye1.texture)
  }
}
