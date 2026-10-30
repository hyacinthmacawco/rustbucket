import * as THREE from 'three';
import { dimensions } from '../storage/config.js';
import { installCharacterAnimation } from './character-animation.js';

export function createGwen() {
  const gwen = new THREE.Group();
  gwen.name = 'Gwen';

  const mat = (color, roughness = 0.88) =>
    new THREE.MeshStandardMaterial({ color, roughness });

  const skin = mat(0xe9b6a5);
  const hair = mat(0xd95720);
  const hairLight = mat(0xf17a35);
  const blue = mat(0x72b6d5);
  const darkBlue = mat(0x315c88);
  const skirtBlue = mat(0x426b9a);
  const skirtLine = mat(0x91b6d0);
  const white = mat(0xe5e9e9);
  const shoeBlue = mat(0x315c92);
  const shoeDark = mat(0x172d4b);

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

  function cylinder(parent, material, x, y, z, radiusTop, radiusBottom, height) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 16),
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
      new THREE.CylinderGeometry(radiusB, radiusA, direction.length(), 12),
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

  // Left and right legs
  for (const side of [-1, 1]) {
    const x = side * 0.105;

    // Upper legs
    limb(gwen, skin, [x, 1.48, 0], [x, 0.92, 0], 0.105, 0.075);

    // Knees
    ellipsoid(gwen, skin, x, 0.91, 0, 0.075, 0.09, 0.075);

    // Lower legs
    limb(gwen, skin, [x, 0.90, 0], [x, 0.40, 0], 0.075, 0.06);

    // White knee-high socks
    cylinder(gwen, white, x, 0.40, 0, 0.065, 0.075, 0.52);
    ellipsoid(gwen, white, x, 0.66, 0, 0.075, 0.045, 0.075);

    // Sock upper edge
    cylinder(gwen, white, x, 0.64, 0, 0.077, 0.077, 0.045);

    // Shoes
    ellipsoid(gwen, shoeBlue, x, 0.12, 0.065, 0.105, 0.09, 0.20);
    ellipsoid(gwen, shoeDark, x, 0.075, 0.13, 0.105, 0.045, 0.15);

    // Shoe soles
    box(gwen, white, x, 0.035, 0.08, 0.22, 0.045, 0.32);

    // Shoe upper straps
    box(gwen, darkBlue, x, 0.15, 0.04, 0.17, 0.035, 0.09);
  }

  // -------------------------
  // SKIRT
  // -------------------------

  // Waist
  cylinder(gwen, darkBlue, 0, 1.53, 0, 0.19, 0.19, 0.12);

  // Main skirt
  const skirt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.31, 0.43, 0.48, 8, 1),
    skirtBlue
  );
  skirt.position.set(0, 1.30, 0);
  skirt.castShadow = true;
  skirt.receiveShadow = true;
  gwen.add(skirt);

  // Skirt grid lines
  for (let x = -2; x <= 2; x++) {
    const px = x * 0.105;
    box(gwen, skirtLine, px, 1.30, 0.255, 0.009, 0.43, 0.008);
  }

  for (let y = 0; y < 3; y++) {
    box(gwen, skirtLine, 0, 1.15 + y * 0.13, 0.30 - y * 0.02, 0.62 - y * 0.07, 0.009, 0.008);
  }

  // -------------------------
  // TORSO
  // -------------------------

  // Shirt body
  ellipsoid(gwen, blue, 0, 1.87, 0, 0.235, 0.34, 0.14);

  // Shirt lower edge
  box(gwen, blue, 0, 1.58, 0, 0.34, 0.09, 0.22);

  // Neck
  cylinder(gwen, skin, 0, 2.23, 0, 0.075, 0.075, 0.20);

  // Shirt collar
  ellipsoid(gwen, darkBlue, 0, 2.17, 0.025, 0.105, 0.035, 0.12);

  // Chest emblem (abstract blue symbol)
  ellipsoid(gwen, darkBlue, 0, 1.99, 0.143, 0.105, 0.09, 0.018);
  ellipsoid(gwen, blue, 0, 1.99, 0.162, 0.065, 0.055, 0.012);

  // -------------------------
  // ARMS
  // -------------------------

  for (const side of [-1, 1]) {
    const x = side;

    // Shoulder
    ellipsoid(gwen, blue, x * 0.235, 2.05, 0, 0.09, 0.12, 0.11);

    // Upper arm
    limb(
      gwen, skin,
      [x * 0.25, 2.00, 0],
      [x * 0.30, 1.65, 0],
      0.065, 0.052
    );

    // Elbow
    ellipsoid(gwen, skin, x * 0.30, 1.65, 0, 0.052, 0.06, 0.052);

    // Forearm
    limb(
      gwen, skin,
      [x * 0.30, 1.64, 0],
      [x * 0.34, 1.22, 0.015],
      0.052, 0.045
    );

    // Hands
    ellipsoid(gwen, skin, x * 0.34, 1.15, 0.025, 0.055, 0.09, 0.045);

    // Fingers
    for (let f = 0; f < 3; f++) {
      const fx = x * (0.34 + f * 0.025);
      limb(
        gwen, skin,
        [x * 0.34, 1.12, 0.035],
        [fx, 1.02, 0.045],
        0.016, 0.012
      );
    }
  }

  // -------------------------
  // HEAD
  // -------------------------

  // Blank head
  ellipsoid(gwen, skin, 0, 2.48, 0, 0.145, 0.215, 0.135);

  // Hair cap
  ellipsoid(gwen, hair, 0, 2.61, -0.015, 0.17, 0.14, 0.145);

  // Hair at back
  ellipsoid(gwen, hair, 0, 2.43, -0.095, 0.17, 0.24, 0.10);

  // Left and right side hair
  for (const side of [-1, 1]) {
    ellipsoid(gwen, hair, side * 0.135, 2.48, -0.005, 0.075, 0.19, 0.12);
    ellipsoid(gwen, hairLight, side * 0.135, 2.56, 0.025, 0.045, 0.12, 0.09);
  }

  // Front fringe
  ellipsoid(gwen, hair, -0.075, 2.62, 0.105, 0.075, 0.105, 0.055);
  ellipsoid(gwen, hairLight, 0.045, 2.65, 0.11, 0.065, 0.075, 0.04);

  // Long hair tips
  for (const side of [-1, 1]) {
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.065, 0.23, 8),
      hair
    );
    tip.position.set(side * 0.14, 2.35, -0.025);
    tip.rotation.z = side * -0.10;
    tip.castShadow = true;
    gwen.add(tip);
  }

  // Final positioning
  gwen.position.set(...dimensions.gwen.position);
  gwen.scale.set(...dimensions.gwen.scale);
  installCharacterAnimation(gwen);

  return gwen;
}
