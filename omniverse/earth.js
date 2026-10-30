import * as THREE from "three";
import { dimensions } from "../storage/state.js";

export function createEarth(parent) {
  const earthPosition = dimensions.earth.position;
  const earthRadius = dimensions.earth.radius;

  const earthMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.85, metalness: 0.05
  });
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius, 64, 48),
    earthMaterial
  );
  earth.position.set(...earthPosition);
  parent.add(earth);

  new THREE.TextureLoader().load(
    "./omniverse/earth.jpg",
    texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      earthMaterial.map = texture;
      earthMaterial.needsUpdate = true;
    },
    undefined,
    error => console.warn("Could not load Earth texture:", error)
  );

  const earthGroup = new THREE.Group();
  earthGroup.position.set(...earthPosition);
  parent.add(earthGroup);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius * 1.045, 64, 48),
    new THREE.MeshBasicMaterial({
      color: 0x4b9fff, transparent: true, opacity: 0.12,
      side: THREE.BackSide, depthWrite: false
    })
  );
  earthGroup.add(atmosphere);

  const outerAtmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius * 1.12, 64, 48),
    new THREE.MeshBasicMaterial({
      color: 0x216eff, transparent: true, opacity: 0.04,
      side: THREE.BackSide, depthWrite: false
    })
  );
  earthGroup.add(outerAtmosphere);

  return { earth, earthGroup };
}
