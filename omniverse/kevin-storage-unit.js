import { dimensions } from '../storage/state.js';
const d = dimensions.kevin-storage-unit.values;
import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

export function createKevinStorageUnit(scene) {
  function standardMaterial(color, roughness = d[0], extra = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: d[1],
      ...extra
    });
  }

  const concrete = standardMaterial(0x51545a);
  const wall = standardMaterial(0x464b46);
  const darkWall = standardMaterial(0x202731);
  const roof = standardMaterial(0x151923);
  const metal = standardMaterial(0x323b46, d[2]);
  const trim = standardMaterial(0x171b21, d[3]);

  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x7c9a99,
    emissive: 0x233e42,
    emissiveIntensity: d[4],
    roughness: d[5],
    metalness: d[6]
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

    beam.position.copy(a).add(b).multiplyScalar(d[7]);
    beam.quaternion.setFromUnitVectors(
      new THREE.Vector3(d[8], d[9], d[10]),
      direction.normalize()
    );

    beam.castShadow = true;
    beam.receiveShadow = true;
    unit.add(beam);

    return beam;
  }

  // Concrete floor and top surface.
  addBox(d[11], d[12], d[13], concrete, d[14], -d[15], -d[16]);

  addBox(
    d[17], d[18], d[19],
    standardMaterial(0x5c5f64),
    d[20], -d[21], -d[22]
  );

  // Back wall and side walls.
  addBox(d[23], d[24], d[25], wall, d[26], d[27], -d[28]);
  addBox(d[29], d[30], d[31], darkWall, -d[32], d[33], -d[34]);
  addBox(d[35], d[36], d[37], darkWall, d[38], d[39], -d[40]);

  // Roof.
  addBox(d[41], d[42], d[43], roof, d[44], d[45], -d[46]);

  for (let z = -d[47]; z <= d[48]; z += d[49]) {
    addBeam(
      [-d[50], d[51], z],
      [d[52], d[53], z],
      d[54],
      metal
    );
  }

  // Front structural pillars.
  addBox(d[55], d[56], d[57], trim, -d[58], d[59], d[60]);
  addBox(d[61], d[62], d[63], trim, d[64], d[65], d[66]);

  // Upper front wall above the entrance.
  addBox(d[67], d[68], d[69], darkWall, d[70], d[71], d[72]);

  // Front facade side sections.
  addBox(d[73], d[74], d[75], wall, -d[76], d[77], d[78]);
  addBox(d[79], d[80], d[81], wall, d[82], d[83], d[84]);

  // High windows on the back wall, with dividers.
  for (let x = -d[85]; x <= d[86]; x += d[87]) {
    addBox(d[88], d[89], d[90], windowMaterial, x, d[91], -d[92]);

    for (let dx = -d[93]; dx <= d[94]; dx++) {
      addBox(
        d[95], d[96], d[97],
        trim,
        x + dx * d[98], d[99], -d[100]
      );
    }

    addBox(d[101], d[102], d[103], trim, x, d[104], -d[105]);
  }

  // Windows along the left side wall.
  for (let z = -d[106]; z <= d[107]; z += d[108]) {
    addBox(d[109], d[110], d[111], windowMaterial, -d[112], d[113], z);
  }

  // Industrial vertical wall supports.
  for (let z = -d[114]; z <= d[115]; z += d[116]) {
    addBox(d[117], d[118], d[119], trim, -d[120], d[121], z);
    addBox(d[122], d[123], d[124], trim, d[125], d[126], z);
  }

  // Concrete floor seams.
  const floorLines = standardMaterial(0x292e35, d[127]);

  for (let z = -d[128]; z <= d[129]; z += d[130]) {
    addBox(d[131], d[132], d[133], floorLines, d[134], d[135], z);
  }

  for (let x = -d[136]; x <= d[137]; x += d[138]) {
    addBox(d[139], d[140], d[141], floorLines, x, d[142], -d[143]);
  }

  return { unit };
}
