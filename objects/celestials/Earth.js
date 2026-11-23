import * as THREE from "three";

export class Earth {
  static WORLD = { key: "earth", name: "Earth", species: "Human", sky: 0x8bbce8, ground: 0x557c45 };

  constructor() {
    this.world = Earth.WORLD;
    this.system = "solar";
  }

  exterior() {
    const exterior = new THREE.Group();
    exterior.name = "EarthExterior";
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0.05 });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(1300, 64, 48), material);
    globe.name = "Earth";
    exterior.add(globe);
    new THREE.TextureLoader().load("./files/textures/earth.jpg", texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      material.map = texture;
      material.needsUpdate = true;
    });
    exterior.add(new THREE.Mesh(
      new THREE.SphereGeometry(1360, 64, 48),
      new THREE.MeshBasicMaterial({ color: 0x4b9fff, transparent: true, opacity: 0.12, side: THREE.BackSide, depthWrite: false })
    ));
    exterior.add(new THREE.Mesh(
      new THREE.SphereGeometry(1456, 64, 48),
      new THREE.MeshBasicMaterial({ color: 0x216eff, transparent: true, opacity: 0.04, side: THREE.BackSide, depthWrite: false })
    ));
    return exterior;
  }

  interior() {
    const interior = new THREE.Group();
    interior.name = "EarthInterior";
    interior.add(new THREE.HemisphereLight(0x9fcfff, 0x40512e, 1.8));
    const sunlight = new THREE.DirectionalLight(0xffe4c4, 2);
    sunlight.position.set(-35, 70, 25);
    interior.add(sunlight);
    const groundCanvas = document.createElement("canvas");
    groundCanvas.width = 1024;
    groundCanvas.height = 1024;
    const groundContext = groundCanvas.getContext("2d");
    groundContext.fillStyle = "#557c45";
    groundContext.fillRect(0, 0, 1024, 1024);
    groundContext.fillStyle = "#343a40";
    groundContext.fillRect(0, 470, 1024, 84);
    groundContext.strokeStyle = "#d9d5a8";
    groundContext.lineWidth = 5;
    groundContext.setLineDash([34, 26]);
    groundContext.beginPath();
    groundContext.moveTo(0, 512);
    groundContext.lineTo(1024, 512);
    groundContext.stroke();

    const groundTexture = new THREE.CanvasTexture(groundCanvas);
    groundTexture.colorSpace = THREE.SRGBColorSpace;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      new THREE.MeshStandardMaterial({ map: groundTexture, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.6;
    interior.add(ground);
    const storage = new THREE.Group();
    storage.name = "KevinStorageUnit";
    storage.position.set(0, 0, -8);
    interior.add(storage);
    this.createStorageUnit(storage);
    return interior;
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
    for (let z = -14; z <= 10; z += 6) addBox([33, 0.22, 0.22], [0, 11.3, z], metal);
  }
}
