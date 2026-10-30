import { dimensions } from '../storage/state.js';
export function createKevin (THREE) {
  const root = new THREE.Group();
  root.name = 'Kevin';

  const body = new THREE.Group();
  body.name = 'KevinBody';
  root.add(body);

  const material = (color, roughness = 0.85) =>
    new THREE.MeshStandardMaterial({ color, roughness });

  const skin = material(0xd5a18e);
  const skinShadow = material(0x986d63);
  const hair = material(0x111019);
  const hairLight = material(0x252b43);
  const shirt = material(0x111114);
  const green = material(0x416c82);
  const greenDark = material(0x293c59);
  const pants = material(0x293c59);
  const pantsLight = material(0x465a78);
  const pantsDark = material(0x17263c);
  const shoe = material(0x515b6b);
  const white = material(0x687b91);
  const sole = material(0x303b4b);

  function mesh(geometry, mat, parent, position, scale) {
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(...position);

    if (scale) object.scale.set(...scale);

    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  function box(parent, mat, position, size) {
    return mesh(
      new THREE.BoxGeometry(...size),
      mat,
      parent,
      position
    );
  }

  function sphere(parent, mat, position, scale) {
    return mesh(
      new THREE.SphereGeometry(1, 16, 12),
      mat,
      parent,
      position,
      scale
    );
  }

  function capsule(parent, mat, a, b, radius, segments = 8) {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const direction = end.clone().sub(start);

    const object = mesh(
      new THREE.CapsuleGeometry(radius, direction.length(), 4, segments),
      mat,
      parent,
      start.clone().add(end).multiplyScalar(0.5).toArray()
    );

    object.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );

    return object;
  }

  // --------------------------------------------------
  // HEAD: intentionally blank, with no facial features.
  // --------------------------------------------------

  const head = new THREE.Group();
  head.name = 'Head';
  head.position.set(0, 3.12, 0);
  body.add(head);

  sphere(head, skin, [0, 0, 0], [0.37, 0.46, 0.32]);

  // Neck.
  capsule(
    body, skin,
    [0, 2.48, 0],
    [0, 2.83, 0],
    0.15
  );

  // Kevin's dark hair with long side locks and a rear length.
  sphere(head, hair, [0, 0.27, -0.025], [0.40, 0.25, 0.35]);
  sphere(head, hair, [0, -0.12, -0.18], [0.34, 0.36, 0.18]);
  sphere(head, hairLight, [-0.10, 0.39, 0.17], [0.15, 0.09, 0.08]);
  for (const side of [-1, 1]) {
    const lock = mesh(new THREE.ConeGeometry(0.12, 0.68, 8), hair, head, [side * 0.28, -0.18, 0.04]);
    lock.rotation.z = side * -0.08;
    sphere(head, hair, [side * 0.29, -0.25, -0.10], [0.11, 0.34, 0.13]);
  }

  // --------------------------------------------------
  // TORSO: black shirt with green center stripe.
  // --------------------------------------------------

  const torso = new THREE.Group();
  torso.name = 'Torso';
  torso.position.y = 2.12;
  body.add(torso);

  sphere(torso, shirt, [0, 0.12, 0], [0.43, 0.61, 0.25]);

  // Main shirt body.
  box(torso, shirt, [0, -0.17, 0], [0.69, 0.90, 0.40]);

  // Green vertical shirt stripe.
  box(torso, green, [0, -0.16, 0.207], [0.19, 0.90, 0.018]);

  // Green shoulder panels.
  sphere(torso, green, [-0.25, 0.38, 0.015], [0.19, 0.19, 0.22]);
  sphere(torso, green, [0.25, 0.38, 0.015], [0.19, 0.19, 0.22]);

  // Collar.
  const collar = mesh(
    new THREE.TorusGeometry(0.17, 0.035, 6, 16),
    green,
    torso,
    [0, 0.52, 0],
    [1, 0.7, 0.8]
  );
  collar.rotation.x = Math.PI / 2;

  // --------------------------------------------------
  // ARMS: pivoted at the shoulders.
  // --------------------------------------------------

  const arms = [];

  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.name = side < 0 ? 'LeftArm' : 'RightArm';
    shoulder.position.set(side * 0.39, 0.30, 0);
    torso.add(shoulder);
    arms.push(shoulder);

    // Green-and-black short sleeve.
    sphere(
      shoulder, shirt,
      [side * 0.035, -0.10, 0],
      [0.16, 0.24, 0.19]
    );

    sphere(
      shoulder, green,
      [side * 0.04, -0.22, 0.015],
      [0.15, 0.09, 0.19]
    );

    // Upper arm and forearm.
    capsule(
      shoulder, skin,
      [0, -0.25, 0],
      [side * 0.015, -0.61, 0],
      0.105
    );

    const elbow = new THREE.Group();
    elbow.position.set(side * 0.015, -0.61, 0);
    shoulder.add(elbow);
    shoulder.userData.elbow = elbow;

    capsule(
      elbow, skin,
      [0, 0, 0],
      [side * 0.015, -0.47, 0.015],
      0.09
    );

    sphere(
      elbow, skin,
      [side * 0.015, -0.53, 0.015],
      [0.105, 0.12, 0.10]
    );

    // Simple hands, without individual fingers.
    sphere(
      elbow, skin,
      [side * 0.015, -0.62, 0.02],
      [0.115, 0.14, 0.09]
    );
  }

  // --------------------------------------------------
  // PANTS AND LEGS.
  // --------------------------------------------------

  box(body, pants, [0, 1.10, 0], [0.52, 0.48, 0.34]);

  const legs = [];

  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.name = side < 0 ? 'LeftLeg' : 'RightLeg';
    hip.position.set(side * 0.17, 1.10, 0);
    body.add(hip);
    legs.push(hip);

    // Wide brown trouser legs.
    capsule(
      hip, pants,
      [0, 0, 0],
      [side * 0.015, -0.90, 0],
      0.17,
      10
    );

    // Outer trouser seam.
    capsule(
      hip, pantsDark,
      [side * 0.10, -0.05, 0.12],
      [side * 0.10, -0.85, 0.12],
      0.025
    );

    // Cargo pocket on each outer thigh.
    const pocket = box(
      hip,
      pantsLight,
      [side * 0.15, -0.48, 0.10],
      [0.19, 0.27, 0.08]
    );
    pocket.rotation.z = side * -0.10;

    box(
      hip,
      pantsDark,
      [side * 0.15, -0.36, 0.15],
      [0.18, 0.045, 0.025]
    );

    // Shoe pivot.
    const foot = new THREE.Group();
    foot.name = 'Foot';
    foot.position.set(0, -0.94, 0.08);
    hip.add(foot);
    hip.userData.foot = foot;

    // White sneaker sole.
    box(
      foot, sole,
      [0, -0.075, 0.10],
      [0.35, 0.10, 0.52]
    );

    // Sneaker upper.
    sphere(
      foot, shoe,
      [0, 0, 0.10],
      [0.17, 0.12, 0.25]
    );

    // White toe.
    sphere(
      foot, white,
      [0, -0.015, 0.25],
      [0.16, 0.085, 0.12]
    );

    // Green sneaker accent.
    box(
      foot, green,
      [0, 0.055, 0.09],
      [0.22, 0.025, 0.24]
    );
  }

  // Kevin's signature suspenders, striped scarf, necklace and jean details.
  for (const side of [-1, 1]) {
    box(torso, green, [side * 0.20, -0.10, 0.215], [0.075, 0.72, 0.045]);
    box(torso, greenDark, [side * 0.20, -0.39, 0.245], [0.15, 0.16, 0.025]);
    sphere(torso, white, [side * 0.20, -0.39, 0.263], [0.018, 0.018, 0.012]);
  }
  const scarf = mesh(new THREE.TorusGeometry(0.17, 0.045, 8, 24), greenDark, torso, [0, 0.49, 0]);
  scarf.rotation.x = Math.PI / 2;
  box(torso, white, [0, 0.35, 0.23], [0.30, 0.035, 0.025]);
  const necklace = mesh(new THREE.TorusGeometry(0.14, 0.012, 8, 24, Math.PI), white, torso, [0, 0.26, 0.18]);
  necklace.rotation.x = Math.PI;
  box(torso, white, [0, 0.08, 0.23], [0.13, 0.12, 0.035]);
  box(body, pantsLight, [0, 1.10, 0.18], [0.48, 0.10, 0.025]);
  box(body, pantsLight, [0.15, 0.68, 0.18], [0.16, 0.09, 0.025]);

  // --------------------------------------------------
  // CHARACTER CONTROL / PROCEDURAL ANIMATION.
  // --------------------------------------------------

  let animation = 'idle';
  let elapsed = 0;
  let verticalVelocity = 0;
  let grounded = true;

  root.position.set(...dimensions.kevin.position);
  root.scale.set(...dimensions.kevin.scale);
  const baseY = dimensions.kevin.position[1];
  root.position.y = baseY;

  root.userData.setAnimation = function (name) {
    const allowed = ['idle', 'walk', 'run', 'jump'];

    if (!allowed.includes(name)) {
      throw new Error(
        `Unknown Kevin animation "${name}". Use: ${allowed.join(', ')}`
      );
    }

    animation = name;
  };

  root.userData.jump = function (strength = 4.8) {
    if (!grounded) return;

    verticalVelocity = strength;
    grounded = false;
    animation = 'jump';
  };

  root.userData.update = function (deltaTime) {
    const dt = Math.min(deltaTime, 0.05);
    elapsed += dt;

    const walking = animation === 'walk' || animation === 'run';
    const speed = animation === 'run' ? 12 : 7;
    const swing = walking ? Math.sin(elapsed * speed) : 0;

    // Arm swing.
    arms.forEach((arm, index) => {
      const side = index === 0 ? -1 : 1;

      arm.rotation.x = walking
        ? swing * 0.45 * side
        : THREE.MathUtils.damp(arm.rotation.x, 0, 8, dt);

      arm.userData.elbow.rotation.x = walking
        ? Math.max(0, -swing * side) * 0.45
        : THREE.MathUtils.damp(
            arm.userData.elbow.rotation.x, 0, 8, dt
          );
    });

    // Leg swing.
    legs.forEach((leg, index) => {
      const side = index === 0 ? -1 : 1;

      leg.rotation.x = walking
        ? swing * 0.55 * side
        : THREE.MathUtils.damp(leg.rotation.x, 0, 8, dt);

      leg.userData.foot.rotation.x = walking
        ? Math.max(0, swing * side) * 0.35
        : THREE.MathUtils.damp(
            leg.userData.foot.rotation.x, 0, 8, dt
          );
    });

    // Slight torso movement while walking.
    torso.rotation.z = walking ? swing * 0.025 : 0;
    torso.position.y = 2.12 + (
      walking ? Math.abs(Math.sin(elapsed * speed * 2)) * 0.025 : 0
    );

    // Basic gravity and jump.
    if (!grounded) {
      verticalVelocity -= 12 * dt;
      root.position.y += verticalVelocity * dt;

      if (root.position.y <= baseY) {
        root.position.y = baseY;
        verticalVelocity = 0;
        grounded = true;
        animation = 'idle';
      }
    }
  };

  // Convenience methods.
  root.setAnimation = root.userData.setAnimation;
  root.jump = root.userData.jump;
  root.update = root.userData.update;

  return root;
}
