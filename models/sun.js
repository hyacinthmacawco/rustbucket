import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

export function createSun(scene) {
  const sunPosition = [-50, 0, 0];

  // Sun surface
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff
  });

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(30.0, 64, 48),
    sunMaterial
  );

  sun.position.set(...sunPosition);
  scene.add(sun);

  // Load local Sun texture
  const textureLoader = new THREE.TextureLoader();

  textureLoader.load(
    "./models/sun.jpg",
    texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      sunMaterial.map = texture;
      sunMaterial.needsUpdate = true;
    },
    undefined,
    error => {
      console.warn("Could not load Sun texture:", error);
    }
  );

  // Inner glow
  const sunAura = new THREE.Mesh(
    new THREE.SphereGeometry(3.18, 64, 48),
    new THREE.MeshBasicMaterial({
      color: 0xff8a2a,
      transparent: true,
      opacity: 0.13,
      side: THREE.BackSide,
      depthWrite: false
    })
  );

  sunAura.position.set(...sunPosition);
  scene.add(sunAura);

  // Outer glow
  const sunOuterGlow = new THREE.Mesh(
    new THREE.SphereGeometry(3.65, 64, 48),
    new THREE.MeshBasicMaterial({
      color: 0xff671f,
      transparent: true,
      opacity: 0.055,
      side: THREE.BackSide,
      depthWrite: false
    })
  );

  sunOuterGlow.position.set(...sunPosition);
  scene.add(sunOuterGlow);

  return {
    sun,
    sunAura,
    sunOuterGlow
  };
}
