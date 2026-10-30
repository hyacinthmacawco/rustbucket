import * as THREE from 'three';
import { dimensions } from '../storage/state.js';

export function createSun(scene) {
  const sunPosition = dimensions.sun.position;

  // Sun surface
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff
  });

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(dimensions.sun.radius, 64, 48),
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
    new THREE.SphereGeometry(d[6], d[7], d[8]),
    new THREE.MeshBasicMaterial({
      color: 0xff8a2a,
      transparent: true,
      opacity: d[9],
      side: THREE.BackSide,
      depthWrite: false
    })
  );

  sunAura.position.set(...sunPosition);
  scene.add(sunAura);

  // Outer glow
  const sunOuterGlow = new THREE.Mesh(
    new THREE.SphereGeometry(d[10], d[11], d[12]),
    new THREE.MeshBasicMaterial({
      color: 0xff671f,
      transparent: true,
      opacity: d[13],
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
