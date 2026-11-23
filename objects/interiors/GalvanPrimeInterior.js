import * as THREE from "three";
import { PlanetPopulation } from "./PlanetPopulation.js";
import { Galvan } from "../species/Galvan.js";

export class GalvanPrimeInterior {
  static WORLD = {
    key: "galvan",
    name: "Galvan Prime",
    species: "Galvan",
    sky: 0x8fc9bb,
    ground: 0x456f43,
    accent: 0x65d8c0
  };

  static DEFAULT_STATE = {
    population: 240,
    treasury: 1250000,
    revenue: 18000,
    expenses: 12500,
    resources: [{"id":"microchips","name":"Microchips","quantity":1500},{"id":"tech-components","name":"Tech components","quantity":950},{"id":"science-data","name":"Scientific data","quantity":300}],
    wars: [],
    events: []
  };

  constructor(parent) {
    this.world = this.constructor.WORLD;
    this.key = this.world.key;
    this.species = this.world.species;
    this.relationships = { ...Galvan.relationships };
    this.elapsed = 0;
    this.stateKey = "rustbucket.planet." + this.key;
    Object.assign(this, this.loadState());

    this.root = new THREE.Group();
    this.root.name = this.world.name + "Interior";
    parent.add(this.root);

    this.root.add(new THREE.HemisphereLight(this.world.sky, this.world.ground, 1.8));
    const sunlight = new THREE.DirectionalLight(0xffe0c0, 2.1);
    sunlight.position.set(-35, 70, 25);
    sunlight.castShadow = true;
    this.root.add(sunlight);

    this.createGround();
    this.createLandscape();
    this.createCivicHub();

    this.populationManager = new PlanetPopulation(this.root, this.key);
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
      console.warn("Planet data could not be loaded:", this.key, error);
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
      console.warn("Planet data could not be saved:", this.key, error);
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

    if (this.expenses > this.revenue * 1.5 && rivalInteriors.length && Math.random() < 0.22) {
      const candidates = rivalInteriors.filter(interior => interior !== this && interior.species !== this.species);
      if (candidates.length) this.declareWar(candidates[Math.floor(Math.random() * candidates.length)]);
    }

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
    const loot = Math.min(
      targetInterior.treasury,
      Math.max(100, Math.round(targetInterior.treasury * 0.025))
    );
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

  createGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      new THREE.MeshStandardMaterial({ color: this.world.ground, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.6;
    ground.receiveShadow = true;
    ground.userData.noPhysics = true;
    this.root.add(ground);
  }

  createLandscape() {
    for (let index = 0; index < 20; index++) {
      const angle = index * Math.PI * 2 / 20;
      const radius = 42 + (index % 3) * 18;
      const height = 8 + (index % 5) * 3;
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.4, height, 6), new THREE.MeshStandardMaterial({ color: index % 2 ? 0x3b9a7d : this.world.accent, metalness: 0.3, roughness: 0.55 }));
      tower.position.set(Math.cos(angle) * radius, height / 2, Math.sin(angle) * radius);
      this.root.add(tower);
      const light = new THREE.PointLight(this.world.accent, 12, 16);
      light.position.set(tower.position.x, tower.position.y + 3, tower.position.z);
      this.root.add(light);
    }
    const centralCore = new THREE.Mesh(new THREE.CylinderGeometry(8, 12, 16, 8), new THREE.MeshStandardMaterial({ color: 0x153c36, emissive: this.world.accent, emissiveIntensity: 0.3, metalness: 0.45 }));
    centralCore.position.set(0, 8, 0);
    this.root.add(centralCore);
  }

  createCivicHub() {
    const dark = new THREE.MeshStandardMaterial({ color: 0x17231c, roughness: 0.9 });
    const accent = new THREE.MeshStandardMaterial({ color: this.world.accent, roughness: 0.55 });
    const building = new THREE.Group();
    building.name = "CivicHub";
    building.position.set(0, 0, -24);
    this.root.add(building);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(10, 12, 1.2, 8), dark);
    base.position.y = 0.1;
    building.add(base);
    const hall = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 9.5, 7, 8), accent);
    hall.position.y = 4;
    hall.scale.z = 0.82;
    building.add(hall);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(10, 4, 8), accent);
    roof.position.y = 9.5;
    roof.scale.z = 0.85;
    building.add(roof);
    const entrance = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.8, 0.35), dark);
    entrance.position.set(0, 2.5, 7.45);
    building.add(entrance);
    const beacon = new THREE.PointLight(this.world.accent, 90, 38);
    beacon.position.set(0, 7, 0);
    building.add(beacon);
  }
}
