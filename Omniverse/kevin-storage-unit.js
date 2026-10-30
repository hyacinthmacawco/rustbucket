import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

export function createKevinStorageUnit(scene) {
  function standardMaterial(color, roughness = 0.9, extra = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: 0.05,
      ...extra
    });
  }

  const concrete = standardMaterial(0x51545a);
  const wall = standardMaterial(0x464b46);
  const darkWall = standardMaterial(0x202731);
  const roof = standardMaterial(0x151923);
  const metal = standardMaterial(0x323b46, 0.65);
  const trim = standardMaterial(0x171b21, 0.65);

  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x7c9a99,
    emissive: 0x233e42,
    emissiveIntensity: 0.3,
    roughness: 0.45,
    metalness: 0.1
  });

  const unit = new THREE.Group();
  unit.name = "KevinStorageUnit";
  scene.add(unit);

  function addBox(
    width, height, depth,
    material, x, y, z
  ) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    unit.add(mesh);

    return mesh;
  }

  function addBeam(start, end, thickness, material) {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const direction = new THREE.Vector3().subVectors(b, a);

    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(
        thickness,
        direction.length(),
        thickness
      ),
      material
    );

    beam.position.copy(a).add(b).multiplyScalar(0.5);
    beam.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );

    beam.castShadow = true;
    beam.receiveShadow = true;
    unit.add(beam);

    return beam;
  }

  // Concrete floor and top surface.
  addBox(34, 0.35, 32, concrete, 0, -0.2, -1);

  addBox(
    33.8, 0.04, 31.8,
    standardMaterial(0x5c5f64),
    0, -0.015, -1
  );

  // Back wall and side walls.
  addBox(34, 12, 0.6, wall, 0, 5.8, -16);
  addBox(0.6, 12, 31, darkWall, -17, 5.8, -0.5);
  addBox(0.6, 12, 31, darkWall, 17, 5.8, -0.5);

  // Roof.
  addBox(34, 0.45, 32, roof, 0, 11.9, -1);

  for (let z = -14; z <= 10; z += 6) {
    addBeam(
      [-16.5, 11.3, z],
      [16.5, 11.3, z],
      0.22,
      metal
    );
  }

  // Front structural pillars.
  addBox(0.65, 11.5, 0.75, trim, -16.3, 5.65, 14.2);
  addBox(0.65, 11.5, 0.75, trim, 16.3, 5.65, 14.2);

  // Upper front wall above the entrance.
  addBox(25.5, 3.1, 0.55, darkWall, 0, 10.05, 14.2);

  // Front facade side sections.
  addBox(4.2, 7.8, 0.55, wall, -14.2, 4.1, 14.2);
  addBox(4.2, 7.8, 0.55, wall, 14.2, 4.1, 14.2);

  // High windows on the back wall, with dividers.
  for (let x = -12; x <= 12; x += 6) {
    addBox(3.4, 1.55, 0.08, windowMaterial, x, 8.9, -15.65);

    for (let dx = -1; dx <= 1; dx++) {
      addBox(
        0.055, 1.65, 0.1,
        trim,
        x + dx * 1.05, 8.9, -15.55
      );
    }

    addBox(3.5, 0.06, 0.1, trim, x, 8.9, -15.55);
  }

  // Windows along the left side wall.
  for (let z = -10; z <= 8; z += 4) {
    addBox(0.08, 1.5, 3.2, windowMaterial, -16.65, 8.6, z);
  }

  // Industrial vertical wall supports.
  for (let z = -14; z <= 10; z += 4) {
    addBox(0.18, 10.8, 0.2, trim, -16.6, 5.5, z);
    addBox(0.18, 10.8, 0.2, trim, 16.6, 5.5, z);
  }

  // Concrete floor seams.
  const floorLines = standardMaterial(0x292e35, 1);

  for (let z = -13; z <= 13; z += 4) {
    addBox(33, 0.012, 0.025, floorLines, 0, 0.012, z);
  }

  for (let x = -14; x <= 14; x += 5) {
    addBox(0.025, 0.012, 29, floorLines, x, 0.013, -1);
  }

  return { unit };
}
