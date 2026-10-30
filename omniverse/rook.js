import * as THREE from 'three';

export function createRook() {
  const rook = new THREE.Group();
  rook.name = 'Rook';

  const mat = (color, metalness = 0) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      metalness
    });

  const skin = mat(0xc8d5dc);
  const skinShade = mat(0x8296ad);
  const black = mat(0x101116);
  const blackLight = mat(0x24232f);
  const blue = mat(0x304e80);
  const blueLight = mat(0x496a9e);
  const armor = mat(0x8799ae, 0.2);
  const armorDark = mat(0x53677f, 0.15);
  const toolBlack = mat(0x17191f, 0.25);
  const toolMetal = mat(0x999987, 0.25);

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
      new THREE.CylinderGeometry(
        radiusB,
        radiusA,
        direction.length(),
        14
      ),
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
    const hipX = side * 0.13;

    // Upper legs
    limb(
      rook, black,
      [hipX, 1.75, 0],
      [side * 0.15, 1.05, 0],
      0.115, 0.085
    );

    // Knees
    ellipsoid(
      rook, black,
      side * 0.15, 1.03, 0,
      0.09, 0.11, 0.09
    );

    // Lower legs
    limb(
      rook, black,
      [side * 0.15, 1.02, 0],
      [side * 0.17, 0.40, 0],
      0.08, 0.055
    );

    // Blue shin armor
    ellipsoid(
      rook, blue,
      side * 0.17, 0.62, 0.035,
      0.085, 0.27, 0.09
    );

    // Metallic outer shin plate
    ellipsoid(
      rook, armor,
      side * 0.23, 0.63, 0.005,
      0.045, 0.18, 0.07
    );

    // Back of shin armor
    ellipsoid(
      rook, armorDark,
      side * 0.18, 0.62, -0.065,
      0.07, 0.20, 0.035
    );

    // Ankle
    ellipsoid(
      rook, black,
      side * 0.17, 0.24, 0,
      0.06, 0.10, 0.07
    );

    // Feet
    ellipsoid(
      rook, blue,
      side * 0.17, 0.12, 0.09,
      0.105, 0.10, 0.23
    );

    // Black toe caps
    ellipsoid(
      rook, black,
      side * 0.17, 0.10, 0.23,
      0.11, 0.075, 0.11
    );

    // Shoe soles
    box(
      rook, armor,
      side * 0.17, 0.035, 0.09,
      0.23, 0.045, 0.43
    );

    // Outer knee/leg armor
    ellipsoid(
      rook, armor,
      side * 0.22, 1.08, -0.015,
      0.055, 0.16, 0.09
    );
  }

  // -------------------------
  // PELVIS AND WAIST
  // -------------------------

  ellipsoid(rook, black, 0, 1.77, 0, 0.22, 0.20, 0.14);

  // Blue waist armor
  box(rook, blue, 0, 1.76, 0.035, 0.39, 0.22, 0.25);

  // Central lower abdomen armor
  ellipsoid(
    rook, black,
    0, 1.60, 0.04,
    0.16, 0.18, 0.12
  );

  // Side hip armor
  for (const side of [-1, 1]) {
    ellipsoid(
      rook, armor,
      side * 0.23, 1.76, 0,
      0.075, 0.16, 0.13
    );
  }

  // -------------------------
  // TORSO
  // -------------------------

  // Main black bodysuit
  ellipsoid(
    rook, black,
    0, 2.18, 0,
    0.29, 0.47, 0.18
  );

  // Upper chest
  ellipsoid(
    rook, black,
    0, 2.42, 0,
    0.31, 0.22, 0.18
  );

  // Blue chest armor
  ellipsoid(
    rook, blue,
    0, 2.32, 0.125,
    0.28, 0.29, 0.085
  );

  // Upper chest armor plate
  box(
    rook, blue,
    0, 2.47, 0.15,
    0.46, 0.18, 0.075
  );

  // Central chest plate
  ellipsoid(
    rook, blueLight,
    0, 2.19, 0.19,
    0.16, 0.23, 0.045
  );

  // Chest plate lower border
  box(
    rook, black,
    0, 2.00, 0.16,
    0.27, 0.07, 0.07
  );

  // Neck
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.12, 0.25, 16),
    skin
  );
  neck.position.set(0, 2.78, 0);
  neck.castShadow = true;
  rook.add(neck);

  // Black neck suit
  ellipsoid(
    rook, black,
    0, 2.68, 0,
    0.17, 0.11, 0.15
  );

  // -------------------------
  // SHOULDERS
  // -------------------------

  for (const side of [-1, 1]) {
    // Black shoulder base
    ellipsoid(
      rook, black,
      side * 0.31, 2.44, 0,
      0.16, 0.16, 0.16
    );

    // Blue shoulder plates
    ellipsoid(
      rook, blue,
      side * 0.37, 2.43, 0.025,
      0.17, 0.15, 0.17
    );

    // Shoulder armor highlight
    ellipsoid(
      rook, blueLight,
      side * 0.39, 2.47, 0.10,
      0.11, 0.09, 0.07
    );
  }

  // -------------------------
  // ARMS
  // -------------------------

  for (const side of [-1, 1]) {
    const shoulderX = side * 0.40;
    const elbowX = side * 0.46;
    const wristX = side * 0.49;

    // Upper arm
    limb(
      rook, black,
      [shoulderX, 2.39, 0],
      [elbowX, 1.88, 0],
      0.105, 0.075
    );

    // Elbow
    ellipsoid(
      rook, black,
      elbowX, 1.87, 0,
      0.085, 0.09, 0.08
    );

    // Forearm
    limb(
      rook, black,
      [elbowX, 1.86, 0],
      [wristX, 1.24, 0],
      0.08, 0.06
    );

    // Blue forearm armor
    ellipsoid(
      rook, blue,
      side * 0.48, 1.53, 0.025,
      0.09, 0.25, 0.10
    );

    // Metallic forearm plate
    ellipsoid(
      rook, armor,
      side * 0.48, 1.52, 0.09,
      0.065, 0.20, 0.045
    );

    // Wrist
    ellipsoid(
      rook, skinShade,
      wristX, 1.20, 0,
      0.07, 0.07, 0.065
    );

    // Hand palm
    ellipsoid(
      rook, skinShade,
      wristX, 1.12, 0.025,
      0.085, 0.11, 0.07
    );

    // Three long fingers
    for (let f = 0; f < 3; f++) {
      const offset = (f - 1) * 0.065;

      limb(
        rook, skinShade,
        [wristX + offset, 1.08, 0.045],
        [wristX + offset * 1.35, 0.94, 0.065],
        0.025, 0.016
      );
    }

    // Opposing thumb
    limb(
      rook, skinShade,
      [wristX - side * 0.075, 1.13, 0.025],
      [wristX - side * 0.14, 1.04, 0.06],
      0.03, 0.018
    );
  }

  // -------------------------
  // HEAD
  // -------------------------

  // Main blank alien head
  ellipsoid(
    rook, skin,
    0, 3.08, 0,
    0.20, 0.27, 0.17
  );

  // Lower jaw shape
  ellipsoid(
    rook, skin,
    0, 2.94, 0.025,
    0.17, 0.14, 0.15
  );

  // Dark side head markings
  for (const side of [-1, 1]) {
    ellipsoid(
      rook, black,
      side * 0.16, 3.09, 0.035,
      0.045, 0.19, 0.055
    );
  }

  // Rear head structure
  ellipsoid(
    rook, skinShade,
    0, 3.12, -0.12,
    0.19, 0.23, 0.075
  );

  // Top head markings
  ellipsoid(
    rook, black,
    0, 3.29, -0.005,
    0.12, 0.065, 0.13
  );

  // Side head fins
  for (const side of [-1, 1]) {
    const fin = new THREE.Mesh(
      new THREE.ConeGeometry(0.105, 0.27, 8),
      skinShade
    );

    fin.position.set(side * 0.20, 3.06, -0.025);
    fin.rotation.z = -side * Math.PI / 2.7;
    fin.castShadow = true;
    rook.add(fin);
  }

  // -------------------------
  // PROTO-TOOL ON BACK
  // -------------------------

  // Main tool housing
  const tool = new THREE.Group();
  tool.name = 'ProtoTool';
  tool.position.set(0.30, 2.67, -0.19);
  tool.rotation.z = -0.12;
  tool.rotation.x = -0.08;
  rook.add(tool);

  // Long main casing
  box(
    tool, toolBlack,
    0, 0.31, 0,
    0.23, 1.00, 0.23
  );

  // Upper casing
  ellipsoid(
    tool, toolBlack,
    0, 0.79, 0,
    0.16, 0.22, 0.15
  );

  // Main metallic side panel
  box(
    tool, toolMetal,
    0.12, 0.27, 0.025,
    0.045, 0.67, 0.16
  );

  // Lower metallic panel
  box(
    tool, armorDark,
    0.13, -0.15, 0.025,
    0.045, 0.19, 0.17
  );

  // Tool upper tip
  const toolTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.13, 0.25, 6),
    toolBlack
  );
  toolTip.position.set(0, 0.93, 0);
  toolTip.castShadow = true;
  tool.add(toolTip);

  // Side mechanical ridges
  for (let i = 0; i < 3; i++) {
    const ridge = box(
      tool,
      blackLight,
      0.03,
      0.48 - i * 0.16,
      0.13,
      0.18,
      0.07,
      0.045
    );
    ridge.rotation.z = -0.3;
  }

  // Tool bottom connector
  ellipsoid(
    tool, armorDark,
    0, -0.22, 0,
    0.13, 0.09, 0.13
  );

  // Shoulder mounting bracket
  box(
    rook, blackLight,
    0.28, 2.42, -0.14,
    0.18, 0.32, 0.12
  );

  // Final scale
  rook.scale.set(1, 1.05, 1);

  return rook;
}
