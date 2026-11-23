import * as THREE from "three";
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

    for (let index = 0; index < 34; index++) {
      const angle = index * Math.PI * 2 / 34;
      const radius = 38 + (index % 5) * 15;
      const formation = new THREE.Mesh(
        new THREE.OctahedronGeometry(2 + (index % 4) * 0.7),
        new THREE.MeshStandardMaterial({ color: index % 2 ? 0xf08c55 : 0xb94c68, emissive: 0x351021, emissiveIntensity: 0.18 })
      );
      formation.position.set(Math.cos(angle) * radius, 5 + (index % 6) * 5, Math.sin(angle) * radius);
      formation.scale.y = 1.8;
      interior.add(formation);
    }

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

  enter(react) {
    react.clearWorld();
    react.omniverse.celestial = this.interior();
    react.scene.background = new THREE.Color(this.world.sky);
    react.scene.fog = new THREE.Fog(this.world.sky, 180, 700);
    react.camera.position.set(0, 8, 23);
    react.camera.lookAt(0, 1.5, 0);
    react.cameraTarget = new THREE.Vector3(0, 1.5, 0);
    react.state.stage = "gameplay";
    react.state.currentScene = this.world.key;
    react.titleScreen.setVisible(false);
    react.titleScreen.newGame.setPreludeVisible(false);
    react.extranetButton.style.display = "block";
    react.extranet.setLocation(this.world.key);
    react.currentPlanet = this;
    if (this.world.key === "earth") react.earth = this;
    return this;
  }

  exit(react) {
    react.clearWorld();
    const system = new THREE.Group();
    react.systemWorld = new AnodyneSystem(system);
    react.omniverse.celestial = system;
    react.addSystemPlanets(this.system);
    react.scene.background = new THREE.Color(0x02040a);
    react.scene.fog = null;
    react.camera.position.set(0, 0, 600000);
    react.camera.lookAt(0, 0, 0);
    react.state.currentScene = this.system === "solar" ? "space" : "system-" + this.system;
    react.extranet.setLocation(this.system === "solar" ? "space" : this.system);
    return react.systemWorld;
  }
}
