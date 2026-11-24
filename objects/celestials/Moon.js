import * as THREE from "three";

export class Moon {
  static WORLD = { key: "moon", name: "The Moon", species: "Human", sky: 0x343943, ground: 0x777b82 };

  constructor() {
    this.world = Moon.WORLD;
    this.system = "solar";
    this.atmosphereHeight = 90;
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
