import * as THREE from "three";
import { dimensions } from "../storage/state.js";

export function createMoon(parent) {
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(dimensions.moon.radius, 48, 32),
    new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.95 })
  );
  moon.position.set(...dimensions.moon.position);
  parent.add(moon);
  return { moon };
}
