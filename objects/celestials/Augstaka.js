import * as THREE from "three";
import { Starfield } from "./Starfield.js";
import { Human } from "../species/Human.js";
import { Anodite } from "../species/Anodite.js";
import { Galvan } from "../species/Galvan.js";
import { Highbreed } from "../species/Highbreed.js";
import { Incursean } from "../species/Incursean.js";
import { AugstakaSystem } from "./AugstakaSystem.js";

export class Augstaka {
  static relationships = { Ben: 40, Gwen: 30, Kevin: 20, Rook: 10, Incursean: -64, Anodite: 3, Galvan: 16, Human: -56 };
  static WORLD = {
    key: "augstaka",
    name: "Augstaka",
    species: "Highbreed",
    sky: 0x9fcfbd,
    ground: 0x527b54,
    accent: 0xb8d69a,
    secondary: 0x7b9f78,
    emissive: 0x172b1b
  };

  constructor() {
    this.songs = ["./files/songs/neodevol-ov.mp3"];
    this.world = Augstaka.WORLD;
    this.system = "augstaka";
    this.atmosphereHeight = 90;
  }

  exterior() {
    const exterior = new THREE.Group();
    exterior.name = "AugstakaExterior";
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(1300, 64, 48),
      new THREE.MeshStandardMaterial({ color: 0x719b5c, roughness: 0.88 })
    );
    globe.name = "Augstaka";
    exterior.add(globe);
    exterior.add(new THREE.Mesh(
      new THREE.SphereGeometry(1345, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0x9fcfbd, transparent: true, opacity: 0.14, side: THREE.BackSide, depthWrite: false })
    ));
    const city = new THREE.Group();
    for (let index = 0; index < 18; index++) {
      const angle = index * Math.PI * 2 / 18;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(32, 120 + (index % 5) * 35, 32), new THREE.MeshStandardMaterial({ color: index % 2 ? 0x9bbd9a : 0xd0d7b1 }));
      tower.position.set(Math.cos(angle) * 1310, Math.sin(angle) * 450, Math.sin(angle) * 1040);
      city.add(tower);
    }
    exterior.add(city);
    return exterior;
  }

  interior() {
    const interior = new THREE.Group();
    interior.name = "AugstakaInterior";
    interior.add(Starfield.createAtmosphere(this.world.sky));
    interior.add(new THREE.HemisphereLight(0x9fcfbd, 0x527b54, 1.8));
    const sunlight = new THREE.DirectionalLight(0xffe0c0, 2.1);
    sunlight.position.set(-35, 70, 25);
    interior.add(sunlight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      new THREE.MeshStandardMaterial({ color: 0x527b54, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.6;
    interior.add(ground);


    const hub = new THREE.Group();
    hub.name = "AugstakaMarket";
    hub.position.set(0, 0, -24);
    hub.userData.market = true;
    hub.resources = { "Grape Smoothie": 1 + Math.floor(Math.random() * 10) };
    interior.add(hub);
    const dark = new THREE.MeshStandardMaterial({ color: 0x17231c, roughness: 0.9 });
    const accent = new THREE.MeshStandardMaterial({ color: 0xb8d69a, roughness: 0.55 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(10, 12, 1.2, 8), dark);
    base.position.y = 0.1;
    hub.add(base);
    const hall = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 9.5, 7, 8), accent);
    hall.position.y = 4;
    hall.scale.z = 0.82;
    hub.add(hall);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(10, 4, 8), accent);
    roof.position.y = 9.5;
    roof.scale.z = 0.85;
    hub.add(roof);
    const entrance = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.8, 0.35), dark);
    entrance.position.set(0, 2.5, 7.45);
    hub.add(entrance);
    const beacon = new THREE.PointLight(0xb8d69a, 90, 38);
    beacon.position.set(0, 7, 0);
    hub.add(beacon);
    return interior;
  }


  spawnResidents(parent) {
    const speciesClasses = [Human, Highbreed, Anodite, Galvan, Incursean];
    const nativeClass = speciesClasses.find(SpeciesClass => SpeciesClass.homeworld === this.world.key);
    if (!nativeClass) return [];
    const visitors = speciesClasses
      .filter(SpeciesClass => SpeciesClass !== nativeClass)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    const residents = [];
    const spawn = (SpeciesClass, index, isVisitor = false) => {
      const resident = SpeciesClass === Human
        ? new Human({ residentIndex: index })
        : new SpeciesClass(null, { residentIndex: index });
      resident.relationships = this.constructor.relationships || {};
      resident.species = SpeciesClass.name;
      resident.onDeath = () => { resident.group.visible = false; for (const name of ["Ben", "Gwen", "Kevin", "Rook"]) this.constructor.relationships[name] = Math.max(-100, Number(this.constructor.relationships[name] ?? 0) - 0.5); try { const key = "rustbucket.planet." + this.world.key; const saved = JSON.parse(localStorage.getItem(key) || "null") || {}; saved.relationships = { ...(saved.relationships || {}), ...this.constructor.relationships }; localStorage.setItem(key, JSON.stringify(saved)); } catch (error) {} };
      if (isVisitor) resident.group.userData.isRescueTarget = true;
      const angle = index * Math.PI * 2 / 7;
      const radius = 20 + (index % 3) * 10;
      resident.group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius - 18);
      resident.group.rotation.y = angle + Math.PI;
      parent.add(resident.group);
      residents.push(resident);
    };
    for (let index = 0; index < 5; index++) spawn(nativeClass, index);
    visitors.forEach((SpeciesClass, index) => spawn(SpeciesClass, index + 5, true));
    return residents;
  }

  model(mode = "exterior") {
    return mode === "interior" ? this.interior() : this.exterior();
  }

  enter(omniverse) {
    return omniverse.enterPlanetScene(
      this,
      omniverse.vehicle?.ship,
      [...(omniverse.crew || [])]
    );
  }

  exit(omniverse) {
    return omniverse.loadSystemScene(
      this.system,
      omniverse.vehicle?.ship,
      [...(omniverse.crew || [])],
      this.world.key
    );
  }

}
