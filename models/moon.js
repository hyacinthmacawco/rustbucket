import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

export function createMoon(scene) {
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 48, 32),
    new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: 1
    })
  );

  moon.position.set(6.8, 0.2, -1.5);
  scene.add(moon);

  return { moon };
}
