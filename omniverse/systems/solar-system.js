import * as THREE from "three";
import { createStarfieldTexture } from "./starfield.js";
// The sky is one inward-facing textured dome, not thousands of star meshes.
export class SolarSystem {
  constructor(parent) {
    const sunConfig = { position: [-16545, 0, 0], radius: 13000 };
    const earthConfig = { position: [0, 0, 0], radius: 1300 };
    const moonConfig = { position: [1547, 0, 0], radius: 217 };
    parent.name = "SolarSystem";
  parent.add(new THREE.AmbientLight(0x52617f, 0.45));

  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(sunConfig.radius, 64, 48), sunMaterial);
  sun.position.set(...sunConfig.position);
  parent.add(sun);
  new THREE.TextureLoader().load("./omniverse/sun.jpg", texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    sunMaterial.map = texture;
    sunMaterial.needsUpdate = true;
  }, undefined, error => console.warn("Could not load Sun texture:", error));

  const sunAura = new THREE.Mesh(
    new THREE.SphereGeometry(sunConfig.radius * 1.06, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.11, side: THREE.BackSide, depthWrite: false })
  );
  sunAura.position.copy(sun.position);
  parent.add(sunAura);
  const sunOuterGlow = new THREE.Mesh(
    new THREE.SphereGeometry(sunConfig.radius * 1.22, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0xff671f, transparent: true, opacity: 0.05, side: THREE.BackSide, depthWrite: false })
  );
  sunOuterGlow.position.copy(sun.position);
  parent.add(sunOuterGlow);
  const sunlight = new THREE.PointLight(0xffb65c, 180000000, 200000, 1.5);
  sunlight.position.copy(sun.position);
  parent.add(sunlight);

  const earthMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0.05 });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(earthConfig.radius, 64, 48), earthMaterial);
  earth.position.set(...earthConfig.position);
  parent.add(earth);
  new THREE.TextureLoader().load("./omniverse/earth.jpg", texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    earthMaterial.map = texture;
    earthMaterial.needsUpdate = true;
  }, undefined, error => console.warn("Could not load Earth texture:", error));
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(earthConfig.radius * 1.045, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0x4b9fff, transparent: true, opacity: 0.12, side: THREE.BackSide, depthWrite: false })
  );
  atmosphere.position.copy(earth.position);
  parent.add(atmosphere);
  const outerAtmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(earthConfig.radius * 1.12, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0x216eff, transparent: true, opacity: 0.04, side: THREE.BackSide, depthWrite: false })
  );
  outerAtmosphere.position.copy(earth.position);
  parent.add(outerAtmosphere);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(moonConfig.radius, 48, 32),
    new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.95 })
  );
  moon.position.set(...moonConfig.position);
  parent.add(moon);

  const stars = createStarfieldTexture(parent);
  parent.traverse(object => { object.userData.noPhysics = true; });
  Object.assign(this, { sun, sunAura, sunOuterGlow, sunlight, earth, moon, stars });
  }
}
