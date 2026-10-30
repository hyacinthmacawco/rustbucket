import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { dimensions } from '../storage/state.js';

export function createMoon(scene) {
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(dimensions.moon.radius, 48, 32),
    new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: d[3]
    })
  );

  moon.position.set(...dimensions.moon.position);
  scene.add(moon);

  return { moon };
}
