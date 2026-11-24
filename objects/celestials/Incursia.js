import * as THREE from "three";
import { IncursiaSystem } from "./IncursiaSystem.js";

export class Incursia {
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
    hub.name = "IncursiaCivicHub";
    hub.position.set(0, 0, -24);
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
