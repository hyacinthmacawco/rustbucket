import * as THREE from "three";
import { initializeResident } from "./Human.js";

export class Anodite {
  static homeworld = "anodyne";
  static relationships = {
    Ben: 50,
    Gwen: 70,
    Kevin: 0,
    Rook: 40,
    Highbreed: 3,
    Incursean: 3,
    Galvan: 3,
    Human: 40
  };

  constructor(parent = null, options = {}) {
    this.leader = false;
    this.homeworld = Anodite.homeworld;
    this.group = new THREE.Group();
    this.group.name = "Anodite";
    this.health = 30;
    this.energy = 100;
    this.maxHealth = 30;
    this.maxEnergy = 100;
    this.healthRecoveryDelay = 0;
    this.energyRecoveryDelay = 0;

    this.materials = {
      purple: this.createMaterial(0x873bd0),
      lilac: this.createMaterial(0xc17bf0),
      deep: this.createMaterial(0x271044),
      black: this.createMaterial(0x090812),
      white: this.createMaterial(0xf7f1ff),
      pink: this.createMaterial(0xff78c9),
      glow: this.createMaterial(0xb64cff, { emissive: 0x542080 })
    };

    this.createBody();
    this.createHair();
    this.createAura();

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
    if (options.residentIndex !== undefined) initializeResident(this, options.residentIndex, { species: "Anodite", homeworld: Anodite.homeworld, style: { boneColor: 0xc17bf0, jointColor: 0xff78c9 } });
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
    const { purple, lilac, deep, black, white, glow } = this.materials;

    this.addSphere(black, 0.31, [0, 2.35, 0], [0.78, 1.15, 0.55]);
    this.addSphere(purple, 0.37, [0, 2.82, 0], [0.9, 1.05, 0.78]);
    this.addSphere(deep, 0.22, [0, 2.83, 0.31], [0.92, 1.05, 0.25]);
    this.addSphere(black, 0.14, [0, 2.88, 0.48], [0.72, 0.85, 0.25]);

    for (const side of [-1, 1]) {
      this.addPart(
        new THREE.ConeGeometry(0.095, 0.18, 3),
        white,
        [side * 0.15, 2.88, 0.54],
        [0, 0, side * 0.5]
      );
      this.addSphere(deep, 0.055, [side * 0.15, 2.72, 0.55], [1, 0.45, 0.3]);
    }

    this.addCapsule(purple, 0.105, 0.52, [-0.42, 1.9, 0], [0, 0, -0.12]);
    this.addCapsule(purple, 0.105, 0.52, [0.42, 1.9, 0], [0, 0, 0.12]);
    this.addSphere(lilac, 0.12, [-0.48, 1.56, 0.02]);
    this.addSphere(lilac, 0.12, [0.48, 1.56, 0.02]);
    this.addCapsule(black, 0.12, 0.58, [-0.14, 1.25, 0], [0, 0, -0.03]);
    this.addCapsule(black, 0.12, 0.58, [0.14, 1.25, 0], [0, 0, 0.03]);
    this.addCapsule(purple, 0.095, 0.5, [-0.14, 0.72, 0]);
    this.addCapsule(purple, 0.095, 0.5, [0.14, 0.72, 0]);
    this.addSphere(deep, 0.11, [-0.14, 0.39, 0.02], [0.8, 0.5, 1.4]);
    this.addSphere(deep, 0.11, [0.14, 0.39, 0.02], [0.8, 0.5, 1.4]);

    for (const side of [-1, 1]) {
      this.addSphere(glow, 0.045, [side * 0.48, 1.9, 0.1], [1, 2.5, 1]);
      this.addSphere(lilac, 0.035, [side * 0.15, 0.98, 0.13], [1, 3, 1]);
    }
  }

  createHair() {
    const hairGroup = new THREE.Group();
    hairGroup.name = "AnoditeHair";
    hairGroup.position.y = 2.8;
    hairGroup.userData.noPhysics = true;
    this.group.add(hairGroup);

    const strands = [
      [[-0.18, 3.05, -0.12], [-0.55, 3.2, -0.2], [-0.8, 2.75, -0.24], [-0.72, 2.15, -0.2], [-0.3, 1.9, -0.15]],
      [[0.12, 3.08, -0.12], [0.55, 3.28, -0.2], [0.88, 2.8, -0.22], [0.95, 2.15, -0.2], [0.56, 1.75, -0.15]],
      [[0.12, 2.98, -0.12], [0.48, 2.7, -0.3], [0.7, 2.15, -0.32], [0.35, 1.72, -0.24], [-0.18, 1.45, -0.2]],
      [[-0.12, 3.02, -0.12], [-0.48, 2.6, -0.28], [-0.6, 2.1, -0.3], [-0.3, 1.65, -0.25], [0.15, 1.48, -0.2]]
    ];

    for (const points of strands) {
      const curve = new THREE.CatmullRomCurve3(
        points.map(([x, y, z]) => new THREE.Vector3(x, y - 2.8, z))
      );
      const outer = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 32, 0.105, 8, false),
        this.materials.pink
      );
      outer.castShadow = true;
      hairGroup.add(outer);

      const inner = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 32, 0.075, 8, false),
        this.materials.white
      );
      inner.position.z = 0.015;
      hairGroup.add(inner);
    }
  }

  createAura() {
    // The body already carries the luminous edge details created in createBody.
  }

  attack(target) {
    if (!target || target.health <= 0) return false;
    const relationships = this.constructor.relationships || {};
    const relation = Number(relationships[target.species || target.constructor?.name] ?? relationships[target.name] ?? 0);
    if (relation >= 0) return false;
    this.rig?._rig?.playAnimation("punch");
    target.takeDamage?.(2);
    return true;
  }

  awardTaydenite(account, amount = 10) { return account?.addTaydenite(amount) ?? 0; }

  updateStatus(delta) {
    this.healthRecoveryDelay = Math.max(0, this.healthRecoveryDelay - delta);
    this.energyRecoveryDelay = Math.max(0, this.energyRecoveryDelay - delta);
    if (this.healthRecoveryDelay === 0 && this.health < this.maxHealth) this.health = Math.min(this.maxHealth, this.health + delta * 0.32);
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

}
