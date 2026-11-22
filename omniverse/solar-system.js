import * as THREE from "three";
import { dimensions } from "../storage/state.js";
import { createStarfield } from "./starfield.js";
import { createAlienSystems } from "./alien-systems.js";

// A complete system is the scene unit: its stars and all external celestial
// bodies are owned and disposed together when the player enters a planet.
export function createSolarSystem(parent) {
  parent.name = "SolarSystem";
  parent.add(new THREE.AmbientLight(0x52617f, 0.45));

  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(dimensions.sun.radius, 64, 48), sunMaterial);
  sun.position.set(...dimensions.sun.position);
  parent.add(sun);
  new THREE.TextureLoader().load("./omniverse/sun.jpg", texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    sunMaterial.map = texture;
    sunMaterial.needsUpdate = true;
  }, undefined, error => console.warn("Could not load Sun texture:", error));

  const sunAura = new THREE.Mesh(
    new THREE.SphereGeometry(dimensions.sun.radius * 1.06, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.11, side: THREE.BackSide, depthWrite: false })
  );
  sunAura.position.copy(sun.position);
  parent.add(sunAura);
  const sunOuterGlow = new THREE.Mesh(
    new THREE.SphereGeometry(dimensions.sun.radius * 1.22, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0xff671f, transparent: true, opacity: 0.05, side: THREE.BackSide, depthWrite: false })
  );
  sunOuterGlow.position.copy(sun.position);
  parent.add(sunOuterGlow);
  const sunlight = new THREE.PointLight(0xffb65c, 1800, 160, 1.5);
  sunlight.position.copy(sun.position);
  parent.add(sunlight);

  const earthMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0.05 });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(dimensions.earth.radius, 64, 48), earthMaterial);
  earth.position.set(...dimensions.earth.position);
  parent.add(earth);
  new THREE.TextureLoader().load("./omniverse/earth.jpg", texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    earthMaterial.map = texture;
    earthMaterial.needsUpdate = true;
  }, undefined, error => console.warn("Could not load Earth texture:", error));
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(dimensions.earth.radius * 1.045, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0x4b9fff, transparent: true, opacity: 0.12, side: THREE.BackSide, depthWrite: false })
  );
  atmosphere.position.copy(earth.position);
  parent.add(atmosphere);
  const outerAtmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(dimensions.earth.radius * 1.12, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0x216eff, transparent: true, opacity: 0.04, side: THREE.BackSide, depthWrite: false })
  );
  outerAtmosphere.position.copy(earth.position);
  parent.add(outerAtmosphere);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(dimensions.moon.radius, 48, 32),
    new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.95 })
  );
  moon.position.set(...dimensions.moon.position);
  parent.add(moon);

  const alienSystems = createAlienSystems(parent);
  const { stars } = createStarfield(parent);
  parent.traverse(object => { object.userData.noPhysics = true; });
  return { sun, sunAura, sunOuterGlow, sunlight, earth, moon, stars, alienSystems };
}
