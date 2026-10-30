import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

export function createEarth(scene) {
  const earthPosition = [4.5, 0, 0];
  const earthRadius = 2.05;

  const earthMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0
  });

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius, 64, 48),
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
      earthRadius * 1.045,
      64,
      48
    ),
    new THREE.MeshBasicMaterial({
      color: 0x4b9fff,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      depthWrite: false
    })
  );

  earthGroup.add(atmosphere);

  // Outer atmosphere
  const outerAtmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(
      earthRadius * 1.12,
      64,
      48
    ),
    new THREE.MeshBasicMaterial({
      color: 0x216eff,
      transparent: true,
      opacity: 0.045,
      side: THREE.BackSide,
      depthWrite: false
    })
  );

  earthGroup.add(outerAtmosphere);

  return { earth, earthGroup };
}
