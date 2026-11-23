import * as THREE from "three";

export class CelestialPlanet {
  constructor(parent, world, system) {
    this.world = world;
    this.key = world.key;
    this.system = system;
    this.root = new THREE.Group();
    this.root.name = world.name;
    parent.add(this.root);

    this.root.add(new THREE.HemisphereLight(world.sky, world.ground, 1.8));
    const sunlight = new THREE.DirectionalLight(0xffe0c0, 2.1);
    sunlight.position.set(-35, 70, 25);
    this.root.add(sunlight);

    this.createGround();
    this.createLandscape();
    this.createCivicHub();
  }

  createGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      new THREE.MeshStandardMaterial({ color: this.world.ground, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.6;
    ground.userData.noPhysics = true;
    this.root.add(ground);
  }

  createLandscape() {
    for (let index = 0; index < 34; index++) {
      const angle = index * Math.PI * 2 / 34;
      const radius = 38 + (index % 5) * 15;
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(2 + (index % 4) * 0.7),
        new THREE.MeshStandardMaterial({
          color: index % 2 ? this.world.accent : this.world.secondary,
          emissive: this.world.emissive,
          emissiveIntensity: 0.18
        })
      );
      crystal.position.set(Math.cos(angle) * radius, 5 + (index % 6) * 5, Math.sin(angle) * radius);
      crystal.scale.y = 1.8;
      this.root.add(crystal);
    }

    for (let index = 0; index < 4; index++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(28 + index * 13, 0.22, 8, 96),
        new THREE.MeshBasicMaterial({
          color: this.world.accent,
          transparent: true,
          opacity: 0.28
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.1 + index * 0.04;
      this.root.add(ring);
    }
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
