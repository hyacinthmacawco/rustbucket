import * as THREE from "three";
import { Human } from "../species/Human.js";
import { PlanetPopulation } from "./PlanetPopulation.js";

export class EarthInterior {
  static WORLD = { key: "earth", name: "Earth", species: "Human", sky: 0x78b9f5, ground: 0x64734f, accent: 0x9b9b91 };
  static DEFAULT_STATE = {
    population: 810,
    treasury: 1800000,
    revenue: 22000,
    expenses: 19000,
    resources: [
      { id: "food", name: "Food supplies", quantity: 2400 },
      { id: "fuel", name: "Fuel", quantity: 1600 },
      { id: "medicine", name: "Medicine", quantity: 850 }
    ],
    wars: [],
    events: []
  };
  mat(color, roughness = 0.9) {
    return new THREE.MeshStandardMaterial({ color, roughness });
  }

  box(parent, size, position, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  constructor(scene, parent = scene) {
  this.world = this.constructor.WORLD;
  this.key = "earth";
  this.species = "Human";
  this.relationships = { ...Human.relationships };
  this.elapsed = 0;
  this.stateKey = "rustbucket.planet.earth";
  Object.assign(this, this.loadState());
  scene.background = new THREE.Color(0x78b9f5);
  scene.fog = new THREE.Fog(0xa6cbed, 75, 260);

  const root = new THREE.Group();
  root.name = "EarthInterior";
  root.position.set(0, 0, 0);
  root.scale.set(1, 1, 1);
  parent.add(root);

  const sunlight = new THREE.DirectionalLight(0xffd39a, 3.0);
  sunlight.position.set(-35, 65, 45);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  sunlight.shadow.camera.left = -100;
  sunlight.shadow.camera.right = 100;
  sunlight.shadow.camera.top = 100;
  sunlight.shadow.camera.bottom = -100;
  root.add(sunlight);

  root.add(new THREE.HemisphereLight(0xb8dcff, 0x5a5040, 1.5));



  const groundMat = this.mat(0x64734f);
  const asphaltMat = this.mat(0x343a40);
  const sidewalkMat = this.mat(0x9b9b91);
  const buildingMats = [0xb7b1a4, 0x9babb1, 0xc2b7a2, 0x8f9b91].map(c => this.mat(c));
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x7897a7,
    roughness: 0.35,
    metalness: 0.15,
    emissive: 0x172b36,
    emissiveIntensity: 0.12
  });
  const trunkMat = this.mat(0x594331);
  const leafMats = [0x456b3c, 0x527a43, 0x66834b].map(c => this.mat(c));


  // The road and sidewalks are painted into the ground texture.
  const roadCanvas = document.createElement('canvas');
  roadCanvas.width = 1024; roadCanvas.height = 1024;
  const ctx = roadCanvas.getContext('2d');
  ctx.fillStyle = '#64734f'; ctx.fillRect(0,0,1024,1024);
  const roadY = 512 + (70 / 520) * 1024;
  const roadH = (34 / 520) * 1024; const walkH = (5 / 520) * 1024;
  ctx.fillStyle = '#9b9b91';
  ctx.fillRect(0,roadY-roadH/2-walkH,1024,walkH);
  ctx.fillRect(0,roadY+roadH/2,1024,walkH);
  ctx.fillStyle = '#343a40'; ctx.fillRect(0,roadY-roadH/2,1024,roadH);
  ctx.strokeStyle = '#d8d1a5'; ctx.lineWidth = 3; ctx.setLineDash([18,18]);
  ctx.beginPath(); ctx.moveTo(0,roadY); ctx.lineTo(1024,roadY); ctx.stroke();
  const roadTexture = new THREE.CanvasTexture(roadCanvas); roadTexture.colorSpace = THREE.SRGBColorSpace;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(520,520), new THREE.MeshStandardMaterial({map:roadTexture,roughness:1}));
  ground.rotation.x = -Math.PI/2; ground.position.y = -0.5; ground.receiveShadow = true; ground.userData.noPhysics = true; root.add(ground);

  // Urban blocks on both sides of the road, kept away from the camera's
  // immediate view of Kevin's storage unit.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const x = side * (42 + (i % 2) * 12);
      const z = -115 + i * 34;
      const width = 18 + (i % 3) * 5;
      const height = 13 + (i % 4) * 5;
      const depth = 20 + (i % 2) * 6;
      const building = this.box(
        root,
        [width, height, depth],
        [x, height / 2, z],
        buildingMats[i % buildingMats.length]
      );
      building.name = "BellwoodBuilding";

      for (let floor = 0; floor < Math.floor(height / 3.2); floor++) {
        for (let column = 0; column < 3; column++) {
          this.box(
            root,
            [1.8, 1.35, 0.08],
            [x - width * 0.28 + column * width * 0.28, 1.2 + floor * 3.1, z + depth / 2 + 0.05],
            windowMat
          );
        }
      }
    }
  }

  // Simple trees along the sidewalks.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 12; i++) {
      const x = side * 24;
      const z = 30 + i * 17;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.48, 4.2, 8),
        trunkMat
      );
      trunk.position.set(x, 2.1, z);
      trunk.castShadow = true;
      root.add(trunk);

      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(2.6, 10, 8),
        leafMats[i % leafMats.length]
      );
      crown.position.set(x, 5.1, z);
      crown.castShadow = true;
      root.add(crown);
    }
  }

  Object.assign(this, { bellwood: root, root, sunlight });
  this.populationManager = new PlanetPopulation(root, "earth");
  this.inhabitants = this.populationManager.inhabitants;
  }

  loadState() {
    const defaults = structuredClone(this.constructor.DEFAULT_STATE);
    try {
      const saved = JSON.parse(localStorage.getItem(this.stateKey) || "null");
      if (!saved) return defaults;
      return {
        ...defaults,
        ...saved,
        resources: Array.isArray(saved.resources) ? saved.resources : defaults.resources,
        relationships: { ...this.relationships, ...(saved.relationships || {}) },
        wars: Array.isArray(saved.wars) ? saved.wars : [],
        events: Array.isArray(saved.events) ? saved.events : []
      };
    } catch (error) {
      console.warn("Earth data could not be loaded:", error);
      return defaults;
    }
  }

  saveState() {
    const state = {
      population: this.population,
      treasury: this.treasury,
      revenue: this.revenue,
      expenses: this.expenses,
      resources: this.resources,
      relationships: this.relationships,
      wars: this.wars,
      events: this.events
    };
    try {
      localStorage.setItem(this.stateKey, JSON.stringify(state));
    } catch (error) {
      console.warn("Earth data could not be saved:", error);
    }
  }

  update(delta, rivalInteriors = []) {
    this.elapsed += delta;
    if (this.elapsed < 30) return;
    this.elapsed = 0;
    const activeWars = this.wars.filter(war => war.status === "active");
    const growth = this.population * 0.00002;
    const losses = activeWars.length ? this.population * 0.00001 * activeWars.length : 0;
    this.population = Math.max(0, Math.min(999, Math.round(this.population + growth - losses)));
    this.treasury = Math.max(0, this.treasury + this.revenue - this.expenses);
    for (const war of activeWars) {
      if (Date.now() - Date.parse(war.startedAt) > 90000) {
        war.status = "ended";
        war.endedAt = new Date().toISOString();
      }
    }
    this.saveState();
  }

  isHostileTo(species) {
    return Number(this.relationships[species] ?? 0) < -30;
  }

  declareWar(targetInterior) {
    if (!targetInterior || targetInterior === this || targetInterior.species === this.species) return null;
    this.relationships[targetInterior.species] = -55;
    const loot = Math.min(targetInterior.treasury, Math.max(100, Math.round(targetInterior.treasury * 0.025)));
    targetInterior.treasury = Math.max(0, targetInterior.treasury - loot);
    this.treasury += loot;
    const stock = targetInterior.resources.find(resource => resource.quantity > 0);
    let seized = null;
    if (stock) {
      const quantity = Math.min(stock.quantity, Math.max(1, Math.floor(stock.quantity * 0.01)));
      stock.quantity -= quantity;
      const matching = this.resources.find(resource => resource.id === stock.id);
      if (matching) matching.quantity += quantity;
      else this.resources.push({ ...stock, quantity });
      seized = { resource: stock.name, quantity };
    }
    const event = {
      type: "war",
      attacker: this.species,
      defender: targetInterior.species,
      loot,
      seized,
      description: this.species + " declared war on " + targetInterior.species + ".",
      at: new Date().toISOString(),
      status: "active"
    };
    this.wars.push({ target: targetInterior.species, status: "active", startedAt: event.at });
    targetInterior.wars.push({ target: this.species, status: "active", startedAt: event.at });
    this.events.unshift(event);
    targetInterior.events.unshift(event);
    this.saveState();
    targetInterior.saveState();
    return event;
  }

}


// Kevin's storage unit and the team's suitcases are part of the Earth interior.
