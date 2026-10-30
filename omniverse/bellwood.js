import * as THREE from "three";
import { dimensions } from "../storage/state.js";

// Bellwood outdoor environment: sky, atmospheric fog, sunlight, roads,
// sidewalks, low-rise buildings, and roadside trees.
export function createBellwood(scene, parent = scene) {
  scene.background = new THREE.Color(0x78b9f5);
  scene.fog = new THREE.Fog(0xa6cbed, 75, 260);

  const root = new THREE.Group();
  root.name = "Bellwood";
  root.position.set(...dimensions.bellwood.position);
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

  // Broad ground and the street running in front of the storage facility.
  box(root, [520, 1, 520], [0, -1.2, 0], groundMat);
  box(root, [520, 0.12, 34], [0, -0.62, 70], asphaltMat);
  box(root, [520, 0.18, 5], [0, -0.48, 50], sidewalkMat);
  box(root, [520, 0.18, 5], [0, -0.48, 90], sidewalkMat);

  // Road center markings.
  const markingMat = new THREE.MeshBasicMaterial({ color: 0xd8d1a5 });
  for (let x = -245; x < 245; x += 18) {
    box(root, [9, 0.025, 0.22], [x, -0.54, 70], markingMat);
  }

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
        [x, height / 2 - 0.65, z],
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
      trunk.position.set(x, 1.5, z);
      trunk.castShadow = true;
      root.add(trunk);

      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(2.6, 10, 8),
        leafMats[i % leafMats.length]
      );
      crown.position.set(x, 4.5, z);
      crown.castShadow = true;
      root.add(crown);
    }
  }

  return { bellwood: root, sunlight };
}
