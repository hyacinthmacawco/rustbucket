import * as THREE from "three";

export class Galvan {
  static relationships = {
    Ben: 80,
    Gwen: 70,
    Kevin: 76,
    Rook: 84,
    Highbreed: 16,
    Incursean: 10,
    Anodite: 3,
    Human: 56
  };

  constructor(parent = null, options = {}) {
    this.group = new THREE.Group();
    this.group.name = "Galvan";
    this.homeworld = "galvan";
    this.currentWorld = null;
    this.taydenite = 350 + Math.floor(Math.random() * 251);
    this.health = 100;
    this.energy = 100;
    this.energyLabel = "ENERGY";
    this.maxHealth = 100;
    this.maxEnergy = 100;
    this.healthRecoveryDelay = 0;
    this.energyRecoveryDelay = 0;
    this.boardedShip = null;

    this.materials = {
      skin: this.createMaterial(0x8d9b8c),
      light: this.createMaterial(0xb8c5ae),
      dark: this.createMaterial(0x202b25),
      green: this.createMaterial(0x20d51d),
      suit: this.createMaterial(0x087d2b),
      trim: this.createMaterial(0x101b18)
    };

    this.createBody();

    this.group.scale.setScalar(options.scale ?? 1);
    this.group.traverse(object => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      object.userData.noPhysics = true;
      object.frustumCulled = true;
    });

    if (parent) parent.add(this.group);
    this.model = this.group;
    this.mesh = this.group;
    this.group.userData.statusOwner = this;
    this.group.userData.speciesInstance = this;
  }

  createMaterial(color, options = {}) {
    return new THREE.MeshToonMaterial({ color, ...options });
  }

  addPart(geometry, material, position, rotation = [0, 0, 0], scale = [1, 1, 1]) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);

    const outline = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: 0x08090d, side: THREE.BackSide })
    );
    outline.position.copy(mesh.position);
    outline.rotation.copy(mesh.rotation);
    outline.scale.copy(mesh.scale).multiplyScalar(1.035);
    outline.renderOrder = 1;
    outline.userData.noPhysics = true;
    this.group.add(outline);

    return mesh;
  }

  addBox(material, size, position, rotation = [0, 0, 0]) {
    return this.addPart(new THREE.BoxGeometry(...size), material, position, rotation);
  }

  addSphere(material, radius, position, scale = [1, 1, 1]) {
    return this.addPart(
      new THREE.SphereGeometry(radius, 18, 14),
      material,
      position,
      [0, 0, 0],
      scale
    );
  }

  addCylinder(material, radiusTop, radiusBottom, height, position, rotation = [0, 0, 0], radial = 12) {
    return this.addPart(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radial),
      material,
      position,
      rotation
    );
  }

  addCapsule(material, radius, length, position, rotation = [0, 0, 0]) {
    const capsule = new THREE.Group();
    capsule.position.set(...position);
    this.group.add(capsule);

    const cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, length, 12),
      material
    );
    cylinder.rotation.set(...rotation);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    capsule.add(cylinder);

    for (const direction of [-1, 1]) {
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 18, 14),
        material
      );
      cap.position.y = direction * length / 2;
      cap.castShadow = true;
      cap.receiveShadow = true;
      capsule.add(cap);
    }

    return capsule;
  }

  createBody() {
    const { skin, light, dark, green, suit, trim } = this.materials;

    this.addSphere(skin, 0.52, [0, 2.12, 0], [1.2, 0.86, 0.82]);
    this.addSphere(light, 0.36, [0, 2.02, 0.32], [1.2, 0.58, 0.5]);

    for (const side of [-1, 1]) {
      this.addSphere(dark, 0.22, [side * 0.3, 2.17, 0.55], [1.25, 0.95, 0.35]);
      this.addSphere(green, 0.155, [side * 0.3, 2.18, 0.72], [1.15, 0.86, 0.28]);
      this.addBox(dark, [0.16, 0.045, 0.045], [side * 0.3, 2.18, 0.9]);
    }

    this.addBox(skin, [0.23, 0.16, 0.2], [0, 1.7, 0.3]);
    this.addBox(suit, [0.48, 0.48, 0.28], [0, 1.35, 0]);
    this.addBox(trim, [0.32, 0.12, 0.3], [0, 1.08, 0]);
    this.addBox(suit, [0.22, 0.4, 0.2], [-0.17, 0.78, 0]);
    this.addBox(suit, [0.22, 0.4, 0.2], [0.17, 0.78, 0]);

    for (const side of [-1, 1]) {
      this.addCapsule(skin, 0.09, 0.32, [side * 0.34, 1.37, 0], [0, 0, side * 0.12]);
      this.addSphere(skin, 0.12, [side * 0.42, 1.1, 0.03], [1, 0.85, 0.8]);

      for (let finger = -1; finger <= 1; finger++) {
        this.addCylinder(
          skin,
          0.018,
          0.028,
          0.13,
          [side * 0.42 + finger * 0.045, 1.0, 0.08],
          [0.2, 0, 0],
          7
        );
      }

      this.addCapsule(suit, 0.085, 0.26, [side * 0.14, 0.45, 0]);
      this.addSphere(dark, 0.1, [side * 0.14, 0.28, 0.05], [1, 0.55, 1.3]);
    }

    this.addBox(dark, [0.26, 0.23, 0.04], [0, 1.43, 0.155]);
    this.addBox(green, [0.12, 0.12, 0.025], [0, 1.43, 0.185]);
  }

  updateStatus(delta) {
    this.healthRecoveryDelay = Math.max(0, this.healthRecoveryDelay - delta);
    this.energyRecoveryDelay = Math.max(0, this.energyRecoveryDelay - delta);
    if (this.healthRecoveryDelay === 0 && this.health < 100) this.health = Math.min(100, this.health + delta * 0.32);
    if (this.energyRecoveryDelay === 0 && this.energy < 100) this.energy = Math.min(100, this.energy + delta * 0.48);
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - Math.max(0, amount));
    this.healthRecoveryDelay = 4;
    return this.health;
  }

  useEnergy(amount) {
    if (this.energy < amount) return false;
    this.energy = Math.max(0, this.energy - amount);
    this.energyRecoveryDelay = 4;
    return true;
  }

  restoreEnergy(amount) {
    this.energy = Math.min(100, this.energy + Math.max(0, amount));
    return this.energy;
  }

  boardRustbucket(ship, seatIndex = 0) {
    if (!ship || this.boardedShip || this.homeworld === this.currentWorld) return false;
    this.group.userData.boarded = true;
    this.attachToRustbucket(ship, seatIndex);
    return true;
  }

  attachToRustbucket(ship, seatIndex = 0) {
    if (!ship) return false;
    this.boardedShip = ship;
    this.group.userData.boarded = true;
    ship.add(this.group);
    const seats = [
      [-0.58, -1.12, -1.85],
      [0.58, -1.12, -1.85],
      [-0.58, -1.12, -3.15],
      [0.58, -1.12, -3.15]
    ];
    this.group.position.set(...seats[seatIndex % seats.length]);
    this.group.rotation.set(0, Math.PI, 0);
    return true;
  }

  deliverAtHomeworld(worldKey, destination, ship) {
    if (!this.boardedShip || this.homeworld !== worldKey || !destination || !ship) return false;

    const payment = this.taydenite;
    this.taydenite = 0;
    ship.userData.statusOwner.receiveTaydenite(payment);
    this.boardedShip = null;
    this.currentWorld = worldKey;
    this.group.userData.boarded = false;
    destination.add(this.group);
    this.group.position.set(4, 0, 5);
    this.group.rotation.set(0, Math.PI, 0);
    this.group.userData.wanderOrigin = this.group.position.clone();
    this.group.userData.wanderTarget = this.group.position.clone();
    this.group.userData.wanderTimer = 1;
    this.group.userData.wanderRange = { x: 19, z: 19 };
    return payment;
  }

}
