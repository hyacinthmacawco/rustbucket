import * as THREE from "three";

export class GalvanPrime {
  static WORLD = {
    key: "galvan",
    name: "Galvan Prime",
    species: "Galvan",
    sky: 0x496d68,
    ground: 0x263e38,
    accent: 0x77d6a2,
    secondary: 0x4c9b78,
    emissive: 0x123d2b
  };

  constructor() {
    this.world = GalvanPrime.WORLD;
    this.system = "galvan";
  }

  exterior() {
    const exterior = new THREE.Group();
    exterior.name = "Galvan PrimeExterior";
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(1300, 64, 48),
      new THREE.MeshStandardMaterial({ color: 0x73ad70, roughness: 0.88 })
    );
    globe.name = "Galvan Prime";
    exterior.add(globe);
    exterior.add(new THREE.Mesh(
      new THREE.SphereGeometry(1345, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0x496d68, transparent: true, opacity: 0.14, side: THREE.BackSide, depthWrite: false })
    ));
    const crater = new THREE.Mesh(new THREE.TorusGeometry(520, 70, 8, 64), new THREE.MeshBasicMaterial({ color: 0x9de7a0 }));
    crater.position.set(195, 364, 1118);
    exterior.add(crater);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(286, 24, 16), new THREE.MeshStandardMaterial({ color: 0x3e8c9a, roughness: 0.55, metalness: 0.22 }));
    moon.position.set(2100, 0, 0);
    exterior.add(moon);
    return exterior;
  }

  interior() {
    const interior = new THREE.Group();
    interior.name = "Galvan PrimeInterior";
    interior.add(new THREE.HemisphereLight(0x496d68, 0x263e38, 1.8));
    const sunlight = new THREE.DirectionalLight(0xffe0c0, 2.1);
    sunlight.position.set(-35, 70, 25);
    interior.add(sunlight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      new THREE.MeshStandardMaterial({ color: 0x263e38, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.6;
    interior.add(ground);

    for (let index = 0; index < 34; index++) {
      const angle = index * Math.PI * 2 / 34;
      const radius = 38 + (index % 5) * 15;
      const formation = new THREE.Mesh(
        new THREE.OctahedronGeometry(2 + (index % 4) * 0.7),
        new THREE.MeshStandardMaterial({ color: index % 2 ? 0x77d6a2 : 0x4c9b78, emissive: 0x123d2b, emissiveIntensity: 0.18 })
      );
      formation.position.set(Math.cos(angle) * radius, 5 + (index % 6) * 5, Math.sin(angle) * radius);
      formation.scale.y = 1.2;
      interior.add(formation);
    }

    const hub = new THREE.Group();
    hub.name = "Galvan PrimeCivicHub";
    hub.position.set(0, 0, -24);
    interior.add(hub);
    const dark = new THREE.MeshStandardMaterial({ color: 0x17231c, roughness: 0.9 });
    const accent = new THREE.MeshStandardMaterial({ color: 0x77d6a2, roughness: 0.55 });
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
    const beacon = new THREE.PointLight(0x77d6a2, 90, 38);
    beacon.position.set(0, 7, 0);
    hub.add(beacon);
    return interior;
  }
}
