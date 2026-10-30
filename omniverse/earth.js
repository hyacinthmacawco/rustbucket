import { dimensions } from '../storage/state.js';
const d = dimensions.earth.values;
import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

export function createEarth(scene) {
  const earthPosition = [d[0], d[1], d[2]];
  const earthRadius = d[3];

  const earthMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: d[4],
    metalness: d[5]
  });

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius, d[6], d[7]),
    earthMaterial
  );

  earth.position.set(...earthPosition);
  scene.add(earth);

  // Local Earth surface texture
  const textureLoader = new THREE.TextureLoader();

  textureLoader.load(
    "./models/earth.jpg",
    texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      earthMaterial.map = texture;
      earthMaterial.needsUpdate = true;
    },
    undefined,
    error => {
      console.warn("Could not load Earth texture:", error);
    }
  );

  // Atmosphere
  const earthGroup = new THREE.Group();
  earthGroup.position.set(...earthPosition);
  scene.add(earthGroup);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(
      earthRadius * d[8],
      d[9],
      d[10]
    ),
    new THREE.MeshBasicMaterial({
      color: 0x4b9fff,
      transparent: true,
      opacity: d[11],
      side: THREE.BackSide,
      depthWrite: false
    })
  );

  earthGroup.add(atmosphere);

  // Outer atmosphere
  const outerAtmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(
      earthRadius * d[12],
      d[13],
      d[14]
    ),
    new THREE.MeshBasicMaterial({
      color: 0x216eff,
      transparent: true,
      opacity: d[15],
      side: THREE.BackSide,
      depthWrite: false
    })
  );

  earthGroup.add(outerAtmosphere);

  return { earth, earthGroup };
}
