import * as THREE from "three";
import { HumanRig } from "../species/Human.js";
import { Anodite } from "../species/Anodite.js";
import { Galvan } from "../species/Galvan.js";
import { Highbreed } from "../species/Highbreed.js";
import { Incursean } from "../species/Incursean.js";
import { AnodyneSystem } from "./AnodyneSystem.js";

export class Anodyne {
  static WORLD = {
    key: "anodyne",
    name: "Anodyne",
    species: "Anodite",
    sky: 0x542b45,
    ground: 0x321d35,
    accent: 0xf08c55,
    secondary: 0xb94c68,
    emissive: 0x351021
  };

  constructor() {
    this.world = Anodyne.WORLD;
    this.system = "anodyne";
    this.atmosphereHeight = 90;
  }

  exterior() {
    const exterior = new THREE.Group();
    exterior.name = "AnodyneExterior";
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(1300, 64, 48),
      new THREE.MeshStandardMaterial({ color: 0x70252d, roughness: 0.88 })
    );
    globe.name = "Anodyne";
    exterior.add(globe);
    exterior.add(new THREE.Mesh(
      new THREE.SphereGeometry(1345, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0x542b45, transparent: true, opacity: 0.14, side: THREE.BackSide, depthWrite: false })
    ));
    for (const [radius, tube, opacity] of [[1872, 62, 0.85], [2184, 42, 0.65]]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 160), new THREE.MeshBasicMaterial({ color: 0xe97835, transparent: true, opacity, side: THREE.DoubleSide }));
      ring.rotation.set(1.18, 0.18, 0.16);
      exterior.add(ring);
    }
    return exterior;
  }

  interior() {
    const interior = new THREE.Group();
    interior.name = "AnodyneInterior";
    interior.add(new THREE.HemisphereLight(0x542b45, 0x321d35, 1.8));
    const sunlight = new THREE.DirectionalLight(0xffe0c0, 2.1);
    sunlight.position.set(-35, 70, 25);
    interior.add(sunlight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      new THREE.MeshStandardMaterial({ color: 0x321d35, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.6;
    interior.add(ground);


    const hub = new THREE.Group();
    hub.name = "AnodyneCivicHub";
    hub.position.set(0, 0, -24);
    interior.add(hub);
    const dark = new THREE.MeshStandardMaterial({ color: 0x17231c, roughness: 0.9 });
    const accent = new THREE.MeshStandardMaterial({ color: 0xf08c55, roughness: 0.55 });
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
    const beacon = new THREE.PointLight(0xf08c55, 90, 38);
    beacon.position.set(0, 7, 0);
    hub.add(beacon);
    return interior;
  }


  spawnResidents(parent) {
    const speciesClasses = [HumanRig, Highbreed, Anodite, Galvan, Incursean];
    const nativeClass = speciesClasses.find(SpeciesClass => SpeciesClass.homeworld === this.world.key);
    if (!nativeClass) return [];
    const visitors = speciesClasses
      .filter(SpeciesClass => SpeciesClass !== nativeClass)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    const residents = [];
    const spawn = (SpeciesClass, index, isVisitor = false) => {
      const resident = SpeciesClass === HumanRig
        ? new HumanRig({ residentIndex: index })
        : new SpeciesClass(null, { residentIndex: index });
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
