import * as THREE from "three";

export class Earth {
  static WORLD = {
    key: "earth",
    name: "Earth",
    species: "Human",
    sky: 0x8bbce8,
    ground: 0x557c45
  };

  constructor(parent) {
    this.world = Earth.WORLD;
    this.system = "solar";
    this.root = new THREE.Group();
    this.root.name = "Earth";
    parent.add(this.root);

    this.root.add(new THREE.HemisphereLight(0x9fcfff, 0x40512e, 1.8));
    const sunlight = new THREE.DirectionalLight(0xffe4c4, 2);
    sunlight.position.set(-35, 70, 25);
    this.root.add(sunlight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      new THREE.MeshStandardMaterial({ color: 0x557c45, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.6;
    this.root.add(ground);

    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x343a40, roughness: 0.95 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(420, 12), roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -0.57, 25);
    this.root.add(road);

    const storage = new THREE.Group();
    storage.name = "KevinStorageUnit";
    storage.position.set(0, 0, -8);
    this.root.add(storage);
    this.createStorageUnit(storage);
  }

  createStorageUnit(parent) {
    const wall = new THREE.MeshStandardMaterial({ color: 0x464b46, roughness: 0.9 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x202731, roughness: 0.9 });
    const roof = new THREE.MeshStandardMaterial({ color: 0x151923, roughness: 0.9 });
    const floor = new THREE.MeshStandardMaterial({ color: 0x51545a, roughness: 0.9 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x323b46, metalness: 0.4, roughness: 0.65 });

    const addBox = (size, position, material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.position.set(...position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    addBox([34, 0.35, 32], [0, -0.2, -1], floor);
    addBox([34, 12, 0.6], [0, 5.8, -16], wall);
    addBox([0.6, 12, 31], [-17, 5.8, -0.5], dark);
    addBox([0.6, 12, 31], [17, 5.8, -0.5], dark);
    addBox([34, 0.45, 32], [0, 11.9, -1], roof);
    addBox([25.5, 3.1, 0.55], [0, 10.05, 14.2], dark);
    addBox([4.2, 7.8, 0.55], [-14.2, 4.1, 14.2], wall);
    addBox([4.2, 7.8, 0.55], [14.2, 4.1, 14.2], wall);

    for (let z = -14; z <= 10; z += 6) {
      const beam = addBox([33, 0.22, 0.22], [0, 11.3, z], metal);
      beam.rotation.y = 0;
    }
  }
}
