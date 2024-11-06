/* eslint-disable*/

import { BufferAttribute, BufferGeometry } from 'three';

const createLayout = require('layout-bmfont-text');

const createIndices = require('quad-indices');

const vertices = {
  pages: (glyphs) => {
    const pages = new Float32Array(glyphs.length * 4);

    let i = 0;

    glyphs.forEach((glyph) => {
      const id = glyph.data.page || 0;

      pages[i++] = id;

      pages[i++] = id;

      pages[i++] = id;

      pages[i++] = id;
    });

    return pages;
  },

  uvs: (glyphs, texWidth, texHeight, flipY) => {
    const uvs = new Float32Array(glyphs.length * 4 * 2);

    let i = 0;

    glyphs.forEach((glyph) => {
      const bitmap = glyph.data;

      const bw = bitmap.x + bitmap.width;

      const bh = bitmap.y + bitmap.height;

      // top left position

      const u0 = bitmap.x / texWidth;

      let v1 = bitmap.y / texHeight;

      const u1 = bw / texWidth;

      let v0 = bh / texHeight;

      if (flipY) {
        v1 = (texHeight - bitmap.y) / texHeight;

        v0 = (texHeight - bh) / texHeight;
      }

      // BL

      uvs[i++] = u0;

      uvs[i++] = v1;

      // TL

      uvs[i++] = u0;

      uvs[i++] = v0;

      // TR

      uvs[i++] = u1;

      uvs[i++] = v0;

      // BR

      uvs[i++] = u1;

      uvs[i++] = v1;
    });

    return uvs;
  },

  positions: (glyphs) => {
    const positions = new Float32Array(glyphs.length * 4 * 3);

    let i = 0;

    glyphs.forEach((glyph) => {
      const bitmap = glyph.data;

      // bottom left position

      const x = glyph.position[0] + bitmap.xoffset;

      const y = glyph.position[1] + bitmap.yoffset;

      const z = 0;

      // quad size

      const w = bitmap.width;

      const h = bitmap.height;

      // BL

      positions[i++] = x;

      positions[i++] = y;

      positions[i++] = z;

      // TL

      positions[i++] = x;

      positions[i++] = y + h;

      positions[i++] = z;

      // TR

      positions[i++] = x + w;

      positions[i++] = y + h;

      positions[i++] = z;

      // BR

      positions[i++] = x + w;

      positions[i++] = y;

      positions[i++] = z;
    });

    return positions;
  },
};

export class SDFGeometry extends BufferGeometry {
  constructor(opt) {
    super();

    if (typeof opt === 'string') {
      opt = { text: opt };
    }

    // use these as default values for any subsequent

    // calls to update()

    this._opt = { ...opt };

    // also do an initial setup...

    if (opt) this.update(opt);
  }

  update(opt) {
    if (typeof opt === 'string') {
      opt = { text: opt };
    }

    // use constructor defaults

    opt = { ...this._opt, ...opt };

    if (!opt.font) {
      throw new TypeError('must specify a { font } in options');
    }

    this.layout = createLayout(opt);

    // get vec2 texcoords

    const flipY = opt.flipY !== false;

    // the desired BMFont data

    const { font } = opt;

    // determine texture size from font file

    const texWidth = font.common.scaleW;

    const texHeight = font.common.scaleH;

    // get visible glyphs

    const glyphs = this.layout.glyphs.filter((glyph) => {
      const bitmap = glyph.data;

      return bitmap.width * bitmap.height > 0;
    });

    // get common vertex data

    const positions = vertices.positions(glyphs);

    const uvs = vertices.uvs(glyphs, texWidth, texHeight, flipY);

    const indices = createIndices([], {
      clockwise: true,

      type: 'uint16',

      count: glyphs.length,
    });

    // update vertex data

    this.setIndex(indices);

    this.setAttribute('position', new BufferAttribute(positions, 3));

    this.setAttribute('uv', new BufferAttribute(uvs, 2));

    // update multipage data

    if (!opt.multipage && 'page' in this.attributes) {
      // disable multipage rendering

      this.deleteAttribute('page');
    } else if (opt.multipage) {
      // enable multipage rendering

      const pages = vertices.pages(glyphs);

      this.setAttribute('page', new BufferAttribute(pages, 1));
    }
  }
}
