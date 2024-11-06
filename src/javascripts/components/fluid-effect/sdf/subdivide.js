import { BufferAttribute, MathUtils } from 'three';

const { lerp } = MathUtils;

function subPosition(oldArray) {
  const newArray = [];

  for (let i = 0; i < oldArray.length; i += 9) {
    const p1 = [oldArray[i], oldArray[i + 1], oldArray[i + 2]];

    const p2 = [oldArray[i + 3], oldArray[i + 4], oldArray[i + 5]];

    const p3 = [oldArray[i + 6], oldArray[i + 7], oldArray[i + 8]];

    const p12 = [
      lerp(p1[0], p2[0], 0.5),
      lerp(p1[1], p2[1], 0.5),
      lerp(p1[2], p2[2], 0.5),
    ];

    const p23 = [
      lerp(p2[0], p3[0], 0.5),
      lerp(p2[1], p3[1], 0.5),
      lerp(p2[2], p3[2], 0.5),
    ];

    const p31 = [
      lerp(p3[0], p1[0], 0.5),
      lerp(p3[1], p1[1], 0.5),
      lerp(p3[2], p1[2], 0.5),
    ];

    newArray.push(p1[0]);

    newArray.push(p1[1]);

    newArray.push(p1[2]);

    newArray.push(p12[0]);

    newArray.push(p12[1]);

    newArray.push(p12[2]);

    newArray.push(p31[0]);

    newArray.push(p31[1]);

    newArray.push(p31[2]);

    newArray.push(p12[0]);

    newArray.push(p12[1]);

    newArray.push(p12[2]);

    newArray.push(p2[0]);

    newArray.push(p2[1]);

    newArray.push(p2[2]);

    newArray.push(p23[0]);

    newArray.push(p23[1]);

    newArray.push(p23[2]);

    newArray.push(p23[0]);

    newArray.push(p23[1]);

    newArray.push(p23[2]);

    newArray.push(p3[0]);

    newArray.push(p3[1]);

    newArray.push(p3[2]);

    newArray.push(p31[0]);

    newArray.push(p31[1]);

    newArray.push(p31[2]);

    newArray.push(p31[0]);

    newArray.push(p31[1]);

    newArray.push(p31[2]);

    newArray.push(p12[0]);

    newArray.push(p12[1]);

    newArray.push(p12[2]);

    newArray.push(p23[0]);

    newArray.push(p23[1]);

    newArray.push(p23[2]);
  }

  return newArray;
}

function subUV(oldArray) {
  const newArray = [];

  for (let i = 0; i < oldArray.length; i += 6) {
    const p1 = [oldArray[i], oldArray[i + 1]];

    const p2 = [oldArray[i + 2], oldArray[i + 3]];

    const p3 = [oldArray[i + 4], oldArray[i + 5]];

    const p12 = [lerp(p1[0], p2[0], 0.5), lerp(p1[1], p2[1], 0.5)];

    const p23 = [lerp(p2[0], p3[0], 0.5), lerp(p2[1], p3[1], 0.5)];

    const p31 = [lerp(p3[0], p1[0], 0.5), lerp(p3[1], p1[1], 0.5)];

    newArray.push(p1[0]);

    newArray.push(p1[1]);

    newArray.push(p12[0]);

    newArray.push(p12[1]);

    newArray.push(p31[0]);

    newArray.push(p31[1]);

    newArray.push(p12[0]);

    newArray.push(p12[1]);

    newArray.push(p2[0]);

    newArray.push(p2[1]);

    newArray.push(p23[0]);

    newArray.push(p23[1]);

    newArray.push(p23[0]);

    newArray.push(p23[1]);

    newArray.push(p3[0]);

    newArray.push(p3[1]);

    newArray.push(p31[0]);

    newArray.push(p31[1]);

    newArray.push(p31[0]);

    newArray.push(p31[1]);

    newArray.push(p12[0]);

    newArray.push(p12[1]);

    newArray.push(p23[0]);

    newArray.push(p23[1]);
  }

  return newArray;
}

export default function subdivide(geometry, level = 1) {
  const nonIndexed = geometry.toNonIndexed();

  const positions = nonIndexed.getAttribute('position');

  const uvs = nonIndexed.getAttribute('uv');

  let newPositions = Array.from(positions.array);

  let newUvs = Array.from(uvs.array);

  for (let i = 0; i < level; i++) {
    newPositions = subPosition(newPositions);

    newUvs = subUV(newUvs);
  }

  nonIndexed.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(newPositions), 3),
  );

  nonIndexed.setAttribute(
    'uv',
    new BufferAttribute(new Float32Array(newUvs), 2),
  );

  return nonIndexed;
}
