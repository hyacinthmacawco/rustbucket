import * as THREE from "three";
import { SolarSystem } from "./SolarSystem.js";

export class Moon {
  static WORLD = { key: "moon", name: "The Moon", species: "Human", sky: 0x343943, ground: 0x777b82 };

  constructor() {
    this.world = Moon.WORLD;
    this.system = "solar";
  }

  exterior() {
    const exterior = new THREE.Group();
    exterior.name = "MoonExterior";
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(217, 48, 32),
      new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.95 })
    );
    globe.name = "The Moon";
    exterior.add(globe);
    return exterior;
  }

  interior() {
    const interior = new THREE.Group();
    interior.name = "MoonInterior";
    interior.add(new THREE.HemisphereLight(0xc4d0e0, 0x33343a, 1.1));
    const sunlight = new THREE.DirectionalLight(0xfff1d6, 2.2);
    sunlight.position.set(-30, 60, 20);
    interior.add(sunlight);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      new THREE.MeshStandardMaterial({ color: 0x777b82, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.6;
    interior.add(ground);
    const craterMaterial = new THREE.MeshStandardMaterial({ color: 0x565c65, roughness: 1 });
    for (let index = 0; index < 18; index++) {
      const crater = new THREE.Mesh(new THREE.TorusGeometry(2.5 + (index % 4) * 1.5, 0.35, 8, 32), craterMaterial);
      const angle = index * Math.PI * 2 / 18;
      crater.rotation.x = -Math.PI / 2;
      crater.position.set(Math.cos(angle) * (18 + index % 5 * 12), -0.48, Math.sin(angle) * (18 + index % 5 * 12));
      interior.add(crater);
    }
    return interior;
  }

  enter(react) {
    react.clearWorld();
    react.activeWorld.add(this.interior());
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
    react.systemWorld = new SolarSystem(react.activeWorld);
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
