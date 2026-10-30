import { dimensions } from '../storage/state.js';
export function createGwen (THREE) {
  const root = new THREE.Group();
  root.name = 'Gwen';

  const body = new THREE.Group();
  body.name = 'GwenBody';
  root.add(body);

  const material = (color, roughness = 0.85) =>
    new THREE.MeshStandardMaterial({ color, roughness });

  const skin = material(0xe9b6a5);
  const skinShadow = material(0xc98778);
  const hair = material(0xd95720);
  const hairLight = material(0xf17a35);
  const shirt = material(0x315c88);
  const green = material(0x72b6d5);
  const greenDark = material(0x426b9a);
  const pants = material(0x315c88);
  const pantsLight = material(0x426b9a);
  const pantsDark = material(0x203d63);
  const shoe = material(0x172d4b);
  const white = material(0xe5e9e9);
  const sole = material(0xc8d5df);

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

  // Hair cap and rear hair mass.
  sphere(head, hair, [0, 0.27, -0.015], [0.39, 0.25, 0.35]);

  // Side and back hair.
  sphere(head, hair, [-0.29, 0.02, -0.01], [0.13, 0.31, 0.32]);
  sphere(head, hair, [0.29, 0.02, -0.01], [0.13, 0.29, 0.30]);
  sphere(head, hair, [0, -0.12, -0.21], [0.32, 0.22, 0.20]);

  // Angular hair spikes, all made from simple cones.
  function spike(parent, position, rotation, size) {
    const part = mesh(
      new THREE.ConeGeometry(size, size * 1.8, 5),
      hair,
      parent,
      position,
      [1, 1, 0.7]
    );
    part.rotation.set(...rotation);
    return part;
  }

  spike(head, [-0.16, 0.43, -0.04], [0, 0, 0.9], 0.13);
  spike(head, [0.02, 0.48, -0.03], [0, 0, 0.25], 0.12);
  spike(head, [0.18, 0.42, -0.02], [0, 0, -0.9], 0.11);

  // Gwen's flared blue skirt is fixed to the pelvis, not the animated legs.
  const skirt = mesh(
    new THREE.CylinderGeometry(0.25, 0.39, 0.48, 10),
    pants,
    body,
    [0, 1.22, 0]
  );
  skirt.name = "GwenSkirt";

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

  // --------------------------------------------------
  // CHARACTER CONTROL / PROCEDURAL ANIMATION.
  // --------------------------------------------------

  let animation = 'idle';
  let elapsed = 0;
  let verticalVelocity = 0;
  let grounded = true;

  root.position.set(...dimensions.gwen.position);
  root.scale.set(...dimensions.gwen.scale);
  const baseY = dimensions.gwen.position[1];
  root.position.y = baseY;

  root.userData.setAnimation = function (name) {
    const allowed = ['idle', 'walk', 'run', 'jump'];

    if (!allowed.includes(name)) {
      throw new Error(
        `Unknown Gwen animation "${name}". Use: ${allowed.join(', ')}`
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
