import * as THREE from "three";

export class Augstaka {
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
    this.world = Augstaka.WORLD;
    this.system = "augstaka";
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

    for (let index = 0; index < 34; index++) {
      const angle = index * Math.PI * 2 / 34;
      const radius = 38 + (index % 5) * 15;
      const formation = new THREE.Mesh(
        new THREE.OctahedronGeometry(2 + (index % 4) * 0.7),
        new THREE.MeshStandardMaterial({ color: index % 2 ? 0xb8d69a : 0x7b9f78, emissive: 0x172b1b, emissiveIntensity: 0.18 })
      );
      formation.position.set(Math.cos(angle) * radius, 5 + (index % 6) * 5, Math.sin(angle) * radius);
      formation.scale.y = 0.7;
      interior.add(formation);
    }

    const hub = new THREE.Group();
    hub.name = "AugstakaCivicHub";
    hub.position.set(0, 0, -24);
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
}
