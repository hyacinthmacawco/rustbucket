import * as THREE from "three";

export class Highbreed {
  static relationships = {
    Ben: 40,
    Gwen: 30,
    Kevin: 20,
    Rook: 10,
    Incursean: -64,
    Anodite: 3,
    Galvan: 16,
    Human: -56
  };

  constructor(parent = null, options = {}) {
    this.group = new THREE.Group();
    this.group.name = "Highbreed";
    this.leader = false;
    this.homeworld = "augstaka";
    this.currentWorld = null;
    this.taydenite = 350 + Math.floor(Math.random() * 251);
    this.health = 100;
    this.energy = 100;
    this.energyLabel = "VITALITY";
    this.maxHealth = 100;
    this.maxEnergy = 100;
    this.healthRecoveryDelay = 0;
    this.energyRecoveryDelay = 0;

    this.materials = {
      white: this.createMaterial(0xe8f2f1),
      shadow: this.createMaterial(0x9ba9a9),
      black: this.createMaterial(0x111319),
      red: this.createMaterial(0xb91f26),
      purple: this.createMaterial(0x51228e),
      violet: this.createMaterial(0x9a48d1)
    };

    this.createBody();
    this.createCrest();
    this.createMarkings();

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
    const { white, shadow, black, red } = this.materials;

    this.addSphere(white, 0.42, [0, 1.72, 0], [0.72, 1.25, 0.48]);
    this.addBox(white, [0.46, 0.58, 0.32], [0, 2.05, 0]);
    this.addSphere(shadow, 0.3, [0, 2.38, 0], [0.7, 0.42, 0.62]);
    this.addSphere(black, 0.34, [0, 2.67, -0.02], [0.9, 0.75, 0.75]);

    for (const side of [-1, 1]) {
      this.addPart(
        new THREE.ConeGeometry(0.13, 0.24, 3),
        red,
        [side * 0.2, 2.69, 0.29],
        [0, 0, side * 0.55]
      );

      this.addCapsule(shadow, 0.12, 0.42, [side * 0.48, 1.7, 0], [0, 0, side * 0.12]);
      this.addCapsule(white, 0.1, 0.42, [side * 0.48, 1.28, 0], [0, 0, side * 0.06]);
      this.addSphere(black, 0.15, [side * 0.48, 0.98, 0.02], [0.9, 1.2, 0.8]);
      this.addCapsule(white, 0.11, 0.43, [side * 0.18, 0.72, 0], [0, 0, side * 0.05]);
      this.addSphere(black, 0.13, [side * 0.18, 0.42, 0.03], [1.1, 0.8, 1]);
      this.addCapsule(black, 0.1, 0.4, [side * 0.72, 1.92, 0], [0, 0, side * 0.25]);
      this.addSphere(black, 0.12, [side * 0.78, 1.68, 0.02], [1.1, 0.8, 1]);
      this.addSphere(red, 0.055, [side * 0.25, 1.98, 0.27], [0.8, 1.7, 0.5]);
    }

    this.addSphere(this.materials.purple, 0.16, [0.12, 2.43, -0.34], [0.9, 1.25, 0.22]);

    for (let index = 0; index < 5; index++) {
      this.addSphere(
        this.materials.violet,
        0.035,
        [0.02 + index * 0.055, 2.4 + (index % 2) * 0.1, -0.39],
        [0.7, 1.8, 0.7]
      );
    }

    for (const side of [-1, 1]) {
      this.addCapsule(black, 0.075, 0.24, [side * 0.18, 0.18, 0]);

      for (let claw = -1; claw <= 1; claw++) {
        this.addCylinder(
          black,
          0.015,
          0.045,
          0.18,
          [side * 0.18 + claw * 0.07, 0.04, 0.1],
          [0.25, 0, 0],
          7
        );
      }
    }
  }

  createCrest() {
    const black = this.materials.black;

    this.addTendril([ -0.18, 2.88, 0 ], [ -0.62, 3.32, -0.02 ], 0.19, 0.09);
    this.addTendril([ -0.62, 3.32, -0.02 ], [ -0.9, 3.55, -0.02 ], 0.09, 0.015);
    this.addTendril([ 0.16, 2.9, 0 ], [ 0.58, 3.25, -0.04 ], 0.17, 0.075);
    this.addTendril([ 0.58, 3.25, -0.04 ], [ 0.78, 3.48, -0.04 ], 0.075, 0.012);
    this.addTendril([ 0, 2.96, -0.08 ], [ 0.04, 3.52, -0.12 ], 0.14, 0.025);
  }

  addTendril(start, end, startRadius, endRadius) {
    const from = new THREE.Vector3(...start);
    const to = new THREE.Vector3(...end);
    const direction = to.clone().sub(from);
    const mesh = this.addCylinder(
      this.materials.black,
      endRadius,
      startRadius,
      direction.length(),
      from.clone().add(to).multiplyScalar(0.5).toArray()
    );

    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );

    return mesh;
  }

  createMarkings() {
    // The dorsal purple marking and its smaller violet details are created with the body.
  }


}
