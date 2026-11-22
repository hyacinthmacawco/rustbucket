import * as THREE from "three";
import { createStarfieldTexture } from "./starfield.js";

// Stylised Ben 10 planetary systems. Planet colours and silhouettes are
// procedural so these models do not depend on remote image assets.
const TAU = Math.PI * 2;
const SHIP_LENGTH = 26;
const STAR_RADIUS = SHIP_LENGTH * 500;
const PLANET_RADIUS = SHIP_LENGTH * 50;
const scaledSeparation = (distance, oldStarRadius, oldPlanetRadius) => STAR_RADIUS + PLANET_RADIUS + Math.max(0, distance - oldStarRadius - oldPlanetRadius) * 100;

function makePlanetTexture(palette, style = "bands") {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const base = ctx.createLinearGradient(0, 0, 0, 512);
  base.addColorStop(0, palette[0]); base.addColorStop(.5, palette[1]); base.addColorStop(1, palette[2]);
  ctx.fillStyle = base; ctx.fillRect(0, 0, 1024, 512);

  if (style === "hills" || style === "city") {
    for (let i = 0; i < 46; i++) {
      const x = (i * 173) % 1024, y = 45 + ((i * 97) % 410);
      ctx.fillStyle = i % 3 ? palette[2] : palette[0];
      ctx.globalAlpha = .25 + (i % 4) * .08;
      ctx.beginPath(); ctx.ellipse(x, y, 24 + (i % 8) * 13, 8 + (i % 5) * 5, (i % 7) * .3, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (style === "city") {
    for (let i = 0; i < 230; i++) {
      const x = (i * 67) % 1024, y = 80 + ((i * 43) % 350);
      const w = 3 + (i % 7) * 2, h = 4 + (i % 11) * 3;
      ctx.fillStyle = i % 2 ? "#123f43" : "#b9e8a2";
      ctx.globalAlpha = .45 + (i % 3) * .15;
      ctx.fillRect(x, y - h, w, h);
    }
    ctx.globalAlpha = 1;
  }
  if (style === "crater") {
    const crater = ctx.createRadialGradient(520, 250, 20, 520, 250, 210);
    crater.addColorStop(0, "#152d22"); crater.addColorStop(.72, "#304c32"); crater.addColorStop(1, "rgba(20,50,25,0)");
    ctx.fillStyle = crater; ctx.beginPath(); ctx.arc(520, 250, 215, 0, TAU); ctx.fill();
    ctx.strokeStyle = "rgba(196,255,157,.45)"; ctx.lineWidth = 13;
    ctx.beginPath(); ctx.ellipse(520, 250, 225, 170, -.18, 0, TAU); ctx.stroke();
  }
  if (style === "scorched") {
    for (let i = 0; i < 19; i++) {
      const x = (i * 251) % 1024, y = 30 + ((i * 137) % 450);
      ctx.save(); ctx.translate(x, y); ctx.rotate((i % 5) * .37);
      ctx.fillStyle = "#17131a"; ctx.globalAlpha = .75;
      ctx.beginPath(); ctx.ellipse(0, 0, 18 + (i % 6) * 10, 8 + (i % 4) * 9, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeStar(parent, color) {
  const star = new THREE.Mesh(
    new THREE.SphereGeometry(STAR_RADIUS, 48, 32),
    new THREE.MeshBasicMaterial({ color })
  );
  parent.add(star);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(STAR_RADIUS * 1.5, 32, 24),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .1, side: THREE.BackSide, depthWrite: false })
  );
  parent.add(glow);
  const light = new THREE.PointLight(color, 180000000, STAR_RADIUS * 20, 1.8);
  parent.add(light);
  return star;
}

function makeWorld(parent, name, baseRadius, palette, style, options = {}) {
  const material = new THREE.MeshStandardMaterial({
    map: makePlanetTexture(palette, style),
    roughness: .9,
    metalness: style === "city" ? .12 : .02
  });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(PLANET_RADIUS, 64, 48), material);
  planet.name = name;
  planet.rotation.z = options.tilt || 0;
  parent.add(planet);
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(PLANET_RADIUS * 1.035, 48, 32),
    new THREE.MeshBasicMaterial({ color: options.atmosphere || palette[0], transparent: true, opacity: .13, side: THREE.BackSide, depthWrite: false })
  );
  parent.add(atmosphere);
  return { planet, atmosphere };
}

function makeOrbit(parent, radius, color = 0x9bb8c7) {
  const line = new THREE.Mesh(
    new THREE.TorusGeometry(radius, Math.max(2, radius * .0018), 8, 160),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .2 })
  );
  line.rotation.x = Math.PI / 2;
  parent.add(line);
  return line;
}

export class AlienSystems {
  constructor(parent, only = null) {
  const root = new THREE.Group();
  root.name = "Ben10AlienSystems";
  parent.add(root);
  const starfield = createStarfieldTexture(root, "AlienSystemStarfieldTexture");
  const systems = [];

  // Augstaka — the Highbreed homeworld: restored green hills, coastal blue
  // and clean city clusters. A moon is shown in orbit.
  if (!only || only === "augstaka") {
    const group = new THREE.Group(); group.name = "AugstakaSystem";
    group.position.set(155, 12, -115); root.add(group);
    makeStar(group, 0xffd9a0);
    const distance = scaledSeparation(19, 5.5, 5.2);
    const { planet } = makeWorld(group, "Augstaka", 5.2, ["#9fb76a", "#4d8658", "#244e45"], "hills", { atmosphere: 0x9fcf9d });
    planet.position.set(distance, 0, 0);
    makeOrbit(group, distance);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(PLANET_RADIUS * .16, 32, 24), new THREE.MeshStandardMaterial({ color: 0xaab7a0, roughness: 1 }));
    moon.position.set(distance, 0, PLANET_RADIUS * 1.55); group.add(moon);
    const city = new THREE.Group(); city.position.set(distance, 0, 0); group.add(city);
    const cityScale = PLANET_RADIUS / 5.2;
    for (let i = 0; i < 18; i++) {
      const a = i * TAU / 18, r = (5.25 + (i % 3) * .35) * cityScale;
      const h = (.35 + (i % 5) * .19) * cityScale;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(.18 * cityScale, h, .18 * cityScale), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x9bbd9a : 0xd0d7b1, emissive: 0x1e4630, emissiveIntensity: .25 }));
      tower.position.set(Math.cos(a) * r, Math.sin(a) * r * .55, Math.sin(a) * r);
      city.add(tower);
    }
    systems.push(group);
  }

  // Anodyne — dark red world with the distinctive pair of orange rings.
  if (!only || only === "anodyne") {
    const group = new THREE.Group(); group.name = "AnodyneSystem";
    group.position.set(-165, 18, -125); root.add(group);
    makeStar(group, 0xffb36b);
    const distance = scaledSeparation(17, 4.5, 4.7);
    const { planet } = makeWorld(group, "Anodyne", 4.7, ["#70252d", "#45131e", "#210d19"], "bands", { atmosphere: 0x9c3440 });
    planet.position.set(distance, 0, 0);
    for (const [radius, tube, opacity] of [[720*(PLANET_RADIUS/4.7),.24*(PLANET_RADIUS/4.7),.85],[840*(PLANET_RADIUS/4.7),.16*(PLANET_RADIUS/4.7),.65]]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 160), new THREE.MeshBasicMaterial({ color: 0xe97835, transparent: true, opacity, side: THREE.DoubleSide }));
      ring.position.copy(planet.position); ring.rotation.set(1.18, .18, .16); group.add(ring);
    }
    systems.push(group);
  }

  // Galvan Prime — small green technological world with its enormous
  // crater-like marking and Galvan B moon.
  if (!only || only === "galvan") {
    const group = new THREE.Group(); group.name = "GalvanSystem";
    group.position.set(175, 8, 145); root.add(group);
    makeStar(group, 0xffd38a);
    const distance = scaledSeparation(16, 4.2, 4.1);
    const { planet } = makeWorld(group, "Galvan Prime", 4.1, ["#b5d99a", "#5f9d52", "#24753a"], "crater", { atmosphere: 0x75d8c4 });
    planet.position.set(distance, 0, 0);
    makeOrbit(group, distance, 0x8de2bb);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(PLANET_RADIUS * .22, 32, 24), new THREE.MeshStandardMaterial({ color: 0x3e8c9a, roughness: .55, metalness: .22, emissive: 0x0b3238, emissiveIntensity: .2 }));
    moon.position.set(distance, 0, PLANET_RADIUS * 1.55); moon.name = "Galvan B"; group.add(moon);
    systems.push(group);
  }

  // Incursia — its canonical appearance is a peach-like planet with huge
  // black scorch marks. The exploded state is represented by a broken shell.
  if (!only || only === "incursia") {
    const group = new THREE.Group(); group.name = "IncursiaSystem";
    group.position.set(-185, -8, 150); root.add(group);
    makeStar(group, 0xffc17b);
    const distance = scaledSeparation(17, 4.8, 4.3);
    const shell = new THREE.Group(); shell.position.set(distance, 0, 0); group.add(shell);
    const { planet } = makeWorld(shell, "Incursia Remnant", 4.3, ["#f1b77b", "#d97d69", "#e8d09a"], "scorched", { atmosphere: 0xc97e70 });
    const geometry = planet.geometry;
    // Radial fractures and detached crust fragments make the destruction
    // readable at a distance without turning the whole planet into noise.
    const shardMaterial = new THREE.MeshStandardMaterial({ color: 0xd78b75, roughness: .95 });
    for (let i = 0; i < 13; i++) {
      const a = i * TAU / 13, r = (4.5 + (i % 3) * .65) * 100;
      const shard = new THREE.Mesh(new THREE.DodecahedronGeometry((.55 + (i % 4) * .16) * 100, 0), shardMaterial);
      shard.position.set(Math.cos(a) * r, Math.sin(a * 1.7) * 150, Math.sin(a) * r);
      shard.rotation.set(a, a * .7, a * .3); shell.add(shard);
    }
    planet.scale.setScalar(.82);
    systems.push(group);
  }

  root.traverse(object => {
    object.userData.noPhysics = true;
    object.userData.systemModel = true;
  });
  Object.assign(this, { root, systems, starfield });
  }
}
