import * as THREE from "three";
import { initializeResident } from "./Human.js";

export class Incursean {
  static homeworld = "incursia";
  static relationships = { Ben: -30, Gwen: -40, Kevin: -50, Rook: -44, Highbreed: -64, Anodite: 3, Galvan: 10, Human: -36 };

  constructor(parent = null, options = {}) {
    this.name = options.name || "Incursean";
    this.leader = false;
    this.homeworld = Incursean.homeworld;
    this.health = 30;
    this.energy = 100;
    this.maxHealth = 30;
    this.maxEnergy = 100;
    this.healthRecoveryDelay = 0;
    this.energyRecoveryDelay = 0;
    this.group = new THREE.Group();
    this.group.name = this.name;
    this.materials = {
      skin: new THREE.MeshToonMaterial({ color: 0xc88b61 }),
      armor: new THREE.MeshToonMaterial({ color: 0x5b302b }),
      accent: new THREE.MeshToonMaterial({ color: 0xe7a04f }),
      dark: new THREE.MeshToonMaterial({ color: 0x241b20 })
    };

    this.addPart(new THREE.CapsuleGeometry(0.42, 0.9, 5, 8), this.materials.skin, [0, 1.25, 0]);
    this.addPart(new THREE.SphereGeometry(0.38, 16, 12), this.materials.skin, [0, 2.05, 0]);
    this.addPart(new THREE.BoxGeometry(0.72, 0.52, 0.5), this.materials.armor, [0, 1.35, 0.02]);
    this.addPart(new THREE.ConeGeometry(0.12, 0.52, 8), this.materials.accent, [-0.22, 2.35, -0.05], [0, 0, 0.25]);
    this.addPart(new THREE.ConeGeometry(0.12, 0.52, 8), this.materials.accent, [0.22, 2.35, -0.05], [0, 0, -0.25]);
    this.addPart(new THREE.CylinderGeometry(0.12, 0.08, 0.68, 10), this.materials.dark, [0, 0.35, -0.12], [Math.PI / 2, 0, 0]);
    this.addPart(new THREE.CylinderGeometry(0.18, 0.16, 0.75, 10), this.materials.armor, [-0.28, 0.45, 0]);
    this.addPart(new THREE.CylinderGeometry(0.18, 0.16, 0.75, 10), this.materials.armor, [0.28, 0.45, 0]);

    this.group.traverse(object => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        object.userData.noPhysics = true;
      }
    });
    if (parent) parent.add(this.group);
    this.mesh = this.group;
    this.group.userData.statusOwner = this;
    if (options.residentIndex !== undefined) initializeResident(this, options.residentIndex, { species: "Incursean", homeworld: Incursean.homeworld, style: { boneColor: 0xc88b61, jointColor: 0xe7a04f } });
  }

  addPart(geometry, material, position, rotation = [0, 0, 0]) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    this.group.add(mesh);
    return mesh;
  }


  attack(target) {
    if (!target || target.health <= 0) return false;
    const relationships = this.constructor.relationships || {};
    const relation = Number(relationships[target.species || target.constructor?.name] ?? relationships[target.name] ?? 0);
    if (relation >= 0) return false;
    target.takeDamage?.(2);
    return true;
  }

  awardTaydenite(account, amount = 10) { return account?.addTaydenite(amount) ?? 0; }

}
