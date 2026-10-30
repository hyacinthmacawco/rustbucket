import * as THREE from 'three';
import { dimensions } from '../storage/state.js';
import { installCharacterAnimation } from './character-animation.js';

export function createKevin() {
  const kevin = new THREE.Group();
  kevin.name = 'Kevin';

  const mat = (color) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.9 });

  const skin = mat(0xd5a18e);
  const hair = mat(0x111019);
  const hairHighlight = mat(0x252b43);
  const shirt = mat(0x111114);
  const jeans = mat(0x293c59);
  const jeansLight = mat(0x465a78);
  const suspenders = mat(0x416c82);
  const metal = mat(0x687b91);
  const stripe = mat(0xb5b6ad);
  const stripeDark = mat(0x77786f);
  const shoe = mat(0x515b6b);
  const sole = mat(0x303b4b);

  function ellipsoid(parent, material, x, y, z, sx, sy, sz) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 20, 16),
      material
    );
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function box(parent, material, x, y, z, sx, sy, sz) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(sx, sy, sz),
      material
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function limb(parent, material, a, b, radiusA, radiusB) {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const direction = new THREE.Vector3().subVectors(end, start);

    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusB, radiusA, direction.length(), 14),
      material
    );

    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // -------------------------
  // LEGS
  // -------------------------

  for (const side of [-1, 1]) {
    const x = side * 0.115;

    // Jeans upper legs
    limb(
      kevin, jeans,
      [x, 1.48, 0],
      [x + side * 0.035, 0.88, 0],
      0.12, 0.09
    );

    ellipsoid(
      kevin, jeans,
      x + side * 0.035, 0.88, 0,
      0.09, 0.10, 0.09
    );

    // Lower jeans
    limb(
      kevin, jeans,
      [x + side * 0.035, 0.88, 0],
      [x + side * 0.045, 0.22, 0.015],
      0.09, 0.085
    );

    // Slightly loose trouser cuffs
    ellipsoid(
      kevin, jeans,
      x + side * 0.045, 0.22, 0.015,
      0.09, 0.10, 0.10
    );

    // Shoe bodies
    ellipsoid(
      kevin, shoe,
      x + side * 0.045, 0.12, 0.09,
      0.15, 0.10, 0.23
    );

    // Shoe front
    ellipsoid(
      kevin, shoe,
      x + side * 0.045, 0.12, 0.22,
      0.15, 0.075, 0.12
    );

    // Soles
    box(
      kevin, sole,
      x + side * 0.045, 0.045, 0.12,
      0.31, 0.055, 0.40
    );

    // Shoe upper panels
    box(
      kevin, metal,
      x + side * 0.045, 0.18, 0.04,
      0.19, 0.045, 0.13
    );

    // Shoe vents
    for (let i = -1; i <= 1; i++) {
      box(
        kevin, sole,
        x + side * 0.045 + i * 0.07,
        0.18,
        0.19,
        0.025, 0.055, 0.08
      );
    }
  }

  // -------------------------
  // TORSO
  // -------------------------

  // Shirt
  ellipsoid(kevin, shirt, 0, 2.02, 0, 0.29, 0.46, 0.17);

  // Lower shirt
  box(kevin, shirt, 0, 1.67, 0, 0.47, 0.20, 0.29);

  // Neck
  cylinder:
  {
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.095, 0.20, 16),
      skin
    );
    neck.position.set(0, 2.43, 0);
    neck.castShadow = true;
    kevin.add(neck);
  }

  // Striped scarf / collar
  ellipsoid(kevin, stripeDark, 0, 2.37, 0, 0.15, 0.09, 0.15);
  ellipsoid(kevin, stripe, 0, 2.30, 0.015, 0.15, 0.065, 0.15);

  // -------------------------
  // SUSPENDERS
  // -------------------------

  for (const side of [-1, 1]) {
    // Front suspenders
    box(
      kevin, suspenders,
      side * 0.205, 2.02, 0.15,
      0.075, 0.65, 0.045
    );

    // Back suspenders
    box(
      kevin, suspenders,
      side * 0.205, 2.02, -0.13,
      0.075, 0.65, 0.045
    );

    // Lower attachment pockets
    box(
      kevin, suspenders,
      side * 0.205, 1.77, 0.17,
      0.15, 0.17, 0.06
    );

    // Pocket flap
    box(
      kevin, metal,
      side * 0.205, 1.85, 0.21,
      0.14, 0.055, 0.025
    );

    // Buttons
    ellipsoid(
      kevin, metal,
      side * 0.205, 1.77, 0.215,
      0.018, 0.018, 0.012
    );
  }

  // -------------------------
  // ARMS
  // -------------------------

  for (const side of [-1, 1]) {
    const shoulderX = side * 0.29;
    const elbowX = side * 0.36;
    const handX = side * 0.39;

    // Upper shirt sleeves
    limb(
      kevin, shirt,
      [shoulderX, 2.24, 0],
      [elbowX, 1.91, 0],
      0.115, 0.09
    );

    // Upper striped sleeve band
    ellipsoid(
      kevin, stripe,
      side * 0.335, 1.98, 0,
      0.105, 0.075, 0.105
    );

    // Elbow
    ellipsoid(
      kevin, skin,
      elbowX, 1.87, 0,
      0.09, 0.095, 0.09
    );

    // Forearm
    limb(
      kevin, skin,
      [elbowX, 1.86, 0],
      [handX, 1.25, 0.025],
      0.085, 0.075
    );

    // Striped sleeve wraps
    for (let i = 0; i < 3; i++) {
      const y = 1.77 - i * 0.16;
      const material = i % 2 === 0 ? stripe : stripeDark;

      ellipsoid(
        kevin, material,
        side * (0.36 + i * 0.008),
        y, 0.005,
        0.09, 0.065, 0.09
      );
    }

    // Hands
    ellipsoid(
      kevin, skin,
      handX, 1.18, 0.035,
      0.09, 0.115, 0.075
    );

    // Fingers
    for (let f = 0; f < 3; f++) {
      const offset = (f - 1) * 0.045;

      limb(
        kevin, skin,
        [handX + offset, 1.16, 0.07],
        [handX + offset * 1.15, 1.04, 0.09],
        0.025, 0.018
      );
    }

    // Thumb
    limb(
      kevin, skin,
      [handX - side * 0.06, 1.19, 0.045],
      [handX - side * 0.10, 1.12, 0.10],
      0.03, 0.022
    );
  }

  // -------------------------
  // PANTS DETAILS
  // -------------------------

  // Waistband
  box(kevin, jeansLight, 0, 1.55, 0, 0.45, 0.12, 0.30);

  // Fly seam
  box(kevin, jeansLight, 0, 1.35, 0.155, 0.012, 0.28, 0.012);

  // Belt loop
  box(kevin, jeansLight, 0.18, 1.54, 0.16, 0.035, 0.11, 0.025);

  // Torn patch on one knee
  box(kevin, metal, 0.13, 0.78, 0.095, 0.17, 0.09, 0.018);
  box(kevin, jeansLight, 0.13, 0.73, 0.11, 0.13, 0.025, 0.02);

  // -------------------------
  // NECKLACE
  // -------------------------

  // Necklace cord
  const cord = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.012, 8, 24, Math.PI),
    metal
  );
  cord.position.set(0, 2.29, 0.13);
  cord.rotation.x = Math.PI;
  cord.castShadow = true;
  kevin.add(cord);

  // Pendant
  box(kevin, metal, 0, 2.17, 0.16, 0.13, 0.12, 0.035);
  box(kevin, jeans, 0, 2.17, 0.18, 0.075, 0.06, 0.012);

  // -------------------------
  // HEAD AND HAIR
  // -------------------------

  // Blank head
  ellipsoid(kevin, skin, 0, 2.70, 0, 0.155, 0.23, 0.135);

  // Hair cap
  ellipsoid(kevin, hair, 0, 2.86, -0.025, 0.18, 0.13, 0.16);

  // Hair back
  ellipsoid(kevin, hair, 0, 2.66, -0.09, 0.18, 0.25, 0.12);

  // Hair fringe
  ellipsoid(kevin, hairHighlight, -0.07, 2.94, 0.075, 0.11, 0.055, 0.06);

  // Long side locks
  for (const side of [-1, 1]) {
    const lock = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.44, 8),
      hair
    );

    lock.position.set(side * 0.14, 2.61, 0.005);
    lock.rotation.z = side * -0.12;
    lock.castShadow = true;
    kevin.add(lock);
  }

  // Rear hair length
  for (const side of [-1, 1]) {
    ellipsoid(
      kevin, hair,
      side * 0.11, 2.55, -0.075,
      0.065, 0.25, 0.08
    );
  }

  // Final scale
  kevin.position.set(...dimensions.kevin.position);
  kevin.scale.set(...dimensions.kevin.scale);
  installCharacterAnimation(kevin);

  return kevin;
}
