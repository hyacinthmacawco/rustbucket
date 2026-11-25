import * as THREE from "three";
import { IncurseanShip } from "../resources/IncurseanShip.js";
import { Starfield } from "./Starfield.js";
import { Human } from "../species/Human.js";
import { Anodite } from "../species/Anodite.js";
import { Galvan } from "../species/Galvan.js";
import { Highbreed } from "../species/Highbreed.js";
import { Incursean } from "../species/Incursean.js";

export class Incursia {
  static relationships = { Ben: -30, Gwen: -40, Kevin: -50, Rook: -44, Highbreed: -64, Anodite: 3, Galvan: 10, Human: -36 };
  static WORLD = {
    key: "incursia",
    name: "Incursia",
    species: "Incursean",
    sky: 0x6b4c35,
    ground: 0x3e2b21,
    accent: 0xd39b45,
    secondary: 0x8e5d36,
    emissive: 0x38200d
  };

  constructor() {
    this.songs = ["./files/songs/neodevol-ov.m4a"];
    this.world = Incursia.WORLD;
    this.system = "incursia";
    this.atmosphereHeight = 90;
  }

  exterior() {
    const exterior = new THREE.Group();
    exterior.name = "IncursiaExterior";
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(1300, 64, 48),
      new THREE.MeshStandardMaterial({ color: 0xd97d69, roughness: 0.88 })
    );
    globe.name = "Incursia";
    exterior.add(globe);
    exterior.add(new THREE.Mesh(
      new THREE.SphereGeometry(1345, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0x6b4c35, transparent: true, opacity: 0.14, side: THREE.BackSide, depthWrite: false })
    ));
    const scorchMaterial = new THREE.MeshBasicMaterial({ color: 0x21171a });
    for (let index = 0; index < 12; index++) {
      const mark = new THREE.Mesh(new THREE.SphereGeometry(180 + (index % 3) * 35, 12, 8), scorchMaterial);
      const angle = index * Math.PI * 2 / 12;
      mark.position.set(Math.cos(angle) * 900, Math.sin(angle * 1.7) * 560, 900);
      mark.scale.set(1.5, 0.75, 0.35);
      exterior.add(mark);
    }
    return exterior;
  }

  interior() {
    const interior = new THREE.Group();
    interior.name = "IncursiaInterior";
    interior.add(Starfield.createAtmosphere(this.world.sky));
    interior.add(new THREE.HemisphereLight(0x6b4c35, 0x3e2b21, 1.8));
    const sunlight = new THREE.DirectionalLight(0xffe0c0, 2.1);
    sunlight.position.set(-35, 70, 25);
    interior.add(sunlight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      new THREE.MeshStandardMaterial({ color: 0x3e2b21, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.6;
    interior.add(ground);


    const hub = new THREE.Group();
    hub.name = "IncursiaMarket";
    hub.position.set(0, 0, -24);
    hub.userData.market = true;
    hub.userData.onClick = event => hub.userData.clickHandler?.(event);
    hub.resources = { "Grape Smoothie": 1 + Math.floor(Math.random() * 10) };
    hub.prices = { "Grape Smoothie": 5 };
    interior.add(hub);
    const dark = new THREE.MeshStandardMaterial({ color: 0x17231c, roughness: 0.9 });
    const accent = new THREE.MeshStandardMaterial({ color: 0xd39b45, roughness: 0.55 });
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
    const beacon = new THREE.PointLight(0xd39b45, 90, 38);
    beacon.position.set(0, 7, 0);
    hub.add(beacon);
    return interior;
  }


  spawnShips(parent) {
    this.ships = [];
    this.patrolTime = 0;
    const positions = [[-350, 1250, -1050], [0, 1320, -1100], [350, 1250, -1050]];
    for (let index = 0; index < positions.length; index++) {
      const visual = new IncurseanShip(parent, { scale: 8 });
      const group = visual.group;
      group.name = this.world.key + "PatrolShip" + index;
      const [x, y, z] = positions[index];
      group.position.set(274300 + x, y, z);
      const patrol = {
        group,
        homePlanet: this.world.key,
        relationships: this.constructor.relationships,
        damage: 5,
        health: 50,
        maxHealth: 50,
        destroyed: false,
        orbitPhase: -Math.PI / 2 + (index - 1) * 0.28,
        orbitRadius: 520,
        orbitSpeed: 0.12 + index * 0.015,
        healthBar: null,
        takeDamage: amount => {
          if (patrol.destroyed) return 0;
          patrol.health = Math.max(0, patrol.health - Math.max(0, Number(amount) || 0));
          if (patrol.healthBar) {
            const ratio = patrol.health / patrol.maxHealth;
            patrol.healthBar.fill.scale.x = Math.max(0.001, ratio);
            patrol.healthBar.fill.position.x = -1.7 * (1 - ratio);
          }
          if (patrol.health === 0) patrol.destroy();
          return patrol.health;
        },
        destroy: () => {
          if (patrol.destroyed) return;
          patrol.destroyed = true;
          group.removeFromParent();
          patrol.healthBar?.group.removeFromParent();
          for (const name of ["Ben", "Gwen", "Kevin", "Rook"]) {
            patrol.relationships[name] = Math.max(-100, Number(patrol.relationships[name] ?? 0) - 0.5);
          }
        },
        attack: target => {
          const species = target?.species || target?.constructor?.name;
          if (!target || target.health <= 0 || Number(patrol.relationships[species] ?? 0) >= 0) return false;
          target.takeDamage?.(patrol.damage);
          return true;
        }
      };
      const barGroup = new THREE.Group();
      barGroup.name = "PatrolShipHealthBar";
      barGroup.position.set(0, 3.2, 0);
      barGroup.scale.setScalar(0.7);
      const back = new THREE.Mesh(
        new THREE.PlaneGeometry(3.8, 0.48),
        new THREE.MeshBasicMaterial({ color: 0x260909, side: THREE.DoubleSide, depthTest: false, depthWrite: false })
      );
      const fill = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, 0.28),
        new THREE.MeshBasicMaterial({ color: 0x65ff72, side: THREE.DoubleSide, depthTest: false, depthWrite: false })
      );
      fill.position.z = 0.02;
      back.renderOrder = 1000;
      fill.renderOrder = 1001;
      back.userData.noPhysics = true;
      fill.userData.noPhysics = true;
      barGroup.add(back, fill);
      barGroup.visible = true;
      barGroup.userData.noPhysics = true;
      group.add(barGroup);
      patrol.healthBar = { group: barGroup, fill };
      this.ships.push(patrol);
    }
    return this.ships;
  }

  animateShips(delta) {
    this.patrolTime = (this.patrolTime || 0) + delta;
    for (const patrol of this.ships || []) {
      if (patrol.destroyed) continue;
      const angle = patrol.orbitPhase + this.patrolTime * patrol.orbitSpeed;
      patrol.group.position.set(
        274300 + Math.cos(angle) * patrol.orbitRadius,
        1550 + Math.sin(this.patrolTime * 0.32 + patrol.orbitPhase) * 70,
        Math.sin(angle) * patrol.orbitRadius
      );
      patrol.group.rotation.y = -angle;
    }
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
