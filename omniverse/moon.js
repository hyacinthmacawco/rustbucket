import { dimensions } from '../storage/state.js';
const d = dimensions.moon.values;
import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

export function createMoon(scene) {
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(d[0], d[1], d[2]),
    new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: d[3]
    })
  );

  moon.position.set(d[4], d[5], -d[6]);
  scene.add(moon);

  return { moon };
}
