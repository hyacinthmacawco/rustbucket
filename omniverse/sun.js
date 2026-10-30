import * as THREE from "three";
import { dimensions } from "../storage/state.js";

export function createSun(parent) {
  const sunPosition = dimensions.sun.position;

  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(dimensions.sun.radius, 64, 48),
    sunMaterial
  );
  sun.position.set(...sunPosition);
  parent.add(sun);

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(
    "./omniverse/sun.jpg",
    texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      sunMaterial.map = texture;
      sunMaterial.needsUpdate = true;
    },
    undefined,
    error => console.warn("Could not load Sun texture:", error)
  );

  const sunAura = new THREE.Mesh(
    new THREE.SphereGeometry(dimensions.sun.radius * 1.06, 48, 32),
    new THREE.MeshBasicMaterial({
      color: 0xff8a2a, transparent: true, opacity: 0.11,
      side: THREE.BackSide, depthWrite: false
    })
  );
  sunAura.position.set(...sunPosition);
  parent.add(sunAura);

  const sunOuterGlow = new THREE.Mesh(
    new THREE.SphereGeometry(dimensions.sun.radius * 1.22, 48, 32),
    new THREE.MeshBasicMaterial({
      color: 0xff671f, transparent: true, opacity: 0.05,
      side: THREE.BackSide, depthWrite: false
    })
  );
  sunOuterGlow.position.set(...sunPosition);
  parent.add(sunOuterGlow);

  // The Sun owns its light source; consumers only need to add the Sun model.
  const sunlight = new THREE.PointLight(0xffb65c, 1800, 160, 1.5);
  sunlight.position.set(...sunPosition);
  parent.add(sunlight);

  return { sun, sunAura, sunOuterGlow, sunlight };
}
