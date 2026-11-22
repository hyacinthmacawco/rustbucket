import * as THREE from "three";
import { dimensions } from "../../storage/dimensions.js";
import { AugstakaSystem } from "./augstaka.js";
import { AnodyneSystem } from "./anodyne.js";
import { GalvanSystem } from "./galvan.js";
import { IncursiaSystem } from "./incursia.js";

// A complete system is the scene unit: its stars and all external celestial
// bodies are owned and disposed together when the player enters a planet.
// Create the distant starfield only when the camera is in the space region.
function createStarfield(parent) {
  const starCount = 6500;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const radius = 45 + Math.random() * 110;
    const theta = Math.random() * Math.PI * 2;
    const z = Math.random() * 2 - 1;
    const planar = Math.sqrt(1 - z * z);
    const brightness = 0.55 + Math.random() * 0.45;
    const blueStar = Math.random() > 0.84;

    positions[i * 3] = radius * planar * Math.cos(theta);
    positions[i * 3 + 1] = radius * z;
    positions[i * 3 + 2] = radius * planar * Math.sin(theta);
    colors[i * 3] = brightness * (blueStar ? 0.65 : 1);
    colors[i * 3 + 1] = brightness * (blueStar ? 0.82 : 1);
    colors[i * 3 + 2] = brightness;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const stars = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.12,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    })
  );
  stars.name = "Starfield";
  parent.add(stars);
  return { stars };
}

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

  const alienSystems = [
    new AugstakaSystem(parent),
    new AnodyneSystem(parent),
    new GalvanSystem(parent),
    new IncursiaSystem(parent)
  ];
  const { stars } = createStarfield(parent);
  parent.traverse(object => { object.userData.noPhysics = true; });
  return { sun, sunAura, sunOuterGlow, sunlight, earth, moon, stars, alienSystems };
}
