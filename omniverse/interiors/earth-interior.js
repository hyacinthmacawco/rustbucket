import * as THREE from "three";
import { dimensions } from "../../storage/dimensions.js";

// Earth interior environment: Bellwood sky, atmosphere, roads,
// sidewalks, low-rise buildings, and roadside trees.
export function createEarthInterior(scene, parent = scene) {
  scene.background = new THREE.Color(0x78b9f5);
  scene.fog = new THREE.Fog(0xa6cbed, 75, 260);

  const root = new THREE.Group();
  root.name = "EarthInterior";
  root.position.set(...dimensions.earthInterior.position);
  root.scale.set(...dimensions.bellwood.scale);
  parent.add(root);

  const sunlight = new THREE.DirectionalLight(0xffd39a, 3.0);
  sunlight.position.set(-35, 65, 45);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  sunlight.shadow.camera.left = -100;
  sunlight.shadow.camera.right = 100;
  sunlight.shadow.camera.top = 100;
  sunlight.shadow.camera.bottom = -100;
  root.add(sunlight);

  root.add(new THREE.HemisphereLight(0xb8dcff, 0x5a5040, 1.5));

  const mat = (color, roughness = 0.9) =>
    new THREE.MeshStandardMaterial({ color, roughness });

  const groundMat = mat(0x64734f);
  const asphaltMat = mat(0x343a40);
  const sidewalkMat = mat(0x9b9b91);
  const buildingMats = [0xb7b1a4, 0x9babb1, 0xc2b7a2, 0x8f9b91].map(c => mat(c));
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x7897a7,
    roughness: 0.35,
    metalness: 0.15,
    emissive: 0x172b36,
    emissiveIntensity: 0.12
  });
  const trunkMat = mat(0x594331);
  const leafMats = [0x456b3c, 0x527a43, 0x66834b].map(c => mat(c));

  function box(parent, size, position, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // The road and sidewalks are painted into the ground texture.
  const roadCanvas = document.createElement('canvas');
  roadCanvas.width = 1024; roadCanvas.height = 1024;
  const ctx = roadCanvas.getContext('2d');
  ctx.fillStyle = '#64734f'; ctx.fillRect(0,0,1024,1024);
  const roadY = 512 + (70 / 520) * 1024;
  const roadH = (34 / 520) * 1024; const walkH = (5 / 520) * 1024;
  ctx.fillStyle = '#9b9b91';
  ctx.fillRect(0,roadY-roadH/2-walkH,1024,walkH);
  ctx.fillRect(0,roadY+roadH/2,1024,walkH);
  ctx.fillStyle = '#343a40'; ctx.fillRect(0,roadY-roadH/2,1024,roadH);
  ctx.strokeStyle = '#d8d1a5'; ctx.lineWidth = 3; ctx.setLineDash([18,18]);
  ctx.beginPath(); ctx.moveTo(0,roadY); ctx.lineTo(1024,roadY); ctx.stroke();
  const roadTexture = new THREE.CanvasTexture(roadCanvas); roadTexture.colorSpace = THREE.SRGBColorSpace;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(520,520), new THREE.MeshStandardMaterial({map:roadTexture,roughness:1}));
  ground.rotation.x = -Math.PI/2; ground.position.y = -0.5; ground.receiveShadow = true; ground.userData.noPhysics = true; root.add(ground);

  // Urban blocks on both sides of the road, kept away from the camera's
  // immediate view of Kevin's storage unit.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const x = side * (42 + (i % 2) * 12);
      const z = -115 + i * 34;
      const width = 18 + (i % 3) * 5;
      const height = 13 + (i % 4) * 5;
      const depth = 20 + (i % 2) * 6;
      const building = box(
        root,
        [width, height, depth],
        [x, height / 2, z],
        buildingMats[i % buildingMats.length]
      );
      building.name = "BellwoodBuilding";

      for (let floor = 0; floor < Math.floor(height / 3.2); floor++) {
        for (let column = 0; column < 3; column++) {
          box(
            root,
            [1.8, 1.35, 0.08],
            [x - width * 0.28 + column * width * 0.28, 1.2 + floor * 3.1, z + depth / 2 + 0.05],
            windowMat
          );
        }
      }
    }
  }

  // Simple trees along the sidewalks.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 12; i++) {
      const x = side * 24;
      const z = 30 + i * 17;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.48, 4.2, 8),
        trunkMat
      );
      trunk.position.set(x, 2.1, z);
      trunk.castShadow = true;
      root.add(trunk);

      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(2.6, 10, 8),
        leafMats[i % leafMats.length]
      );
      crown.position.set(x, 5.1, z);
      crown.castShadow = true;
      root.add(crown);
    }
  }

  return { bellwood: root, sunlight };
}


// Kevin's storage unit and the team's suitcases are part of the Earth interior.
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
  unit.position.set(...dimensions.kevinStorageUnit.position);
  unit.scale.set(...dimensions.kevinStorageUnit.scale);
  scene.add(unit);

  // Interior ceiling and side lights belong to the storage-unit model.
  const ceilingLight = new THREE.PointLight(0xffe5c2, 65, 38, 1.5);
  ceilingLight.position.set(0, 10, -3);
  unit.add(ceilingLight);

  const sideLight = new THREE.PointLight(0xffc681, 30, 24, 2);
  sideLight.position.set(8, 5, 2);
  unit.add(sideLight);

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

export function createSuitcases(parent) {
  const owners = ["Ben", "Gwen", "Kevin", "Rook"];
  const colors = [0x263d35, 0x9a4f36, 0x394b69, 0x77715b];
  const suitcases = owners.map((owner, index) => {
    const group = new THREE.Group();
    group.name = `${owner[0].toUpperCase()}${owner.slice(1)}Suitcase`;
    group.position.set(19.5, -0.19, -9 + index * 6);
    group.userData.pickable = true;
    group.userData.owner = owner;
    group.userData.carriedBy = null;
    group.userData.stored = false;
    const shell = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.62, 0.42),
      new THREE.MeshStandardMaterial({ color: colors[index], roughness: 0.72 })
    );
    shell.castShadow = true;
    shell.receiveShadow = true;
    group.add(shell);
    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(0.91, 0.09, 0.43),
      new THREE.MeshStandardMaterial({ color: colors[index] ^ 0x202020, roughness: 0.65 })
    );
    lid.position.y = 0.34;
    group.add(lid);
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.035, 6, 12, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xc6c2ae, metalness: 0.55, roughness: 0.4 })
    );
    handle.rotation.z = Math.PI;
    handle.position.set(0, 0.42, 0);
    group.add(handle);
    parent.add(group);
    return group;
  });
  return { suitcases };
}

export class EarthInterior {
  constructor(...args) {
    Object.assign(this, createEarthInterior(...args));
  }
}

export class KevinStorageUnit {
  constructor(...args) { Object.assign(this, createKevinStorageUnit(...args)); }
}

export class Suitcases {
  constructor(...args) { Object.assign(this, createSuitcases(...args)); }
}
