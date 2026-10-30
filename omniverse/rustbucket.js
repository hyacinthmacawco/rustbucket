import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { dimensions } from '../storage/state.js';

export function createRustbucket(scene) {
  function material(color, roughness = 0.7, extra = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: 0.05,
      ...extra
    });
  }

  function addMesh(geometry, mat, parent, position, rotation = [0, 0, 0]) {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addCylinderBetween(parent, start, end, radius, mat) {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const direction = new THREE.Vector3().subVectors(b, a);

    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        radius, radius, direction.length(), 8
      ),
      mat
    );

    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const cream = material(0xd5cda7, 0.68);
  const paleCream = material(0xe2dbb9, 0.72);
  const orange = material(0xc76b36);
  const orangeDark = material(0x713d2d);
  const stripeMaterial = material(0xb85c37);
  const blueGray = material(0x657789, 0.55);
  const metal = material(0x323b46, 0.65);

  const glass = material(0x46616c, 0.25, {
    metalness: 0.3
  });

  const ship = new THREE.Group();
  ship.name = "Rustbucket";
  ship.position.set(...dimensions.rustbucket.position);
  ship.scale.set(...dimensions.rustbucket.scale);
  scene.add(ship);

  // Main fuselage. Nose points along +Z.
  addMesh(
    new THREE.CylinderGeometry(1.15, 0.75, 10.5, 10),
    cream,
    ship,
    [0, 0, 0],
    [Math.PI / 2, 0, 0]
  );

  // Nose cone and orange nose band.
  addMesh(
    new THREE.ConeGeometry(1.12, 2.6, 10),
    paleCream,
    ship,
    [0, 0, 6],
    [Math.PI / 2, 0, 0]
  );

  addMesh(
    new THREE.CylinderGeometry(1.08, 1.05, 0.32, 10),
    orange,
    ship,
    [0, 0, 5],
    [Math.PI / 2, 0, 0]
  );

  // Rear collar and main engine housing.
  addMesh(
    new THREE.CylinderGeometry(1.17, 1.05, 1.15, 10),
    blueGray,
    ship,
    [0, 0, -3.5],
    [Math.PI / 2, 0, 0]
  );

  addMesh(
    new THREE.CylinderGeometry(1.15, 1.4, 2, 10),
    blueGray,
    ship,
    [0, -0.15, -4.5],
    [Math.PI / 2, 0, 0]
  );

  for (const x of [-0.72, 0.72]) {
    addMesh(
      new THREE.CylinderGeometry(0.4, 0.48, 0.65, 10),
      orangeDark,
      ship,
      [x, -0.22, -5.45],
      [Math.PI / 2, 0, 0]
    );

    addMesh(
      new THREE.CircleGeometry(0.29, 12),
      metal,
      ship,
      [x, -0.22, -5.79]
    );
  }

  // Cockpit glazing.
  for (let i = 0; i < 5; i++) {
    addMesh(
      new THREE.BoxGeometry(0.34, 0.57, 0.075),
      glass,
      ship,
      [-0.77 + i * 0.38, 0.68, 3.15 - i * 0.33],
      [-0.12, 0, 0]
    );
  }

  addMesh(
    new THREE.BoxGeometry(1.25, 0.55, 0.12),
    glass,
    ship,
    [0, 0.77, 4.35],
    [-0.2, 0, 0]
  );

  // Broad swept wings, orange tips, and stripes.
  function addWing(side) {
    const shape = new THREE.Shape();

    shape.moveTo(0.7, 2.7);
    shape.lineTo(5.9, 4.6);
    shape.lineTo(8.4, 2);
    shape.lineTo(3.1, -2);
    shape.lineTo(0.8, -3.2);
    shape.closePath();

    const wing = addMesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.22,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.08,
        bevelThickness: 0.08
      }),
      cream,
      ship,
      [0, -0.25, -0.05],
      [-Math.PI / 2, 0, 0]
    );

    wing.scale.x = side;

    addMesh(
      new THREE.BoxGeometry(0.16, 0.27, 1.9),
      orange,
      ship,
      [side * 7.2, -0.27, 2.5],
      [0, side * -0.28, 0]
    );

    const stripeShape = new THREE.Shape();
    stripeShape.moveTo(1.25, 2.7);
    stripeShape.lineTo(5.9, 4.35);
    stripeShape.lineTo(6.45, 3.8);
    stripeShape.lineTo(2, 2);
    stripeShape.closePath();

    const stripe = addMesh(
      new THREE.ExtrudeGeometry(stripeShape, {
        depth: 0.025,
        bevelEnabled: false
      }),
      stripeMaterial,
      ship,
      [0, -0.105, 0],
      [-Math.PI / 2, 0, 0]
    );

    stripe.scale.x = side;
  }

  addWing(1);
  addWing(-1);

  // Tail fins and orange fin markings.
  for (const side of [-1, 1]) {
    addMesh(
      new THREE.BoxGeometry(0.16, 1.45, 2.5),
      paleCream,
      ship,
      [side * 1, 0.9, -4.1],
      [0, side * 0.12, side * -0.38]
    );

    addMesh(
      new THREE.BoxGeometry(0.18, 0.12, 2.25),
      orange,
      ship,
      [side * 1.04, 1.15, -4.1],
      [0, 0, side * -0.38]
    );
  }

  addMesh(
    new THREE.BoxGeometry(0.65, 0.85, 2),
    cream,
    ship,
    [0, 0.92, -4.05]
  );

  // Orange stripe on top of the fuselage.
  addMesh(
    new THREE.BoxGeometry(0.15, 0.035, 7.2),
    stripeMaterial,
    ship,
    [0, 1, -0.1]
  );

  // Side panels.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      addMesh(
        new THREE.BoxGeometry(0.055, 0.52, 0.95),
        blueGray,
        ship,
        [side * 1.04, -0.02, 0.7 - i * 1.05]
      );
    }
  }

  // Wing-mounted engine pods and orange intakes.
  for (const side of [-1, 1]) {
    addMesh(
      new THREE.CylinderGeometry(0.43, 0.55, 2.5, 10),
      blueGray,
      ship,
      [side * 3, -0.48, -0.25],
      [Math.PI / 2, 0, 0]
    );

    addMesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.12, 10),
      orange,
      ship,
      [side * 3, -0.48, 1.02],
      [Math.PI / 2, 0, 0]
    );
  }

  // Landing gear.
  for (const side of [-1, 1]) {
    addCylinderBetween(
      ship,
      [side * 0.75, -0.65, 1],
      [side * 0.95, -1.75, 1.3],
      0.11,
      metal
    );

    addCylinderBetween(
      ship,
      [side * 0.75, -0.65, -2.3],
      [side * 0.95, -1.75, -2.5],
      0.11,
      metal
    );
  }

  // Soft shadow beneath the spacecraft.
  const shadow = addMesh(
    new THREE.CircleGeometry(7.8, 48),
    new THREE.MeshBasicMaterial({
      color: 0x080a0e,
      transparent: true,
      opacity: 0.32,
      depthWrite: false
    }),
    scene,
    [0, 0.025, 0],
    [-Math.PI / 2, 0, 0]
  );

  shadow.name = "RustbucketGroundShadow";
  shadow.scale.set(1.35, 0.68, 1);
  shadow.castShadow = false;
  shadow.receiveShadow = false;

  return { ship, shadow };
}
