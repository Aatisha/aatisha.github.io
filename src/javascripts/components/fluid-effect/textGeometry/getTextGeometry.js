import { Box3, Vector3 } from 'three';
import { SDFGeometry } from '../sdf/SDFGeometry';

const geometries = new Map();

const box = new Box3();

export const getTextGeometry = async (
  text,

  type,

  scale,

  font,

  center = false,
) => {
  const key = `${type}-${text}`;

  let { geometry, size } = geometries.get(key) || {
    geometry: undefined,

    size: undefined,
  };

  // console.log(text, font);

  if (!geometry) {
    geometry = new SDFGeometry({
      font,

      text,
    });

    geometry.scale(scale, scale * -1, scale);

    box.setFromBufferAttribute(geometry.getAttribute('position'));

    size = box.getSize(new Vector3());

    if (center) {
      geometry.translate(size.x * -0.5, 0, 0);
    }

    geometries.set(key, { geometry, size });
  }

  return { geometry, size };
};
